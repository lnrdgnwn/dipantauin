import { z } from "zod";
import { snap } from "../../config/midtrans";
import { env } from "../../config/env";
import { SubscriptionsRepository } from "./subscriptions.repository";

export const checkoutSchema = z.object({
  planId: z.string().uuid(),
});

const PLAN_DURATION_DAYS: Record<string, number> = {
  FREE: 36500, // ~100 years (forever)
  PRO: 30,
};

function calcPeriodEnd(planCode: string): Date {
  const days = PLAN_DURATION_DAYS[planCode] ?? 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export class SubscriptionsService {
  /** Check for expired subscriptions and fallback to FREE if none active */
  static async syncSubscriptionStatus(userId: string) {
    const now = new Date();
    const activeSubs = await SubscriptionsRepository.findActive(userId);

    let hasValidActive = false;
    const expiredIds: string[] = [];
    for (const sub of activeSubs) {
      if (sub.currentPeriodEnd > now || sub.plan.code === "FREE") {
        hasValidActive = true;
      } else {
        // Expired paid plan
        expiredIds.push(sub.id);
      }
    }
    await SubscriptionsRepository.expireMany(expiredIds);

    // Revert to FREE if no valid active subscription
    if (!hasValidActive) {
      const freePlan = await SubscriptionsRepository.findFreePlan();
      if (freePlan) {
        await SubscriptionsRepository.applyFreeFallback(
          userId,
          freePlan,
          now,
          calcPeriodEnd("FREE"),
        );
      }
    }
  }
  /** GET /subscription - returns active subscription or null */
  static async getMySubscription(userId: string) {
    await this.syncSubscriptionStatus(userId);

    const sub = await SubscriptionsRepository.findLatestActive(userId);
    return sub ?? null;
  }

  /** GET /subscription/status - returns simple status summary */
  static async getSubscriptionStatus(userId: string) {
    await this.syncSubscriptionStatus(userId);

    const now = new Date();

    const sub = await SubscriptionsRepository.findLatest(userId);

    if (!sub) {
      return {
        hasSubscription: false,
        isActive: false,
        plan: null,
        status: null,
        expiresAt: null,
        daysRemaining: null,
      };
    }

    const isActive =
      (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
      sub.currentPeriodEnd > now;

    const daysRemaining = isActive
      ? Math.ceil(
          (sub.currentPeriodEnd.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      hasSubscription: true,
      isActive,
      plan: {
        id: sub.plan.id,
        code: sub.plan.code,
        name: sub.plan.name,
        maxProducts: sub.plan.maxProducts,
        checkIntervalMin: sub.plan.checkIntervalMin,
      },
      status: sub.status,
      expiresAt: sub.currentPeriodEnd,
      daysRemaining,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }

  /**
   * POST /subscription/checkout
   */
  static async checkout(userId: string, data: z.infer<typeof checkoutSchema>) {
    const plan = await SubscriptionsRepository.findPlanById(data.planId);

    if (!plan) {
      throw { statusCode: 404, message: "Plan not found" };
    }

    if (!plan.isActive) {
      throw { statusCode: 400, message: "This plan is no longer available" };
    }

    const existingSub =
      await SubscriptionsRepository.findCurrentSubscription(userId);

    if (existingSub && existingSub.plan.code !== "FREE") {
      throw {
        statusCode: 409,
        message: "You already have an active subscription. Cancel it first.",
      };
    }

    const now = new Date();
    const periodEnd = calcPeriodEnd(plan.code);

    const { subscription, payment } =
      await SubscriptionsRepository.createCheckout(
        userId,
        plan,
        now,
        periodEnd,
      );

    if (Number(plan.price) === 0) {
      return {
        isFree: true,
        message: "Free plan activated successfully",
        subscription,
      };
    }

    const parameter: any = {
      transaction_details: {
        order_id: payment!.id,
        gross_amount: Number(plan.price),
      },
      customer_details: {
        email: "user@example.com",
      },
      enabled_payments: ["other_qris"],
      callbacks: {
        finish: `${env.FRONTEND_URL}`,
        error: `${env.FRONTEND_URL}`,
        pending: `${env.FRONTEND_URL}`,
      },
    };

    const user = await SubscriptionsRepository.findUserEmail(userId);
    if (user && user.email) {
      parameter.customer_details.email = user.email;
    }

    const transaction = await snap.createTransaction(parameter);

    return {
      isFree: false,
      checkoutUrl: transaction.redirect_url,
      snapToken: transaction.token,
      paymentId: payment!.id,
      amount: plan.price,
      currency: plan.currency,
      subscription,
    };
  }

  /** POST /subscription/cancel */
  static async cancel(userId: string) {
    const sub = await SubscriptionsRepository.findCurrentSubscription(userId);

    if (!sub) {
      throw { statusCode: 404, message: "Active subscription not found" };
    }

    return SubscriptionsRepository.cancelById(sub.id);
  }

  /**
   * Called internally (by PaymentsService)
   */
  static async activateAfterPayment(paymentId: string) {
    const payment =
      await SubscriptionsRepository.findPaymentSubscription(paymentId);

    if (!payment || !payment.subscription) {
      return null;
    }

    const { subscription } = payment;
    const now = new Date();
    const newPeriodEnd = calcPeriodEnd(subscription.plan.code);

    await SubscriptionsRepository.activate(
      subscription.id,
      subscription.userId,
      now,
      newPeriodEnd,
    );

    return { subscriptionId: subscription.id, activatedAt: now };
  }
}
