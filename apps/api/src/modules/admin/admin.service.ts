import { z } from "zod";
import {
  PaymentStatus,
  PriceCheckStatus,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { AdminRepository } from "./admin.repository";

const pageSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});
export const adminUsersQuerySchema = pageSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});
export const adminSubscriptionsQuerySchema = pageSchema.extend({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  plan: z.string().trim().max(50).optional(),
});
export const adminPaymentsQuerySchema = pageSchema.extend({
  status: z.nativeEnum(PaymentStatus).optional(),
  orderId: z.string().trim().max(255).optional(),
});
export const adminPriceChecksQuerySchema = pageSchema.extend({
  cursor: z.string().regex(/^\d+$/).optional(),
  status: z.nativeEnum(PriceCheckStatus).optional(),
  marketplace: z.enum(["TOKOPEDIA", "SHOPEE", "BLIBLI"]).optional(),
});

function pageResult<T extends { id: unknown }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    pageInfo: {
      hasMore,
      nextCursor: hasMore ? String(items.at(-1)?.id) : null,
    },
  };
}

function safeCheckSummary(message: string | null) {
  if (!message) return null;
  if (/timeout|abort/i.test(message))
    return "Marketplace tidak merespons tepat waktu";
  if (/403|429|blocked|rate/i.test(message))
    return "Permintaan dibatasi marketplace";
  if (/parse|price|name/i.test(message))
    return "Data produk tidak dapat dibaca";
  return "Pemeriksaan marketplace gagal";
}

export const createPlanSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9_-]+$/),
    name: z.string().trim().min(1).max(100),
    price: z.number().nonnegative(),
    currency: z.string().length(3).default("IDR"),
    maxProducts: z.number().int().positive(),
    checkIntervalMin: z.number().int().positive(),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updatePlanSchema = createPlanSchema.partial();

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export class AdminService {
  static getDashboardSummary() {
    return AdminRepository.getDashboardSummary();
  }

  // USERS
  static async getUsers(query: z.infer<typeof adminUsersQuerySchema>) {
    const rows = await AdminRepository.findUsers(query);
    return pageResult(
      rows.map(({ _count, ...user }) => ({
        ...user,
        trackedProductsCount: _count.userProducts,
      })),
      query.limit,
    );
  }

  static async getUser(userId: string) {
    const user = await AdminRepository.findUserById(userId);
    if (!user) throw { statusCode: 404, message: "User not found" };
    const { _count, ...data } = user;
    return {
      ...data,
      trackedProductsCount: _count.userProducts,
      paymentsCount: _count.payments,
    };
  }

  static async updateUserStatus(
    userId: string,
    data: z.infer<typeof updateUserStatusSchema>,
  ) {
    return AdminRepository.updateUserStatus(userId, data.status);
  }

  // PLANS
  static async createPlan(data: z.infer<typeof createPlanSchema>) {
    return AdminRepository.createPlan(data);
  }

  static async updatePlan(
    planId: string,
    data: z.infer<typeof updatePlanSchema>,
  ) {
    return AdminRepository.updatePlan(planId, data);
  }

  // SUBSCRIPTIONS
  static async getAllSubscriptions(
    query: z.infer<typeof adminSubscriptionsQuerySchema>,
  ) {
    const rows = await AdminRepository.findSubscriptions(query);
    return pageResult(rows, query.limit);
  }

  static async getSubscription(id: string) {
    const subscription = await AdminRepository.findSubscriptionDetail(id);
    if (!subscription)
      throw { statusCode: 404, message: "Subscription not found" };
    return subscription;
  }

  static async cancelSubscription(subId: string) {
    const sub = await AdminRepository.findSubscriptionById(subId);
    if (!sub) throw { statusCode: 404, message: "Subscription not found" };

    return AdminRepository.cancelSubscription(subId);
  }

  // PAYMENTS
  static async getAllPayments(query: z.infer<typeof adminPaymentsQuerySchema>) {
    const rows = await AdminRepository.findPayments(query);
    return pageResult(rows, query.limit);
  }

  static async getPayment(id: string) {
    const payment = await AdminRepository.findPaymentDetail(id);
    if (!payment) throw { statusCode: 404, message: "Payment not found" };
    return payment;
  }

  static async getPriceChecks(
    query: z.infer<typeof adminPriceChecksQuerySchema>,
  ) {
    const rows = await AdminRepository.findPriceChecks(query);
    return pageResult(
      rows.map((row) => ({
        ...row,
        id: row.id.toString(),
        errorMessage: safeCheckSummary(row.errorMessage),
      })),
      query.limit,
    );
  }
}
