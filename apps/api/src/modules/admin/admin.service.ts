import {prisma} from "@dipantauin/prisma";
import { z } from "zod";
import { UserStatus } from "@prisma/client";

export const createPlanSchema = z.object({
  code: z.string(),
  name: z.string(),
  price: z.number(),
  currency: z.string().default("IDR"),
  maxProducts: z.number(),
  checkIntervalMin: z.number(),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export class AdminService {
  // USERS
  static async getUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  static async updateUserStatus(userId: string, data: z.infer<typeof updateUserStatusSchema>) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: data.status },
      select: { id: true, email: true, status: true },
    });
  }

  // PLANS
  static async createPlan(data: z.infer<typeof createPlanSchema>) {
    return prisma.plan.create({
      data,
    });
  }

  static async updatePlan(planId: string, data: z.infer<typeof updatePlanSchema>) {
    return prisma.plan.update({
      where: { id: planId },
      data,
    });
  }

  // SUBSCRIPTIONS
  static async getAllSubscriptions() {
    return prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        plan: true,
      },
    });
  }

  static async cancelSubscription(subId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subId },
    });
    if (!sub) throw { statusCode: 404, message: "Subscription not found" };

    return prisma.subscription.update({
      where: { id: subId },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });
  }

  // PAYMENTS
  static async getAllPayments() {
    return prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        subscription: { include: { plan: true } },
      },
    });
  }
}
