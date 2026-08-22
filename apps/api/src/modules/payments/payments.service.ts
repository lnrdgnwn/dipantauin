import { prisma } from "@dipantauin/prisma";
import { z } from "zod";
import crypto from "crypto";
import { env } from "../../config/env";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
export const webhookSchema = z.object({
  transaction_time: z.string().optional(),
  transaction_status: z.string(),
  transaction_id: z.string().optional(),
  status_message: z.string().optional(),
  status_code: z.string(),
  signature_key: z.string(),
  payment_type: z.string().optional(),
  order_id: z.string(),
  merchant_id: z.string().optional(),
  gross_amount: z.string(),
  fraud_status: z.string().optional(),
  currency: z.string().optional()
}).passthrough();

export class PaymentsService {
  static async handleWebhook(data: z.infer<typeof webhookSchema>) {
    // 1. Verify Signature
    const hash = crypto.createHash("sha512").update(
      `${data.order_id}${data.status_code}${data.gross_amount}${env.MIDTRANS_SERVER_KEY}`
    ).digest("hex");

    if (hash !== data.signature_key) {
      throw { statusCode: 403, message: "Invalid signature key" };
    }

    const eventId = `${data.transaction_id}-${data.transaction_status}`;

    // Basic idempotency check
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { eventId }
    });

    if (existingEvent) {
      return { message: "Event already processed" };
    }

    // Find the pending payment by order_id (which is our internal Payment ID)
    const payment = await prisma.payment.findUnique({
      where: { id: data.order_id }
    });

    if (!payment) {
      return { message: "Payment not found in our system" };
    }

    let isSuccess = false;
    let isFailed = false;

    if (data.transaction_status === 'capture') {
      if (data.fraud_status === 'accept') {
        isSuccess = true;
      }
    } else if (data.transaction_status === 'settlement') {
      isSuccess = true;
    } else if (
      data.transaction_status === 'cancel' ||
      data.transaction_status === 'deny' ||
      data.transaction_status === 'expire' ||
      data.transaction_status === 'failure'
    ) {
      isFailed = true;
    }

    const eventStatus = isSuccess ? "PROCESSED" : (isFailed ? "FAILED" : "RECEIVED");

    const event = await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventId,
        eventType: data.transaction_status,
        payload: data,
        status: eventStatus,
        processedAt: new Date(),
      }
    });

    if (isSuccess) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          providerTransactionId: data.transaction_id || payment.providerTransactionId
        }
      });

      if (payment.subscriptionId) {
        await SubscriptionsService.activateAfterPayment(payment.id);
      }
    } else if (isFailed) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          providerTransactionId: data.transaction_id || payment.providerTransactionId
        }
      });

      if (payment.subscriptionId) {
        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: "PAST_DUE" } // Or cancel, depending on business logic
        });
      }
    }

    return { message: "Webhook processed successfully", eventId: event.eventId };
  }

  static async getPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        subscription: { include: { plan: true } }
      }
    });
  }
}
