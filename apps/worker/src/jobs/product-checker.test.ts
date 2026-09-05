import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    product: { update: vi.fn() },
    priceCheck: { create: vi.fn(), update: vi.fn() },
    priceHistory: { create: vi.fn() },
    userProduct: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  };
  return { tx, fetchProduct: vi.fn(), transaction: vi.fn() };
});

vi.mock("@dipantauin/prisma", () => ({
  prisma: {
    ...mocks.tx,
    $transaction: mocks.transaction,
  },
}));

vi.mock("../trackers", () => ({
  getTracker: () => ({ fetchProduct: mocks.fetchProduct }),
}));

import { processProduct } from "./product-checker";

const product = {
  id: "product-id",
  url: "https://www.tokopedia.com/store/product",
  platform: "TOKOPEDIA",
  name: "Old product",
  sellerName: "Old seller",
  canonicalUrl: "https://www.tokopedia.com/store/product",
  imageUrl: "https://images.tokopedia.net/old.jpg",
  currentPrice: 100_000,
  originalPrice: null,
  userProducts: [
    {
      user: { subscriptions: [{ plan: { code: "FREE" } }] },
    },
  ],
};

function scraped(imageUrl: unknown = "https://images.tokopedia.net/new.jpg") {
  return {
    name: "Fresh product",
    sellerName: "Fresh seller",
    canonicalUrl: product.canonicalUrl,
    imageUrl,
    price: 90_000,
    originalPrice: 110_000,
    availability: "AVAILABLE",
  };
}

describe("processProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tx.priceCheck.create.mockResolvedValue({ id: 1n });
    mocks.tx.product.update.mockResolvedValue({});
    mocks.tx.priceCheck.update.mockResolvedValue({});
    mocks.tx.priceHistory.create.mockResolvedValue({});
    mocks.tx.userProduct.findMany.mockResolvedValue([]);
    mocks.tx.notification.createMany.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation((input: unknown) =>
      typeof input === "function"
        ? input(mocks.tx)
        : Promise.all(input as Promise<unknown>[]),
    );
  });

  it("updates price, metadata, history, scheduling, and a valid image together", async () => {
    mocks.fetchProduct.mockResolvedValue(scraped());
    await processProduct(product, { FREE: 60 }, 1_440);

    expect(mocks.tx.priceHistory.create).toHaveBeenCalledOnce();
    expect(mocks.tx.product.update).toHaveBeenCalledOnce();
    expect(mocks.tx.product.update.mock.calls[0]?.[0].data).toMatchObject({
      currentPrice: 90_000,
      name: "Fresh product",
      imageUrl: "https://images.tokopedia.net/new.jpg",
      originalPrice: 110_000,
      availability: "AVAILABLE",
      status: "ACTIVE",
    });
  });

  it.each([null, undefined, "", "not-a-url"])(
    "preserves the stored image when scraper returns %s",
    async (imageUrl) => {
      mocks.fetchProduct.mockResolvedValue({ ...scraped(), imageUrl });
      await processProduct(product, { FREE: 60 }, 1_440);
      expect(
        mocks.tx.product.update.mock.calls[0]?.[0].data,
      ).not.toHaveProperty("imageUrl");
    },
  );

  it("does not create history when price is unchanged", async () => {
    mocks.fetchProduct.mockResolvedValue({ ...scraped(), price: 100_000 });
    await processProduct(product, { FREE: 60 }, 1_440);
    expect(mocks.tx.priceHistory.create).not.toHaveBeenCalled();
  });

  it("records a failed check and preserves product metadata", async () => {
    mocks.fetchProduct.mockRejectedValue(new Error("marketplace timeout"));
    await processProduct(product, { FREE: 60 }, 1_440);

    expect(mocks.tx.product.update).toHaveBeenCalledOnce();
    expect(mocks.tx.product.update.mock.calls[0]?.[0].data).toEqual({
      nextCheckAt: expect.any(Date),
    });
    expect(mocks.tx.priceCheck.update.mock.calls[0]?.[0].data).toMatchObject({
      status: "FAILED",
      errorMessage: "marketplace timeout",
    });
  });
});
