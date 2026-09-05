import { beforeEach, describe, expect, it, vi } from "vitest";
import { PriceHistoryRepository } from "./price-history.repository";
import { PriceHistoryService, historyQuerySchema } from "./price-history.service";

describe("PriceHistoryService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("enforces ownership and validates date ranges", async () => {
    vi.spyOn(PriceHistoryRepository, "findForTrackedProduct").mockResolvedValue(null);
    await expect(PriceHistoryService.getHistoryByProductId("user", "product", { limit: 10, order: "newest" })).rejects.toMatchObject({ statusCode: 404 });
    expect(historyQuerySchema.safeParse({ from: "2026-09-05", to: "2026-09-01" }).success).toBe(false);
  });

  it("serializes BigInt IDs and returns a stable cursor", async () => {
    vi.spyOn(PriceHistoryRepository, "findForTrackedProduct").mockResolvedValue({
      product: { priceHistory: [{ id: 1n, price: 10 }, { id: 2n, price: 9 }, { id: 3n, price: 8 }] },
    } as never);
    await expect(PriceHistoryService.getHistoryByProductId("user", "product", { limit: 2, order: "newest" })).resolves.toEqual({
      items: [{ id: "1", price: 10 }, { id: "2", price: 9 }],
      pageInfo: { hasMore: true, nextCursor: "2" },
    });
  });
});
