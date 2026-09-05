import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { NotificationsRepository } from "./notifications.repository";

export const notificationsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  read: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  type: z.nativeEnum(NotificationType).optional(),
  order: z.enum(["newest", "oldest"]).default("newest"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export class NotificationsService {
  static async getNotifications(
    userId: string,
    query: z.infer<typeof notificationsQuerySchema>,
  ) {
    const rows = await NotificationsRepository.findForUser(userId, query);
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items,
      pageInfo: {
        hasMore,
        nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
      },
    };
  }

  static async getUnreadCount(userId: string) {
    return { count: await NotificationsRepository.countUnread(userId) };
  }

  static async markAsRead(userId: string, id: string) {
    const result = await NotificationsRepository.markAsRead(userId, id);
    if (result.count === 0) {
      throw { statusCode: 404, message: "Notification not found" };
    }
    return { updated: true };
  }

  static async markAllAsRead(userId: string) {
    const result = await NotificationsRepository.markAllAsRead(userId);

    return { updated: result.count };
  }

  static async deleteNotification(userId: string, id: string) {
    const result = await NotificationsRepository.deleteOwned(userId, id);
    if (result.count === 0) {
      throw { statusCode: 404, message: "Notification not found" };
    }
  }

  static async processPriceChange(
    product: { id: string; name: string },
    oldPrice: number,
    newPrice: number,
  ) {
    const userProducts = await NotificationsRepository.findActiveTrackers(
      product.id,
    );
    const notifications = [];
    for (const up of userProducts) {
      if (!up.targetPrice) continue;

      const target = Number(up.targetPrice);

      if (up.notifyOnDrop && newPrice <= target && oldPrice > target) {
        notifications.push({
          userId: up.userId,
          userProductId: up.id,
          type: "PRICE_DROP" as const,
          title: `Price Dropped! ${product.name}`,
          message: `Good news! The price of ${product.name} has dropped to ${newPrice}, which is at or below your target price of ${target}.`,
        });
      }

      if (up.notifyOnIncrease && newPrice > target && oldPrice <= target) {
        notifications.push({
          userId: up.userId,
          userProductId: up.id,
          type: "PRICE_INCREASE" as const,
          title: `Price Increased! ${product.name}`,
          message: `The price of ${product.name} has increased to ${newPrice}, which is now above your target price of ${target}.`,
        });
      }
    }
    await NotificationsRepository.createMany(notifications);
  }
}
