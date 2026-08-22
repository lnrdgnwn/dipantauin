import { prisma } from "@dipantauin/prisma";
import { z } from "zod";
import { getTracker } from "@dipantauin/worker/src/trackers";

export const addProductSchema = z.object({
  url: z.string().url(),
});

export class ProductsService {
  static async previewProduct(data: z.infer<typeof addProductSchema>) {
    // 1. Check if we already have it in DB
    const existingProduct = await prisma.product.findFirst({
      where: { url: data.url }
    });

    if (existingProduct) {
      return {
        isExisting: true,
        platform: existingProduct.platform,
        url: existingProduct.url,
        name: existingProduct.name,
        currentPrice: existingProduct.currentPrice,
        sellerName: existingProduct.sellerName,
        canonicalUrl: existingProduct.canonicalUrl,
        lastCheckedAt: existingProduct.lastCheckedAt,
        nextCheckAt: existingProduct.nextCheckAt,
      };
    }

    // 2. If not, use tracker to fetch real data
    const tracker = getTracker(data.url);
    const scrapedData = await tracker.fetchProduct(data.url);
    const urlObj = new URL(data.url);

    return {
      isExisting: false,
      platform: urlObj.hostname.replace("www.", ""),
      url: data.url,
      name: scrapedData.name,
      currentPrice: scrapedData.price,
      sellerName: scrapedData.sellerName,
      canonicalUrl: scrapedData.canonicalUrl,
      lastCheckedAt: null,
      nextCheckAt: null,
    };
  }

  static async addProduct(data: z.infer<typeof addProductSchema>) {
    // Check if it already exists
    let product = await prisma.product.findFirst({
      where: { url: data.url }
    });

    if (!product) {
      const tracker = getTracker(data.url);
      const scrapedData = await tracker.fetchProduct(data.url);
      const urlObj = new URL(data.url);
      
      product = await prisma.product.create({
        data: {
          platform: urlObj.hostname.replace("www.", ""),
          url: data.url,
          name: scrapedData.name,
          sellerName: scrapedData.sellerName,
          canonicalUrl: scrapedData.canonicalUrl,
          currentPrice: scrapedData.price,
          status: "ACTIVE"
        }
      });
    }

    return product;
  }

  static async getProducts() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      throw { statusCode: 404, message: "Product not found" };
    }
    
    return product;
  }

  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      throw { statusCode: 404, message: "Product not found" };
    }
    
    await prisma.product.delete({
      where: { id }
    });
    
    return { message: "Product deleted successfully" };
  }
}
