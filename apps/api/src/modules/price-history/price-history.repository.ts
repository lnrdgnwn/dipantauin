import { prisma } from "@dipantauin/prisma";
import type { z } from "zod";
import type { historyQuerySchema } from "./price-history.service";

export class PriceHistoryRepository {
  static findForTrackedProduct(
    userId: string,
    productId: string,
    query: z.infer<typeof historyQuerySchema>,
  ) {
    return prisma.userProduct.findUnique({
      where: { userId_productId: { userId, productId } },
      select: {
        id: true,
        product: {
          select: {
            priceHistory: {
              where: {
                productId,
                ...(query.from || query.to
                  ? { checkedAt: { gte: query.from, lte: query.to } }
                  : {}),
              },
              orderBy: [
                { checkedAt: query.order === "oldest" ? "asc" : "desc" },
                { id: query.order === "oldest" ? "asc" : "desc" },
              ],
              take: query.limit + 1,
              ...(query.cursor
                ? { cursor: { id: BigInt(query.cursor) }, skip: 1 }
                : {}),
            },
          },
        },
      },
    });
  }
}
