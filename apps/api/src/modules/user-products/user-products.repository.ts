import { prisma } from "@dipantauin/prisma";

type Preview = {
  marketplace: string;
  externalProductId: string | null;
  canonicalUrl: string;
  name: string;
  sellerName?: string;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  availability: string;
  fetchedAt: Date;
};
type TrackInput = {
  targetPrice: number;
  notifyOnDrop: boolean;
  notifyOnIncrease: boolean;
};
type UpdateInput = {
  targetPrice?: number | null;
  notifyOnDrop?: boolean;
  notifyOnIncrease?: boolean;
  isActive?: boolean;
};
type ListQuery = {
  cursor?: string;
  limit: number;
  search?: string;
  marketplace?: string;
  status?: "ACTIVE" | "PAUSED" | "UNAVAILABLE";
};

export class UserProductsRepository {
  static findForQueue(userId: string, id: string) {
    return prisma.userProduct.findFirst({
      where: { id, userId },
      select: {
        id: true,
        isActive: true,
        targetPrice: true,
        notifyOnDrop: true,
        notifyOnIncrease: true,
        product: {
          select: { id: true, status: true, name: true, currentPrice: true },
        },
      },
    });
  }

  static queueWithNotification(input: {
    userId: string;
    userProductId: string;
    productId: string;
    queuedAt: Date;
    type: "PRICE_DROP" | "PRICE_INCREASE" | "TARGET_REACHED";
    title: string;
    message: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: input.productId },
        data: { nextCheckAt: input.queuedAt },
      });
      return tx.notification.create({
        data: {
          userId: input.userId,
          userProductId: input.userProductId,
          type: input.type,
          title: input.title,
          message: input.message,
          isRead: false,
        },
      });
    });
  }

  static track(userId: string, preview: Preview, data: TrackInput) {
    return prisma.$transaction(
      async (tx) => {
        let product = preview.externalProductId
          ? await tx.product.findUnique({
              where: {
                platform_externalProductId: {
                  platform: preview.marketplace,
                  externalProductId: preview.externalProductId,
                },
              },
            })
          : await tx.product.findFirst({
              where: { canonicalUrl: preview.canonicalUrl },
            });
        if (product) {
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              name: preview.name,
              sellerName: preview.sellerName,
              imageUrl: preview.imageUrl,
              currentPrice: preview.price,
              originalPrice: preview.originalPrice,
              availability: preview.availability,
              canonicalUrl: preview.canonicalUrl,
              lastCheckedAt: preview.fetchedAt,
            },
          });
        } else {
          product = await tx.product.create({
            data: {
              platform: preview.marketplace,
              externalProductId: preview.externalProductId,
              url: preview.canonicalUrl,
              canonicalUrl: preview.canonicalUrl,
              name: preview.name,
              sellerName: preview.sellerName,
              imageUrl: preview.imageUrl,
              currentPrice: preview.price,
              originalPrice: preview.originalPrice,
              availability: preview.availability,
              lastCheckedAt: preview.fetchedAt,
              status: "ACTIVE",
            },
          });
          await tx.priceHistory.create({
            data: {
              productId: product.id,
              price: preview.price,
              checkedAt: preview.fetchedAt,
            },
          });
        }
        const existingTracking = await tx.userProduct.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
          select: { id: true },
        });
        if (existingTracking)
          throw {
            statusCode: 409,
            message: "You are already tracking this product",
          };
        const subscription = await tx.subscription.findFirst({
          where: {
            userId,
            status: "ACTIVE",
            currentPeriodEnd: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          select: { plan: { select: { maxProducts: true } } },
        });
        const freePlan = subscription
          ? null
          : await tx.plan.findFirst({
              where: { code: "FREE", isActive: true },
              select: { maxProducts: true },
            });
        const productLimit =
          subscription?.plan.maxProducts ?? freePlan?.maxProducts;
        if (productLimit === undefined)
          throw {
            statusCode: 503,
            message: "No active subscription plan is configured",
          };
        const activeCount = await tx.userProduct.count({
          where: { userId, isActive: true },
        });
        if (activeCount >= productLimit)
          throw {
            statusCode: 409,
            code: "PRODUCT_LIMIT_REACHED",
            limit: productLimit,
            message: `Product limit reached (${productLimit})`,
          };
        return tx.userProduct.create({
          data: {
            userId,
            productId: product.id,
            targetPrice: data.targetPrice,
            notifyOnDrop: data.notifyOnDrop,
            notifyOnIncrease: data.notifyOnIncrease,
          },
          include: { product: true },
        });
      },
      { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 },
    );
  }

  static findMany(userId: string, query: ListQuery) {
    const where = {
      userId,
      AND: [
        ...(query.search
          ? [{ product: { name: { contains: query.search } } }]
          : []),
        ...(query.marketplace
          ? [{ product: { platform: query.marketplace } }]
          : []),
        ...(query.status === "ACTIVE"
          ? [{ isActive: true }]
          : query.status === "PAUSED"
            ? [{ isActive: false }]
            : query.status === "UNAVAILABLE"
              ? [{ product: { availability: "UNAVAILABLE" } }]
              : []),
      ],
    };
    return prisma.userProduct.findMany({
      where,
      include: { product: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
  }

  static findOne(userId: string, id: string) {
    return prisma.userProduct.findFirst({
      where: { id, userId },
      select: {
        id: true,
        targetPrice: true,
        notifyOnDrop: true,
        notifyOnIncrease: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            platform: true,
            url: true,
            canonicalUrl: true,
            name: true,
            sellerName: true,
            imageUrl: true,
            currentPrice: true,
            originalPrice: true,
            availability: true,
            status: true,
            lastCheckedAt: true,
            nextCheckAt: true,
            priceHistory: {
              select: {
                id: true,
                price: true,
                currency: true,
                checkedAt: true,
              },
              take: 100,
              orderBy: { checkedAt: "desc" },
            },
          },
        },
      },
    });
  }

  static update(userId: string, id: string, data: UpdateInput) {
    return prisma.$transaction(
      async (tx) => {
        const userProduct = await tx.userProduct.findFirst({
          where: { id, userId },
        });
        if (!userProduct)
          throw { statusCode: 404, message: "Tracked product not found" };
        if (data.isActive === true && !userProduct.isActive) {
          const subscription = await tx.subscription.findFirst({
            where: {
              userId,
              status: "ACTIVE",
              currentPeriodEnd: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
            select: { plan: { select: { maxProducts: true } } },
          });
          const freePlan = subscription
            ? null
            : await tx.plan.findFirst({
                where: { code: "FREE", isActive: true },
                select: { maxProducts: true },
              });
          const limit = subscription?.plan.maxProducts ?? freePlan?.maxProducts;
          if (limit === undefined)
            throw {
              statusCode: 503,
              message: "No active subscription plan is configured",
            };
          const activeCount = await tx.userProduct.count({
            where: { userId, isActive: true },
          });
          if (activeCount >= limit)
            throw {
              statusCode: 409,
              code: "PRODUCT_LIMIT_REACHED",
              limit,
              message: `Product limit reached (${limit})`,
            };
        }
        return tx.userProduct.update({
          where: { id },
          data,
          include: { product: true },
        });
      },
      { isolationLevel: "Serializable" },
    );
  }

  static delete(userId: string, id: string) {
    return prisma.userProduct.deleteMany({ where: { id, userId } });
  }
}
