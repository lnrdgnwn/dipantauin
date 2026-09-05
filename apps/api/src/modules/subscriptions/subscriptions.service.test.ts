import { beforeEach, describe, expect, it, vi } from "vitest";
import { snap } from "../../config/midtrans";
import { SubscriptionsRepository } from "./subscriptions.repository";
import { SubscriptionsService, checkoutSchema } from "./subscriptions.service";

const userId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-09-05T00:00:00.000Z");

function plan(overrides: Record<string, unknown> = {}) {
  return {
    id: planId,
    code: "PRO",
    name: "Pro",
    price: 50_000,
    currency: "IDR",
    maxProducts: 20,
    checkIntervalMin: 60,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("SubscriptionsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  it("expires paid subscriptions and falls back to FREE", async () => {
    vi.spyOn(SubscriptionsRepository, "findActive").mockResolvedValue([
      { id: "expired", currentPeriodEnd: new Date("2026-09-04"), plan: { code: "PRO" } },
    ] as never);
    vi.spyOn(SubscriptionsRepository, "expireMany").mockResolvedValue({ count: 1 });
    const free = plan({ id: "free", code: "FREE", price: 0, maxProducts: 3 });
    vi.spyOn(SubscriptionsRepository, "findFreePlan").mockResolvedValue(free as never);
    const fallback = vi.spyOn(SubscriptionsRepository, "applyFreeFallback").mockResolvedValue(undefined);

    await SubscriptionsService.syncSubscriptionStatus(userId);

    expect(SubscriptionsRepository.expireMany).toHaveBeenCalledWith(["expired"]);
    expect(fallback).toHaveBeenCalledWith(userId, free, now, expect.any(Date));
  });

  it("keeps a valid subscription without creating a FREE fallback", async () => {
    vi.spyOn(SubscriptionsRepository, "findActive").mockResolvedValue([
      { id: "active", currentPeriodEnd: new Date("2026-10-05"), plan: { code: "PRO" } },
    ] as never);
    vi.spyOn(SubscriptionsRepository, "expireMany").mockResolvedValue({ count: 0 });
    const findFree = vi.spyOn(SubscriptionsRepository, "findFreePlan");

    await SubscriptionsService.syncSubscriptionStatus(userId);

    expect(findFree).not.toHaveBeenCalled();
  });

  it("returns an inactive empty status when no subscription exists", async () => {
    vi.spyOn(SubscriptionsService, "syncSubscriptionStatus").mockResolvedValue(undefined);
    vi.spyOn(SubscriptionsRepository, "findLatest").mockResolvedValue(null);
    await expect(SubscriptionsService.getSubscriptionStatus(userId)).resolves.toEqual({
      hasSubscription: false,
      isActive: false,
      plan: null,
      status: null,
      expiresAt: null,
      daysRemaining: null,
    });
  });

  it("reports remaining days for an active subscription", async () => {
    vi.spyOn(SubscriptionsService, "syncSubscriptionStatus").mockResolvedValue(undefined);
    vi.spyOn(SubscriptionsRepository, "findLatest").mockResolvedValue({
      status: "ACTIVE",
      currentPeriodEnd: new Date("2026-09-08T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      plan: plan(),
    } as never);
    const result = await SubscriptionsService.getSubscriptionStatus(userId);
    expect(result).toMatchObject({ isActive: true, daysRemaining: 3, status: "ACTIVE" });
  });

  it.each([
    [null, 404, "Plan not found"],
    [plan({ isActive: false }), 400, "This plan is no longer available"],
  ])("rejects an unavailable checkout plan", async (value, statusCode, message) => {
    vi.spyOn(SubscriptionsRepository, "findPlanById").mockResolvedValue(value as never);
    await expect(SubscriptionsService.checkout(userId, { planId })).rejects.toMatchObject({ statusCode, message });
  });

  it("rejects checkout when a paid subscription is already active", async () => {
    vi.spyOn(SubscriptionsRepository, "findPlanById").mockResolvedValue(plan() as never);
    vi.spyOn(SubscriptionsRepository, "findCurrentSubscription").mockResolvedValue({ plan: { code: "PRO" } } as never);
    await expect(SubscriptionsService.checkout(userId, { planId })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("activates a free checkout without contacting Midtrans", async () => {
    const free = plan({ code: "FREE", price: 0 });
    vi.spyOn(SubscriptionsRepository, "findPlanById").mockResolvedValue(free as never);
    vi.spyOn(SubscriptionsRepository, "findCurrentSubscription").mockResolvedValue(null);
    vi.spyOn(SubscriptionsRepository, "createCheckout").mockResolvedValue({ subscription: { id: "sub" }, payment: null } as never);
    const midtrans = vi.spyOn(snap, "createTransaction");

    await expect(SubscriptionsService.checkout(userId, { planId })).resolves.toMatchObject({ isFree: true });
    expect(midtrans).not.toHaveBeenCalled();
  });

  it("creates a paid Midtrans checkout with the account email", async () => {
    vi.spyOn(SubscriptionsRepository, "findPlanById").mockResolvedValue(plan() as never);
    vi.spyOn(SubscriptionsRepository, "findCurrentSubscription").mockResolvedValue(null);
    vi.spyOn(SubscriptionsRepository, "createCheckout").mockResolvedValue({ subscription: { id: "sub" }, payment: { id: "pay" } } as never);
    vi.spyOn(SubscriptionsRepository, "findUserEmail").mockResolvedValue({ email: "owner@example.com" });
    const midtrans = vi.spyOn(snap, "createTransaction").mockResolvedValue({ redirect_url: "https://pay.test", token: "token" } as never);

    const result = await SubscriptionsService.checkout(userId, { planId });

    expect(result).toMatchObject({ isFree: false, paymentId: "pay", snapToken: "token" });
    expect(midtrans).toHaveBeenCalledWith(expect.objectContaining({
      transaction_details: { order_id: "pay", gross_amount: 50_000 },
      customer_details: { email: "owner@example.com" },
    }));
  });

  it("validates checkout IDs and cancellation existence", async () => {
    expect(checkoutSchema.safeParse({ planId: "invalid" }).success).toBe(false);
    vi.spyOn(SubscriptionsRepository, "findCurrentSubscription").mockResolvedValue(null);
    await expect(SubscriptionsService.cancel(userId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("activates the paid subscription and cancels competing entitlements", async () => {
    vi.spyOn(SubscriptionsRepository, "findPaymentSubscription").mockResolvedValue({
      subscription: { id: "sub", userId, plan: { code: "PRO" } },
    } as never);
    const activate = vi.spyOn(SubscriptionsRepository, "activate").mockResolvedValue(undefined);
    await expect(SubscriptionsService.activateAfterPayment("pay")).resolves.toMatchObject({ subscriptionId: "sub" });
    expect(activate).toHaveBeenCalledWith("sub", userId, now, new Date("2026-10-05T00:00:00.000Z"));
  });
});
