import { prisma } from "@dipantauin/prisma";
import type { Plan } from "@prisma/client";

export class SubscriptionsRepository {
  static findActive(userId: string) {
    return prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
    });
  }

  static expireMany(ids: string[]) {
    if (ids.length === 0) return Promise.resolve({ count: 0 });
    return prisma.subscription.updateMany({
      where: { id: { in: ids } },
      data: { status: "EXPIRED" },
    });
  }

  static findFreePlan() {
    return prisma.plan.findFirst({ where: { code: "FREE", isActive: true } });
  }

  static applyFreeFallback(
    userId: string,
    plan: Plan,
    now: Date,
    currentPeriodEnd: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      });
      await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd,
        },
      });
      const retained = await tx.userProduct.findMany({
        where: { userId, isActive: true },
        select: { id: true, productId: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: plan.maxProducts,
      });
      const retainedIds = retained.map(({ id }) => id);
      await tx.userProduct.updateMany({
        where: {
          userId,
          isActive: true,
          ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}),
        },
        data: { isActive: false },
      });
      if (retained.length > 0) {
        const nextCheckAt = new Date(
          now.getTime() + plan.checkIntervalMin * 60 * 1000,
        );
        await tx.product.updateMany({
          where: { id: { in: retained.map(({ productId }) => productId) } },
          data: { nextCheckAt },
        });
      }
    });
  }

  static findLatestActive(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static findLatest(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static findPlanById(id: string) {
    return prisma.plan.findUnique({ where: { id } });
  }

  static findCurrentSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static createCheckout(
    userId: string,
    plan: Plan,
    now: Date,
    currentPeriodEnd: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: Number(plan.price) === 0 ? "ACTIVE" : "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd,
        },
      });
      const payment =
        Number(plan.price) === 0
          ? null
          : await tx.payment.create({
              data: {
                userId,
                subscriptionId: subscription.id,
                amount: plan.price,
                currency: plan.currency,
                provider: "midtrans",
                providerTransactionId: `pending-${subscription.id}`,
                status: "PENDING",
              },
            });
      return { subscription, payment };
    });
  }

  static findUserEmail(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
  }

  static cancelById(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    });
  }

  static findPaymentSubscription(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: { include: { plan: true } } },
    });
  }

  static activate(
    subscriptionId: string,
    userId: string,
    now: Date,
    currentPeriodEnd: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          userId,
          id: { not: subscriptionId },
          status: { in: ["ACTIVE", "TRIALING"] },
        },
        data: { status: "CANCELLED", cancelledAt: now },
      });
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      });
    });
  }
}
