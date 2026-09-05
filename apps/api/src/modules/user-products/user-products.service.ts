import { z } from "zod";
import {
  ProductsService,
  addProductSchema,
} from "../products/products.service";
import { env } from "../../config/env";
import { UserProductsRepository } from "./user-products.repository";

export const trackProductSchema = addProductSchema.extend({
  targetPrice: z.number().int().positive(),
  notifyOnDrop: z.boolean().default(true),
  notifyOnIncrease: z.boolean().default(false),
});
export const updateTrackedProductSchema = z
  .object({
    targetPrice: z.number().int().positive().optional().nullable(),
    notifyOnDrop: z.boolean().optional(),
    notifyOnIncrease: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export const trackedProductsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  marketplace: z.enum(["TOKOPEDIA", "SHOPEE", "BLIBLI"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "UNAVAILABLE"]).optional(),
});

export class UserProductsService {
  static async queuePriceCheckNow(userId: string, id: string) {
    if (env.NODE_ENV === "production")
      throw { statusCode: 404, message: "Route not found" };
    const userProduct = await UserProductsRepository.findForQueue(userId, id);
    if (!userProduct)
      throw { statusCode: 404, message: "Tracked product not found" };
    if (!userProduct.isActive || userProduct.product.status !== "ACTIVE")
      throw {
        statusCode: 409,
        message: "Only active tracked products can be checked",
      };
    const currentPrice = Number(userProduct.product.currentPrice);
    const targetPrice = userProduct.targetPrice
      ? Number(userProduct.targetPrice)
      : null;
    if (!Number.isFinite(currentPrice) || currentPrice <= 0)
      throw {
        statusCode: 409,
        message: "Product does not have a valid current price",
      };
    if (!userProduct.notifyOnDrop && !userProduct.notifyOnIncrease)
      throw {
        statusCode: 409,
        message: "Enable at least one notification setting before testing",
      };

    const productName = userProduct.product.name ?? "Produk";
    let type: "PRICE_DROP" | "PRICE_INCREASE" | "TARGET_REACHED";
    let title: string;
    let message: string;
    if (
      userProduct.notifyOnDrop &&
      targetPrice !== null &&
      currentPrice > targetPrice
    ) {
      type = "TARGET_REACHED";
      title = `[TEST] Target harga tercapai: ${productName}`;
      message = `Simulasi harga turun dari Rp${currentPrice.toLocaleString("id-ID")} menjadi Rp${targetPrice.toLocaleString("id-ID")}, sesuai target. Harga produk asli tidak diubah.`;
    } else if (userProduct.notifyOnDrop) {
      const simulatedPrice = Math.max(1, Math.floor(currentPrice * 0.95));
      type = "PRICE_DROP";
      title = `[TEST] Harga turun: ${productName}`;
      message = `Simulasi harga turun dari Rp${currentPrice.toLocaleString("id-ID")} menjadi Rp${simulatedPrice.toLocaleString("id-ID")}. Harga produk asli tidak diubah.`;
    } else {
      const simulatedPrice = Math.ceil(currentPrice * 1.05);
      type = "PRICE_INCREASE";
      title = `[TEST] Harga naik: ${productName}`;
      message = `Simulasi harga naik dari Rp${currentPrice.toLocaleString("id-ID")} menjadi Rp${simulatedPrice.toLocaleString("id-ID")}. Harga produk asli tidak diubah.`;
    }
    const queuedAt = new Date();
    const notification = await UserProductsRepository.queueWithNotification({
      userId,
      userProductId: userProduct.id,
      productId: userProduct.product.id,
      queuedAt,
      type,
      title,
      message: `${message} Pengecekan harga asli juga sudah masuk antrean worker.`,
    });
    return {
      queuedAt,
      notificationId: notification.id,
      message: "Price check queued and test notification created",
    };
  }

  static async trackProduct(
    userId: string,
    data: z.infer<typeof trackProductSchema>,
  ) {
    const preview = await ProductsService.fetchPreview(data.url);
    return UserProductsRepository.track(userId, preview, data);
  }

  static async getTrackedProducts(
    userId: string,
    query: z.infer<typeof trackedProductsQuerySchema>,
  ) {
    const rows = await UserProductsRepository.findMany(userId, query);
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

  static async getTrackedProduct(userId: string, id: string) {
    const trackedProduct = await UserProductsRepository.findOne(userId, id);
    if (!trackedProduct)
      throw { statusCode: 404, message: "Tracked product not found" };
    return trackedProduct;
  }

  static updateTrackedProduct(
    userId: string,
    id: string,
    data: z.infer<typeof updateTrackedProductSchema>,
  ) {
    return UserProductsRepository.update(userId, id, data);
  }

  static async untrackProduct(userId: string, id: string) {
    const result = await UserProductsRepository.delete(userId, id);
    if (result.count === 0)
      throw { statusCode: 404, message: "Tracked product not found" };
    return { message: "Product tracking removed" };
  }
}
