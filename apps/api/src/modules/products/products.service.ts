import { z } from "zod";
import { getTracker, TrackerError } from "@dipantauin/worker/trackers";
import { ProductsRepository } from "./products.repository";

export const addProductSchema = z
  .object({ url: z.string().url().max(2048) })
  .strict();

export class ProductsService {
  static async fetchPreview(url: string) {
    try {
      return await getTracker(url).fetchProduct(url);
    } catch (error) {
      if (error instanceof TrackerError) {
        const statusCode =
          error.code === "NOT_FOUND"
            ? 404
            : error.code === "BLOCKED"
              ? 429
              : error.code === "TIMEOUT"
                ? 504
                : 422;
        throw { statusCode, code: error.code, message: error.message };
      }
      throw error;
    }
  }

  static async previewProduct(data: z.infer<typeof addProductSchema>) {
    const preview = await this.fetchPreview(data.url);
    return {
      marketplace: preview.marketplace,
      externalProductId: preview.externalProductId,
      canonicalUrl: preview.canonicalUrl,
      url: preview.canonicalUrl,
      title: preview.name,
      name: preview.name,
      currentPrice: preview.price,
      originalPrice: preview.originalPrice,
      imageUrl: preview.imageUrl,
      availability: preview.availability,
      sellerName: preview.sellerName ?? null,
      fetchedAt: preview.fetchedAt,
    };
  }

  static async addProduct(data: z.infer<typeof addProductSchema>) {
    const preview = await this.fetchPreview(data.url);
    const existing = preview.externalProductId
      ? await ProductsRepository.findByExternalIdentity(
          preview.marketplace,
          preview.externalProductId,
        )
      : await ProductsRepository.findByCanonicalUrl(preview.canonicalUrl);
    if (existing) return existing;
    return ProductsRepository.create(preview);
  }

  static getProducts() {
    return ProductsRepository.findRecent();
  }

  static async getProductById(id: string) {
    const product = await ProductsRepository.findById(id);
    if (!product) throw { statusCode: 404, message: "Product not found" };
    return product;
  }

  static async deleteProduct(id: string) {
    const product = await ProductsRepository.findById(id);
    if (!product) throw { statusCode: 404, message: "Product not found" };
    await ProductsRepository.deleteById(id);
    return { message: "Product deleted successfully" };
  }
}
