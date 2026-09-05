import { prisma } from "@dipantauin/prisma";
import {
  PaymentStatus,
  PriceCheckStatus,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

type PageQuery = { cursor?: string; limit: number; search?: string };
type UsersQuery = PageQuery & { role?: UserRole; status?: UserStatus };
type SubscriptionsQuery = PageQuery & {
  status?: SubscriptionStatus;
  plan?: string;
};
type PaymentsQuery = PageQuery & { status?: PaymentStatus; orderId?: string };
type PriceChecksQuery = PageQuery & {
  status?: PriceCheckStatus;
  marketplace?: string;
};

export class AdminRepository {
  static async getDashboardSummary() {
    const [totalUsers, activeUsers, activeSubscriptions, trackedProducts, revenue] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.userProduct.count({ where: { isActive: true } }),
        prisma.payment.aggregate({
          where: { status: "PAID" },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      activeSubscriptions,
      trackedProducts,
      totalRevenue: Number(revenue._sum.amount ?? 0),
    };
  }

  static findUsers(query: UsersQuery) {
    return prisma.user.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search } },
                { email: { contains: query.search } },
              ],
            }
          : {}),
        role: query.role,
        status: query.status,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { userProducts: true } },
      },
    });
  }

  static findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { plan: true },
        },
        _count: { select: { userProducts: true, payments: true } },
      },
    });
  }

  static updateUserStatus(userId: string, status: UserStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, status: true },
    });
  }

  static createPlan(data: {
    code: string;
    name: string;
    price: number;
    currency: string;
    maxProducts: number;
    checkIntervalMin: number;
    isActive: boolean;
  }) {
    return prisma.plan.create({ data });
  }

  static updatePlan(
    planId: string,
    data: Partial<{
      code: string;
      name: string;
      price: number;
      currency: string;
      maxProducts: number;
      checkIntervalMin: number;
      isActive: boolean;
    }>,
  ) {
    return prisma.plan.update({ where: { id: planId }, data });
  }

  static findSubscriptions(query: SubscriptionsQuery) {
    return prisma.subscription.findMany({
      where: {
        status: query.status,
        ...(query.plan ? { plan: { code: query.plan } } : {}),
        ...(query.search
          ? {
              user: {
                OR: [
                  { name: { contains: query.search } },
                  { email: { contains: query.search } },
                ],
              },
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { user: { select: { email: true, name: true } }, plan: true },
    });
  }

  static findSubscriptionById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  static findSubscriptionDetail(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, status: true } },
        plan: true,
        payments: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
  }

  static cancelSubscription(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    });
  }

  static findPayments(query: PaymentsQuery) {
    return prisma.payment.findMany({
      where: {
        status: query.status,
        ...(query.orderId
          ? { providerTransactionId: { contains: query.orderId } }
          : {}),
        ...(query.search
          ? {
              user: {
                OR: [
                  { name: { contains: query.search } },
                  { email: { contains: query.search } },
                ],
              },
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        user: { select: { email: true, name: true } },
        subscription: { include: { plan: true } },
      },
    });
  }

  static findPaymentDetail(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, status: true } },
        subscription: { include: { plan: true } },
        events: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            eventId: true,
            eventType: true,
            status: true,
            processedAt: true,
            createdAt: true,
          },
        },
      },
    });
  }

  static findPriceChecks(query: PriceChecksQuery) {
    return prisma.priceCheck.findMany({
      where: {
        status: query.status,
        ...(query.marketplace
          ? { product: { platform: query.marketplace } }
          : {}),
        ...(query.search
          ? { product: { name: { contains: query.search } } }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor
        ? { cursor: { id: BigInt(query.cursor) }, skip: 1 }
        : {}),
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
        createdAt: true,
        product: { select: { id: true, name: true, platform: true } },
      },
    });
  }
}
