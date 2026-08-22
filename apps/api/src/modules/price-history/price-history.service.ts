import { prisma } from "@dipantauin/prisma";

export class PriceHistoryService {
  static async getHistoryByProductId(productId: string, limit = 50) {
    // Note: BigInt cannot be serialized directly by JSON.stringify
    // We will map it to string or number.
    const history = await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { checkedAt: "desc" },
      take: limit,
    });

    return history.map((record: any) => ({
      ...record,
      id: record.id.toString(),
    }));
  }
}
