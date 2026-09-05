import { prisma } from "@dipantauin/prisma";
import { NotificationType } from "@prisma/client";

type NotificationsQuery = {
  cursor?: string;
  limit: number;
  read?: boolean;
  type?: NotificationType;
  order: "newest" | "oldest";
  from?: Date;
  to?: Date;
};

export class NotificationsRepository {
  static findForUser(userId: string, query: NotificationsQuery) {
    const direction = query.order === "oldest" ? "asc" : "desc";
    return prisma.notification.findMany({
      where: {
        userId,
        isRead: query.read,
        type: query.type,
        ...(query.from || query.to
          ? { createdAt: { gte: query.from, lte: query.to } }
          : {}),
      },
      orderBy: [{ createdAt: direction }, { id: direction }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        userProduct: {
          select: {
            id: true,
            product: {
              select: { id: true, name: true, url: true, platform: true },
            },
          },
        },
      },
    });
  }

  static countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  static markAsRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static deleteOwned(userId: string, id: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  }

  static findActiveTrackers(productId: string) {
    return prisma.userProduct.findMany({
      where: { productId, isActive: true },
      select: {
        id: true,
        userId: true,
        targetPrice: true,
        notifyOnDrop: true,
        notifyOnIncrease: true,
      },
    });
  }

  static createMany(
    data: Array<{
      userId: string;
      userProductId: string;
      type: NotificationType;
      title: string;
      message: string;
    }>,
  ) {
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return prisma.notification.createMany({ data });
  }
}
