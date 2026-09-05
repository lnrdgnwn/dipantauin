import { prisma } from "@dipantauin/prisma";
import { Prisma } from "@prisma/client";
import { getTracker } from "../trackers";
import { isValidHttpUrl } from "../trackers/product-tracker";

const CONCURRENCY_LIMIT = 5;

// Plan interval lookup: planCode -> checkIntervalMin (fetched from DB at runtime)
type PlanIntervalMap = Record<string, number>;

export async function checkProducts() {
  const now = new Date();
  await reconcileExpiredEntitlements(now);

  // 1. Fetch all plans from DB to use as interval lookup
  const plans = await prisma.plan.findMany({ where: { isActive: true } });
  const planIntervals: PlanIntervalMap = {};
  let fallbackIntervalMin = 1440; // absolute fallback if DB has no plans

  for (const plan of plans) {
    planIntervals[plan.code] = plan.checkIntervalMin;
    // Use the FREE plan's interval as fallback
    if (plan.code === "FREE") {
      fallbackIntervalMin = plan.checkIntervalMin;
    }
  }

  console.log("[Worker] Plan intervals loaded from DB:", planIntervals);

  // 2. Find products that need to be checked
  const products = await prisma.product.findMany({
    where: {
      status: { in: ["ACTIVE", "UNAVAILABLE", "ERROR"] },
      OR: [{ nextCheckAt: { lte: now } }, { nextCheckAt: null }],
    },
    include: {
      userProducts: {
        where: { isActive: true },
        include: {
          user: {
            include: {
              // Get each user's active subscription to know their plan code
              subscriptions: {
                where: { status: "ACTIVE", currentPeriodEnd: { gt: now } },
                include: { plan: { select: { code: true } } },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
    take: 100,
    orderBy: { nextCheckAt: "asc" },
  });

  if (products.length === 0) {
    console.log("No products need checking at this time.");
    return;
  }

  console.log(
    `Found ${products.length} products to check. Processing in batches of ${CONCURRENCY_LIMIT}...`,
  );

  // 3. Process in batches, passing the plan interval map
  for (let i = 0; i < products.length; i += CONCURRENCY_LIMIT) {
    const batch = products.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.allSettled(
      batch.map((product) =>
        processProduct(product, planIntervals, fallbackIntervalMin),
      ),
    );
  }
}

async function reconcileExpiredEntitlements(now: Date) {
  const expired = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: { lte: now },
      plan: { code: { not: "FREE" } },
    },
    select: { id: true, userId: true },
  });
  if (expired.length === 0) return;
  const freePlan = await prisma.plan.findFirst({
    where: { code: "FREE", isActive: true },
  });
  if (!freePlan) throw new Error("FREE plan is not configured");

  const expiredIds = expired.map(({ id }) => id);
  const userIds = [...new Set(expired.map(({ userId }) => userId))];
  await prisma.subscription.updateMany({
    where: { id: { in: expiredIds } },
    data: { status: "EXPIRED" },
  });

  const batchSize = 100;
  for (let offset = 0; offset < userIds.length; offset += batchSize) {
    const batchUserIds = userIds.slice(offset, offset + batchSize);
    await prisma.$transaction(async (tx) => {
      const existingFreeSubscriptions = await tx.subscription.findMany({
        where: {
          userId: { in: batchUserIds },
          status: "ACTIVE",
          planId: freePlan.id,
        },
        select: { userId: true },
      });
      const usersWithFreePlan = new Set(
        existingFreeSubscriptions.map(({ userId }) => userId),
      );
      const currentPeriodEnd = new Date(
        now.getTime() + 36500 * 24 * 60 * 60 * 1000,
      );
      const usersMissingFreePlan = batchUserIds.filter(
        (userId) => !usersWithFreePlan.has(userId),
      );
      if (usersMissingFreePlan.length > 0) {
        await tx.subscription.createMany({
          data: usersMissingFreePlan.map((userId) => ({
            userId,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd,
          })),
        });
      }

      const activeTrackings = await tx.userProduct.findMany({
        where: { userId: { in: batchUserIds }, isActive: true },
        select: { id: true, userId: true, productId: true },
        orderBy: [{ userId: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      });
      const retainedByUser = new Map<string, number>();
      const retained = activeTrackings.filter((tracking) => {
        const count = retainedByUser.get(tracking.userId) ?? 0;
        if (count >= freePlan.maxProducts) return false;
        retainedByUser.set(tracking.userId, count + 1);
        return true;
      });
      const retainedIds = retained.map(({ id }) => id);
      await tx.userProduct.updateMany({
        where: {
          userId: { in: batchUserIds },
          isActive: true,
          ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}),
        },
        data: { isActive: false },
      });
      if (retained.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: retained.map(({ productId }) => productId) } },
          data: {
            nextCheckAt: new Date(
              now.getTime() + freePlan.checkIntervalMin * 60 * 1000,
            ),
          },
        });
      }
    });
  }
}

/**
 * Returns the shortest checkIntervalMin among all users tracking this product,
 * looked up from the planIntervals map fetched from DB.
 */
function getNextIntervalMin(
  product: any,
  planIntervals: PlanIntervalMap,
  fallbackIntervalMin: number,
): number {
  if (!product.userProducts || product.userProducts.length === 0) {
    return fallbackIntervalMin;
  }

  let minInterval = fallbackIntervalMin;
  for (const up of product.userProducts) {
    const planCode = up.user?.subscriptions?.[0]?.plan?.code;
    const interval = planCode
      ? (planIntervals[planCode] ?? fallbackIntervalMin)
      : fallbackIntervalMin;
    if (interval < minInterval) {
      minInterval = interval;
    }
  }
  return minInterval;
}

