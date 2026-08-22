import { prisma } from "@dipantauin/prisma";
import { z } from "zod";
import { ProductsService, addProductSchema } from "../products/products.service";

export const trackProductSchema = addProductSchema.extend({
  targetPrice: z.number().optional(),
  notifyOnDrop: z.boolean().default(true),
  notifyOnIncrease: z.boolean().default(false),
});

export const updateTrackedProductSchema = z.object({
  targetPrice: z.number().optional().nullable(),
  notifyOnDrop: z.boolean().optional(),
  notifyOnIncrease: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export class UserProductsService {
  static async trackProduct(userId: string, data: z.infer<typeof trackProductSchema>) {
    // 1. Ensure product exists in DB
    const product = await ProductsService.addProduct({ url: data.url });

    // 2. Link user to product
    const existingTracking = await prisma.userProduct.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: product.id,
        },
      },
    });

    if (existingTracking) {
      throw { statusCode: 409, message: "You are already tracking this product" };
    }

    const userProduct = await prisma.userProduct.create({
      data: {
        userId,
        productId: product.id,
        targetPrice: data.targetPrice,
        notifyOnDrop: data.notifyOnDrop,
        notifyOnIncrease: data.notifyOnIncrease,
      },
      include: {
        product: true,
      },
    });

    return userProduct;
  }

  static async getTrackedProducts(userId: string) {
    return prisma.userProduct.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateTrackedProduct(userId: string, id: string, data: z.infer<typeof updateTrackedProductSchema>) {
    const userProduct = await prisma.userProduct.findUnique({
      where: { id },
    });

    if (!userProduct || userProduct.userId !== userId) {
      throw { statusCode: 404, message: "Tracked product not found" };
    }

    return prisma.userProduct.update({
      where: { id },
      data,
      include: {
        product: true,
      },
    });
  }

  static async untrackProduct(userId: string, id: string) {
    const userProduct = await prisma.userProduct.findUnique({
      where: { id },
    });

    if (!userProduct || userProduct.userId !== userId) {
      throw { statusCode: 404, message: "Tracked product not found" };
    }

    await prisma.userProduct.delete({
      where: { id },
    });

    return { message: "Product tracking removed" };
  }
}
