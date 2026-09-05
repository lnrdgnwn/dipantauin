import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  paymentEventCreate: vi.fn(),
  paymentUpdate: vi.fn(),
  subscriptionUpdate: vi.fn(),
  subscriptionUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@dipantauin/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    payment: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    paymentEvent: { findUnique: vi.fn() },
  },
}));

import { PaymentsRepository } from "./payments.repository";

const now = new Date("2026-09-05T00:00:00.000Z");
const paidPeriodEnd = new Date("2026-10-05T00:00:00.000Z");
const payment = {
  id: "payment",
  subscriptionId: "subscription",
  providerTransactionId: "pending-subscription",
  subscription: { userId: "user", plan: { code: "PRO" } },
};

function input(overrides: Record<string, unknown> = {}) {
  return {
    payment,
    eventId: "event",
    eventType: "settlement",
    payload: { transaction_status: "settlement" },
    eventStatus: "PROCESSED" as const,
    isPaid: true,
    failedStatus: null,
    providerTransactionId: "provider-transaction",
    now,
    paidPeriodEnd,
    ...overrides,
  };
}

describe("PaymentsRepository.processEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      paymentEvent: { create: mocks.paymentEventCreate },
      payment: { update: mocks.paymentUpdate },
      subscription: { update: mocks.subscriptionUpdate, updateMany: mocks.subscriptionUpdateMany },
    }));
  });

  it("records an audit event and atomically activates a paid subscription", async () => {
    await PaymentsRepository.processEvent(input());

    expect(mocks.paymentEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ eventId: "event", paymentId: "payment", status: "PROCESSED" }) });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({ where: { id: "payment" }, data: { status: "PAID", paidAt: now, providerTransactionId: "provider-transaction" } });
    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "user", id: { not: "subscription" } }),
      data: { status: "CANCELLED", cancelledAt: now },
    }));
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: "subscription" },
      data: { status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: paidPeriodEnd, cancelAtPeriodEnd: false, cancelledAt: null },
    });
  });

  it.each([
    ["EXPIRED", "EXPIRED"],
    ["FAILED", "CANCELLED"],
    ["REFUNDED", "CANCELLED"],
  ] as const)("maps payment %s to subscription %s", async (failedStatus, subscriptionStatus) => {
    await PaymentsRepository.processEvent(input({ isPaid: false, failedStatus, eventType: failedStatus.toLowerCase() }));
    expect(mocks.paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: failedStatus }) }));
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: "subscription" },
      data: { status: subscriptionStatus, cancelledAt: now },
    });
    expect(mocks.subscriptionUpdateMany).not.toHaveBeenCalled();
  });

  it("stores unsupported events without changing business state", async () => {
    await PaymentsRepository.processEvent(input({ isPaid: false, failedStatus: null, eventStatus: "RECEIVED", eventType: "pending" }));
    expect(mocks.paymentEventCreate).toHaveBeenCalledOnce();
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
  });
});