export async function processProduct(
  product: any,
  planIntervals: PlanIntervalMap,
  fallbackIntervalMin: number,
) {
  const now = new Date();

  if (product.userProducts.length === 0) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        nextCheckAt: new Date(now.getTime() + fallbackIntervalMin * 60 * 1000),
      },
    });
    return;
  }

  // Determine interval from DB plan data
  const intervalMin = getNextIntervalMin(
    product,
    planIntervals,
    fallbackIntervalMin,
  );
  const nextCheck = new Date(now.getTime() + intervalMin * 60 * 1000);

  console.log(
    `Checking price for product: ${product.name || product.url} (next check in ${intervalMin} min)`,
  );

  const priceCheck = await prisma.priceCheck.create({
    data: { productId: product.id, startedAt: now, status: "PENDING" },
  });

  try {
    const tracker = getTracker(product.url);
    const scrapedData = await tracker.fetchProduct(product.url);

    const oldPrice = Number(product.currentPrice);
    const newPrice = scrapedData.price;
    const completedAt = new Date();

    await prisma.$transaction(async (tx) => {
      if (oldPrice !== newPrice) {
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            price: newPrice,
            checkedAt: completedAt,
          },
        });
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          currentPrice: newPrice,
          name: scrapedData.name || product.name,
          sellerName: scrapedData.sellerName || product.sellerName,
          canonicalUrl: scrapedData.canonicalUrl || product.canonicalUrl,
          originalPrice: scrapedData.originalPrice ?? product.originalPrice,
          availability: scrapedData.availability,
          status:
            scrapedData.availability === "UNAVAILABLE"
              ? "UNAVAILABLE"
              : "ACTIVE",
          ...(isValidHttpUrl(scrapedData.imageUrl)
            ? { imageUrl: scrapedData.imageUrl }
            : {}),
          lastCheckedAt: completedAt,
          nextCheckAt: nextCheck,
        },
      });

      await tx.priceCheck.update({
        where: { id: priceCheck.id },
        data: { status: "SUCCESS", completedAt, price: newPrice },
      });

      if (oldPrice !== newPrice) {
        await processPriceChangeNotifications(
          tx,
          product.id,
          scrapedData.name || product.name || "Produk",
          oldPrice,
          newPrice,
        );
      }
    });
  } catch (error: any) {
    console.error(
      `[Worker] Error checking product ${product.id} (${product.platform}):`,
      error.message,
    );

    const retryAt = new Date(Date.now() + intervalMin * 60 * 1000);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { nextCheckAt: retryAt },
      }),
      prisma.priceCheck.update({
        where: { id: priceCheck.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: error.message || "Unknown error",
        },
      }),
    ]);
  }
}

type NotificationTracking = {
  id: string;
  userId: string;
  targetPrice: Prisma.Decimal | number | null;
  notifyOnDrop: boolean;
  notifyOnIncrease: boolean;
};

export function buildPriceChangeNotification(
  tracking: NotificationTracking,
  productName: string,
  oldPrice: number,
  newPrice: number,
): Prisma.NotificationCreateManyInput | null {
  const target = tracking.targetPrice ? Number(tracking.targetPrice) : null;

  if (
    tracking.notifyOnDrop &&
    target !== null &&
    newPrice <= target &&
    oldPrice > target
  ) {
    return {
      userId: tracking.userId,
      userProductId: tracking.id,
      type: "TARGET_REACHED",
      title: `Target harga tercapai: ${productName}`,
      message: `Harga sekarang Rp${newPrice.toLocaleString("id-ID")}, di bawah target Rp${target.toLocaleString("id-ID")}.`,
    };
  }

  if (tracking.notifyOnIncrease && newPrice > oldPrice) {
    return {
      userId: tracking.userId,
      userProductId: tracking.id,
      type: "PRICE_INCREASE",
      title: `Harga naik: ${productName}`,
      message: `Harga berubah dari Rp${oldPrice.toLocaleString("id-ID")} menjadi Rp${newPrice.toLocaleString("id-ID")}.`,
    };
  }

  if (tracking.notifyOnDrop && newPrice < oldPrice) {
    return {
      userId: tracking.userId,
      userProductId: tracking.id,
      type: "PRICE_DROP",
      title: `Harga turun: ${productName}`,
      message: `Harga berubah dari Rp${oldPrice.toLocaleString("id-ID")} menjadi Rp${newPrice.toLocaleString("id-ID")}.`,
    };
  }

  return null;
}

async function processPriceChangeNotifications(
  tx: Prisma.TransactionClient,
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
) {
  const trackings = await tx.userProduct.findMany({
    where: { productId, isActive: true },
    select: {
      id: true,
      userId: true,
      targetPrice: true,
      notifyOnDrop: true,
      notifyOnIncrease: true,
    },
  });

  const notifications: Prisma.NotificationCreateManyInput[] = [];
  for (const tracking of trackings) {
    const notification = buildPriceChangeNotification(
      tracking,
      productName,
      oldPrice,
      newPrice,
    );
    if (notification) notifications.push(notification);
  }

  if (notifications.length > 0) {
    await tx.notification.createMany({ data: notifications });
  }
}
