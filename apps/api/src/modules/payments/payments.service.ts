import crypto from "crypto";
import { z } from "zod";
import { env } from "../../config/env";
import { PaymentsRepository } from "./payments.repository";

export const webhookSchema = z
  .object({
    transaction_time: z.string().optional(),
    transaction_status: z.string().min(1).max(50),
    transaction_id: z.string().max(255).optional(),
    status_message: z.string().max(500).optional(),
    status_code: z.string().regex(/^\d{3}$/),
    signature_key: z.string().regex(/^[a-fA-F0-9]{128}$/),
    payment_type: z.string().max(50).optional(),
    order_id: z.string().uuid(),
    merchant_id: z.string().max(100).optional(),
    gross_amount: z
      .string()
      .regex(/^\d+(?:\.\d{1,2})?$/)
      .max(30),
    fraud_status: z.string().max(50).optional(),
    currency: z.string().length(3).optional(),
  })
  .passthrough();

function signatureFor(data: z.infer<typeof webhookSchema>) {
  return crypto
    .createHash("sha512")
    .update(
      `${data.order_id}${data.status_code}${data.gross_amount}${env.MIDTRANS_SERVER_KEY}`,
    )
    .digest("hex");
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export class PaymentsService {
  static async handleWebhook(data: z.infer<typeof webhookSchema>) {
    const expected = signatureFor(data);
    if (!signaturesMatch(expected, data.signature_key)) {
      throw { statusCode: 401, message: "Invalid signature key" };
    }

    const eventId = `${data.order_id}:${data.transaction_id || "unknown"}:${data.transaction_status}:${data.status_code}`;
    const payment = await PaymentsRepository.findById(data.order_id);
    if (!payment) {
      // A 404 lets Midtrans retry while avoiding writes for an unknown order.
      throw { statusCode: 404, message: "Payment not found in our system" };
    }
    if (Number(data.gross_amount) !== Number(payment.amount)) {
      throw { statusCode: 422, message: "Payment amount does not match" };
    }

    const existingEvent = await PaymentsRepository.findEvent(eventId);
    if (existingEvent) return { message: "Event already processed", eventId };

    const isPaid =
      data.transaction_status === "settlement" ||
      (data.transaction_status === "capture" && data.fraud_status === "accept");
    const failedStatus =
      data.transaction_status === "expire"
        ? "EXPIRED"
        : data.transaction_status === "refund" ||
            data.transaction_status === "partial_refund"
          ? "REFUNDED"
          : data.transaction_status === "cancel" ||
              data.transaction_status === "deny" ||
              data.transaction_status === "failure"
            ? "FAILED"
            : null;
    const eventStatus = isPaid
      ? "PROCESSED"
      : failedStatus
        ? "FAILED"
        : "RECEIVED";
    const now = new Date();
    const { signature_key: _signature, ...safePayload } = data;

    const paidPeriodEnd =
      isPaid && payment.subscription
        ? new Date(
            now.getTime() +
              (payment.subscription.plan.code === "PRO" ? 30 : 7) *
                24 *
                60 *
                60 *
                1000,
          )
        : undefined;
    await PaymentsRepository.processEvent({
      payment,
      eventId,
      eventType: data.transaction_status,
      payload: JSON.parse(JSON.stringify(safePayload)),
      eventStatus,
      isPaid,
      failedStatus,
      providerTransactionId: data.transaction_id,
      now,
      paidPeriodEnd,
    });

    if (env.NODE_ENV !== "production") {
      console.info("[Payment webhook] processed", {
        timestamp: now.toISOString(),
        method: "POST",
        path: "/api/payments/webhook",
        contentType: "application/json",
        orderId: data.order_id,
        keys: Object.keys(data),
        result: eventStatus,
      });
    }
    return { message: "Webhook processed successfully", eventId };
  }

  static async getPayments(userId: string) {
    return PaymentsRepository.findForUser(userId);
  }

  static async getPayment(userId: string, id: string) {
    const payment = await PaymentsRepository.findForUserById(userId, id);
    if (!payment) throw { statusCode: 404, message: "Payment not found" };
    return payment;
  }
}
