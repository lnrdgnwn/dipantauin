import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../config/env";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";

const orderId = "11111111-1111-4111-8111-111111111111";
const basePayload = {
  transaction_status: "settlement",
  transaction_id: "provider-transaction",
  status_code: "200",
  order_id: orderId,
  gross_amount: "100000.00",
  fraud_status: "accept",
};

function signedPayload(overrides: Record<string, string> = {}) {
  const payload = { ...basePayload, ...overrides };
  return {
    ...payload,
    signature_key: crypto
      .createHash("sha512")
      .update(
        `${payload.order_id}${payload.status_code}${payload.gross_amount}${env.MIDTRANS_SERVER_KEY}`,
      )
      .digest("hex"),
  };
}

const payment = {
  id: orderId,
  amount: 100000,
  subscriptionId: "subscription-id",
  providerTransactionId: orderId,
  subscription: { userId: "user-id", plan: { code: "PRO" } },
};

describe("PaymentsService webhook", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects an invalid signature before database effects", async () => {
    const processEvent = vi.spyOn(PaymentsRepository, "processEvent");
    await expect(
      PaymentsService.handleWebhook({
        ...signedPayload(),
        signature_key: "0".repeat(128),
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(processEvent).not.toHaveBeenCalled();
  });

  it("maps a valid settlement to one paid business effect", async () => {
    vi.spyOn(PaymentsRepository, "findById").mockResolvedValue(payment as never);
    vi.spyOn(PaymentsRepository, "findEvent").mockResolvedValue(null);
    const processEvent = vi
      .spyOn(PaymentsRepository, "processEvent")
      .mockResolvedValue(undefined);

    await PaymentsService.handleWebhook(signedPayload());
    expect(processEvent).toHaveBeenCalledOnce();
    expect(processEvent.mock.calls[0]?.[0]).toMatchObject({
      eventStatus: "PROCESSED",
      isPaid: true,
      failedStatus: null,
    });
  });

  it("treats a duplicate event as idempotent", async () => {
    vi.spyOn(PaymentsRepository, "findById").mockResolvedValue(payment as never);
    vi.spyOn(PaymentsRepository, "findEvent").mockResolvedValue({ id: "event" });
    const processEvent = vi.spyOn(PaymentsRepository, "processEvent");

    const result = await PaymentsService.handleWebhook(signedPayload());
    expect(result.message).toBe("Event already processed");
    expect(processEvent).not.toHaveBeenCalled();
  });

  it("records an unsupported pending status without changing payment state", async () => {
    vi.spyOn(PaymentsRepository, "findById").mockResolvedValue(payment as never);
    vi.spyOn(PaymentsRepository, "findEvent").mockResolvedValue(null);
    const processEvent = vi
      .spyOn(PaymentsRepository, "processEvent")
      .mockResolvedValue(undefined);

    await PaymentsService.handleWebhook(
      signedPayload({ transaction_status: "pending" }),
    );
    expect(processEvent.mock.calls[0]?.[0]).toMatchObject({
      eventStatus: "RECEIVED",
      isPaid: false,
      failedStatus: null,
    });
  });
});
