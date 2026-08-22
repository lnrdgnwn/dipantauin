import { prisma } from "@dipantauin/prisma";
import { getTracker } from "../trackers";
import { NotificationsService } from "@dipantauin/api/src/modules/notifications/notifications.service";

// Configurable concurrency limit (from env or default to 5)
const CONCURRENCY_LIMIT = process.env.WORKER_CONCURRENCY ? parseInt(process.env.WORKER_CONCURRENCY) : 5;

// Plan interval lookup: planCode -> checkIntervalMin (fetched from DB at runtime)
type PlanIntervalMap = Record<string, number>;

export async function checkProducts() {
  const now = new Date();

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
      status: "ACTIVE",
      OR: [
        { nextCheckAt: { lte: now } },
        { nextCheckAt: null }
      ]
    },
    include: {
      userProducts: {
        where: { isActive: true },
        include: {
          user: {
            include: {
              // Get each user's active subscription to know their plan code
              subscriptions: {
                where: { status: { in: ["ACTIVE", "TRIALING"] } },
                include: { plan: { select: { code: true } } },
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        }
      }
    },
    take: 100,
    orderBy: { nextCheckAt: "asc" }
  });

  if (products.length === 0) {
    console.log("No products need checking at this time.");
    return;
  }

  console.log(`Found ${products.length} products to check. Processing in batches of ${CONCURRENCY_LIMIT}...`);

  // 3. Process in batches, passing the plan interval map
  for (let i = 0; i < products.length; i += CONCURRENCY_LIMIT) {
    const batch = products.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.allSettled(
      batch.map((product) => processProduct(product, planIntervals, fallbackIntervalMin))
    );
  }
}

/**
 * Returns the shortest checkIntervalMin among all users tracking this product,
 * looked up from the planIntervals map fetched from DB.
 */
function getNextIntervalMin(
  product: any,
  planIntervals: PlanIntervalMap,
  fallbackIntervalMin: number
): number {
  if (!product.userProducts || product.userProducts.length === 0) {
    return fallbackIntervalMin;
  }

  let minInterval = fallbackIntervalMin;
  for (const up of product.userProducts) {
    const planCode = up.user?.subscriptions?.[0]?.plan?.code;
    const interval = planCode ? (planIntervals[planCode] ?? fallbackIntervalMin) : fallbackIntervalMin;
    if (interval < minInterval) {
      minInterval = interval;
    }
  }
  return minInterval;
}

async function processProduct(product: any, planIntervals: PlanIntervalMap, fallbackIntervalMin: number) {
  const now = new Date();

  if (product.userProducts.length === 0) {
    await prisma.product.update({
      where: { id: product.id },
      data: { nextCheckAt: new Date(now.getTime() + fallbackIntervalMin * 60 * 1000) }
    });
    return;
  }

  // Determine interval from DB plan data
  const intervalMin = getNextIntervalMin(product, planIntervals, fallbackIntervalMin);
  const nextCheck = new Date(now.getTime() + intervalMin * 60 * 1000);

  console.log(`Checking price for product: ${product.name || product.url} (next check in ${intervalMin} min)`);

  const priceCheck = await prisma.priceCheck.create({
    data: { productId: product.id, startedAt: now, status: "PENDING" }
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
          data: { productId: product.id, price: newPrice, checkedAt: completedAt }
        });
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          currentPrice: newPrice,
          name: scrapedData.name || product.name,
          sellerName: scrapedData.sellerName || product.sellerName,
          canonicalUrl: scrapedData.canonicalUrl || product.canonicalUrl,
          lastCheckedAt: completedAt,
          nextCheckAt: nextCheck
        }
      });

      await tx.priceCheck.update({
        where: { id: priceCheck.id },
        data: { status: "SUCCESS", completedAt, price: newPrice }
      });
    });

    if (oldPrice !== newPrice) {
      await NotificationsService.processPriceChange(product, oldPrice, newPrice);
    }

  } catch (error: any) {
    console.error(`[Worker] Error checking product ${product.id} (${product.platform}):`, error.message);

    const retryAt = new Date(Date.now() + intervalMin * 60 * 1000);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { nextCheckAt: retryAt }
      }),
      prisma.priceCheck.update({
        where: { id: priceCheck.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: error.message || "Unknown error"
        }
      })
    ]);
  }
}
