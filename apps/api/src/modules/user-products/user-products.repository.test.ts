import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  product: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  priceHistory: { create: vi.fn() },
  userProduct: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn() },
  subscription: { findFirst: vi.fn() },
  plan: { findFirst: vi.fn() },
}));
const transaction = vi.hoisted(() => vi.fn());

vi.mock("@dipantauin/prisma", () => ({ prisma: { $transaction: transaction } }));

import { UserProductsRepository } from "./user-products.repository";

const preview = {
  marketplace: "TOKOPEDIA",
  externalProductId: "external",
  canonicalUrl: "https://tokopedia.com/item",
  name: "Item",
  imageUrl: "https://images.test/item.jpg",
  price: 100_000,
  originalPrice: null,
  availability: "AVAILABLE",
  fetchedAt: new Date("2026-09-05T00:00:00.000Z"),
};
const input = { targetPrice: 90_000, notifyOnDrop: true, notifyOnIncrease: false };

describe("UserProductsRepository.track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (callback) => callback(tx));
    tx.product.findUnique.mockResolvedValue({ id: "product" });
    tx.product.update.mockResolvedValue({ id: "product" });
    tx.userProduct.findUnique.mockResolvedValue(null);
    tx.subscription.findFirst.mockResolvedValue({ plan: { maxProducts: 2 } });
    tx.userProduct.count.mockResolvedValue(0);
    tx.userProduct.create.mockResolvedValue({ id: "tracking", productId: "product" });
  });

  it("creates an owned tracking under the active plan limit", async () => {
    await expect(UserProductsRepository.track("user", preview, input)).resolves.toEqual({ id: "tracking", productId: "product" });
    expect(tx.userProduct.create).toHaveBeenCalledWith({
      data: { userId: "user", productId: "product", ...input },
      include: { product: true },
    });
    expect(tx.plan.findFirst).not.toHaveBeenCalled();
  });

  it("rejects duplicate tracking before creating another relation", async () => {
    tx.userProduct.findUnique.mockResolvedValue({ id: "existing" });
    await expect(UserProductsRepository.track("user", preview, input)).rejects.toMatchObject({ statusCode: 409, message: "You are already tracking this product" });
    expect(tx.userProduct.create).not.toHaveBeenCalled();
  });

  it("enforces the FREE plan limit when no paid entitlement exists", async () => {
    tx.subscription.findFirst.mockResolvedValue(null);
    tx.plan.findFirst.mockResolvedValue({ maxProducts: 1 });
    tx.userProduct.count.mockResolvedValue(1);
    await expect(UserProductsRepository.track("user", preview, input)).rejects.toMatchObject({
      statusCode: 409,
      code: "PRODUCT_LIMIT_REACHED",
      limit: 1,
    });
  });

  it("fails safely when no entitlement plan is configured", async () => {
    tx.subscription.findFirst.mockResolvedValue(null);
    tx.plan.findFirst.mockResolvedValue(null);
    await expect(UserProductsRepository.track("user", preview, input)).rejects.toMatchObject({ statusCode: 503 });
  });
});
