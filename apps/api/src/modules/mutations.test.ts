import { afterEach, describe, expect, it, vi } from "vitest";
import { updateTrackedProductSchema, UserProductsService } from "./user-products/user-products.service";
import { UserProductsRepository } from "./user-products/user-products.repository";
import { NotificationsService } from "./notifications/notifications.service";
import { NotificationsRepository } from "./notifications/notifications.repository";
import { AdminService, updateUserStatusSchema } from "./admin/admin.service";
import { AdminRepository } from "./admin/admin.repository";
import { idSchema } from "../utils/validation";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { requireAdmin } from "../middlewares/auth.middleware";
import { AuthRepository } from "./auth/auth.repository";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const resourceId = "33333333-3333-4333-8333-333333333333";

afterEach(() => vi.restoreAllMocks());

it("tracked-product update forwards the authenticated owner constraint", async () => {
  const original = UserProductsRepository.update;
  let received: unknown[] = [];
  UserProductsRepository.update = (async (...args: unknown[]) => {
    received = args;
    return { id: resourceId };
  }) as typeof UserProductsRepository.update;
  try {
    await UserProductsService.updateTrackedProduct(userA, resourceId, {
      targetPrice: 500_000,
    });
    expect(received).toEqual([userA, resourceId, { targetPrice: 500_000 }]);
  } finally {
    UserProductsRepository.update = original;
  }
});

it("tracked-product update propagates an ownership miss", async () => {
  const original = UserProductsRepository.update;
  UserProductsRepository.update = (async (userId: string) => {
    expect(userId).toBe(userB);
    throw { statusCode: 404, message: "Tracked product not found" };
  }) as typeof UserProductsRepository.update;
  try {
    await expect(
      UserProductsService.updateTrackedProduct(userB, resourceId, {
        targetPrice: 500_000,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  } finally {
    UserProductsRepository.update = original;
  }
});

it("untracking succeeds for an owned row and rejects an ownership miss", async () => {
  const original = UserProductsRepository.delete;
  try {
    UserProductsRepository.delete = (async () => ({ count: 1 })) as typeof UserProductsRepository.delete;
    expect(
      await UserProductsService.untrackProduct(userA, resourceId),
    ).toEqual({ message: "Product tracking removed" });
    UserProductsRepository.delete = (async () => ({ count: 0 })) as typeof UserProductsRepository.delete;
    await expect(
      UserProductsService.untrackProduct(userB, resourceId),
    ).rejects.toMatchObject({ statusCode: 404 });
  } finally {
    UserProductsRepository.delete = original;
  }
});

it("notification mutations reject rows not owned by the authenticated user", async () => {
  const originalRead = NotificationsRepository.markAsRead;
  const originalDelete = NotificationsRepository.deleteOwned;
  try {
    NotificationsRepository.markAsRead = (async () => ({ count: 0 })) as typeof NotificationsRepository.markAsRead;
    NotificationsRepository.deleteOwned = (async () => ({ count: 0 })) as typeof NotificationsRepository.deleteOwned;
    await expect(NotificationsService.markAsRead(userB, resourceId)).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      NotificationsService.deleteNotification(userB, resourceId),
    ).rejects.toMatchObject({ statusCode: 404 });
  } finally {
    NotificationsRepository.markAsRead = originalRead;
    NotificationsRepository.deleteOwned = originalDelete;
  }
});

it("notification read-all and owned delete use bulk result semantics", async () => {
  const originalReadAll = NotificationsRepository.markAllAsRead;
  const originalDelete = NotificationsRepository.deleteOwned;
  try {
    NotificationsRepository.markAllAsRead = (async () => ({ count: 3 })) as typeof NotificationsRepository.markAllAsRead;
    NotificationsRepository.deleteOwned = (async (userId: string) => {
      expect(userId).toBe(userA);
      return { count: 1 };
    }) as typeof NotificationsRepository.deleteOwned;
    expect(await NotificationsService.markAllAsRead(userA)).toEqual({
      updated: 3,
    });
    await NotificationsService.deleteNotification(userA, resourceId);
  } finally {
    NotificationsRepository.markAllAsRead = originalReadAll;
    NotificationsRepository.deleteOwned = originalDelete;
  }
});

it("mutation validation rejects invalid IDs, target prices, and statuses", () => {
  expect(idSchema.safeParse("not-a-uuid").success).toBe(false);
  expect(
    updateTrackedProductSchema.safeParse({ targetPrice: -1 }).success,
  ).toBe(false);
  expect(
    updateTrackedProductSchema.safeParse({ currentPrice: 10 }).success,
  ).toBe(false);
  expect(
    updateUserStatusSchema.safeParse({ status: "ROOT" }).success,
  ).toBe(false);
  expect(
    updateUserStatusSchema.safeParse({ status: "SUSPENDED" }).success,
  ).toBe(true);
});

it("admin middleware rejects an authenticated non-admin", async () => {
  const original = AuthRepository.findUserRole;
  AuthRepository.findUserRole = (async () => ({
    role: "USER",
    status: "ACTIVE",
  })) as unknown as typeof AuthRepository.findUserRole;
  try {
    const token = jwt.sign({ userId: userA }, env.JWT_SECRET);
    const result = await new Promise<{ status: number; body: unknown }>(
      (resolve, reject) => {
        let status = 200;
        const response = {
          status(code: number) {
            status = code;
            return this;
          },
          json(body: unknown) {
            resolve({ status, body });
            return this;
          },
        };
        requireAdmin(
          { headers: {}, cookies: { accessToken: token } } as never,
          response as never,
          (error?: unknown) =>
            error ? reject(error) : reject(new Error("non-admin was allowed")),
        );
      },
    );
    expect(result.status).toBe(403);
  } finally {
    AuthRepository.findUserRole = original;
  }
});

it("admin service updates an allowed user status", async () => {
  const original = AdminRepository.updateUserStatus;
  AdminRepository.updateUserStatus = (async (id: string, status: string) => ({
    id,
    email: "user@example.test",
    status,
  })) as typeof AdminRepository.updateUserStatus;
  try {
    const result = await AdminService.updateUserStatus(resourceId, {
      status: "SUSPENDED",
    });
    expect(result.status).toBe("SUSPENDED");
  } finally {
    AdminRepository.updateUserStatus = original;
  }
});
