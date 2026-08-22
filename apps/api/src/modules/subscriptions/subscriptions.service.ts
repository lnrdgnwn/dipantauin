import { prisma } from "@dipantauin/prisma";
import { z } from "zod";
import { snap } from "../../config/midtrans";
import { env } from "../../config/env";

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
    const activeSubs = await prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
    });

    let hasValidActive = false;
    for (const sub of activeSubs) {
      if (sub.currentPeriodEnd > now || sub.plan.code === "FREE") {
        hasValidActive = true;
      } else {
        // Expired paid plan
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });
      }
    }

    // Revert to FREE if no valid active subscription
    if (!hasValidActive) {
      const freePlan = await prisma.plan.findFirst({ where: { code: "FREE" } });
      if (freePlan) {
        // Disable any other existing free plans that might be stuck
        await prisma.subscription.updateMany({
          where: { userId, status: "ACTIVE" },
          data: { status: "CANCELLED" },
        });

        await prisma.subscription.create({
          data: {
            userId,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: calcPeriodEnd("FREE"),
          },
        });
      }
    }
  }
  /** GET /subscription - returns active subscription or null */
  static async getMySubscription(userId: string) {
    await this.syncSubscriptionStatus(userId);

    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE"] },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    return sub ?? null;
  }

  /** GET /subscription/status - returns simple status summary */
  static async getSubscriptionStatus(userId: string) {
    await this.syncSubscriptionStatus(userId);

    const now = new Date();

    const sub = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

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
        (1000 * 60 * 60 * 24)
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
    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });

    if (!plan) {
      throw { statusCode: 404, message: "Plan not found" };
    }

    if (!plan.isActive) {
      throw { statusCode: 400, message: "This plan is no longer available" };
    }

    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: { plan: true },
    });

    if (existingSub && existingSub.plan.code !== "FREE") {
      throw {
        statusCode: 409,
        message: "You already have an active subscription. Cancel it first.",
      };
    }

    const now = new Date();
    const periodEnd = calcPeriodEnd(plan.code);

    const { subscription, payment } = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: Number(plan.price) === 0 ? "ACTIVE" : "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      let pay = null;
      if (Number(plan.price) > 0) {
        pay = await tx.payment.create({
          data: {
            userId,
            subscriptionId: sub.id,
            amount: plan.price,
            currency: plan.currency,
            provider: "midtrans",
            providerTransactionId: `pending-${sub.id}`,
            status: "PENDING",
          },
        });
      }

      return { subscription: sub, payment: pay };
    });

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
      }
    };

    const user = await prisma.user.findUnique({ where: { id: userId } });
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
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) {
      throw { statusCode: 404, message: "Active subscription not found" };
    }

    return prisma.subscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Called internally (by PaymentsService)
   */
  static async activateAfterPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!payment || !payment.subscription) {
      return null;
    }

    const { subscription } = payment;
    const now = new Date();
    const newPeriodEnd = calcPeriodEnd(subscription.plan.code);

    await prisma.$transaction(async (tx) => {
      // Cancel previous active subscriptions for this user
      await tx.subscription.updateMany({
        where: {
          userId: subscription.userId,
          id: { not: subscription.id },
          status: { in: ["ACTIVE", "TRIALING"] },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
        },
      });

      // Activate the new subscription
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      });
    });

    return { subscriptionId: subscription.id, activatedAt: now };
  }
}
