import { PriceHistoryRepository } from "./price-history.repository";
import { z } from "zod";

export const historyQuerySchema = z
  .object({
    cursor: z.string().regex(/^\d+$/).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    order: z.enum(["newest", "oldest"]).default("newest"),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "from must not be after to",
    path: ["from"],
  });

export class PriceHistoryService {
  static async getHistoryByProductId(
    userId: string,
    productId: string,
    query: z.infer<typeof historyQuerySchema>,
  ) {
    const owned = await PriceHistoryRepository.findForTrackedProduct(
      userId,
      productId,
      query,
    );
    if (!owned) throw { statusCode: 404, message: "Tracked product not found" };
    // Note: BigInt cannot be serialized directly by JSON.stringify
    // We will map it to string or number.
    const hasMore = owned.product.priceHistory.length > query.limit;
    const history = hasMore
      ? owned.product.priceHistory.slice(0, query.limit)
      : owned.product.priceHistory;
    const items = history.map((record) => ({
      ...record,
      id: record.id.toString(),
    }));
    return {
      items,
      pageInfo: {
        hasMore,
        nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
      },
    };
  }
}
