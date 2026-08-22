import {prisma} from "@dipantauin/prisma";

export class NotificationsService {
  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  static async markAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      throw { statusCode: 404, message: "Notification not found" };
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  static async processPriceChange(product: any, oldPrice: number, newPrice: number) {
    const userProducts = await prisma.userProduct.findMany({
      where: {
        productId: product.id,
        isActive: true
      },
      include: {
        user: true
      }
    });

    for (const up of userProducts) {
      if (!up.targetPrice) continue;
      
      const target = Number(up.targetPrice);

      if (up.notifyOnDrop && newPrice <= target && oldPrice > target) {
        await this.createNotification(
          up.userId,
          up.id,
          "PRICE_DROP",
          `Price Dropped! ${product.name}`,
          `Good news! The price of ${product.name} has dropped to ${newPrice}, which is at or below your target price of ${target}.`
        );
      }

      if (up.notifyOnIncrease && newPrice > target && oldPrice <= target) {
        await this.createNotification(
          up.userId,
          up.id,
          "PRICE_INCREASE",
          `Price Increased! ${product.name}`,
          `The price of ${product.name} has increased to ${newPrice}, which is now above your target price of ${target}.`
        );
      }
    }
  }

  private static async createNotification(userId: string, userProductId: string, type: "PRICE_DROP" | "PRICE_INCREASE" | "TARGET_REACHED" | "SYSTEM", title: string, message: string) {
    console.log(`[Notification] Creating ${type} notification for user ${userId}`);
    await prisma.notification.create({
      data: {
        userId,
        userProductId,
        type,
        title,
        message,
        isRead: false
      }
    });
  }
}
