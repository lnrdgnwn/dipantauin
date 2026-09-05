import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTracker, TrackerError } from "@dipantauin/worker/trackers";
import { ProductsRepository } from "./products.repository";
import { ProductsService, addProductSchema } from "./products.service";

vi.mock("@dipantauin/worker/trackers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dipantauin/worker/trackers")>();
  return { ...actual, getTracker: vi.fn() };
});

const preview = {
  marketplace: "TOKOPEDIA", externalProductId: "external", canonicalUrl: "https://tokopedia.com/item",
  name: "Item", price: 10_000, originalPrice: null, imageUrl: null, availability: "IN_STOCK", fetchedAt: new Date(),
};

describe("ProductsService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects malformed and extra URL input", () => {
    expect(addProductSchema.safeParse({ url: "not-url" }).success).toBe(false);
    expect(addProductSchema.safeParse({ url: "https://example.com", extra: true }).success).toBe(false);
  });

  it.each([
    ["NOT_FOUND", 404], ["BLOCKED", 429], ["TIMEOUT", 504], ["PARSE_FAILED", 422],
  ])("maps tracker %s failures to HTTP %s", async (code, statusCode) => {
    vi.mocked(getTracker).mockReturnValue({ fetchProduct: vi.fn().mockRejectedValue(new TrackerError(code as never, "failed")) } as never);
    await expect(ProductsService.fetchPreview("https://example.com")).rejects.toMatchObject({ statusCode, code });
  });

  it("reuses an existing global product by marketplace identity", async () => {
    vi.spyOn(ProductsService, "fetchPreview").mockResolvedValue(preview as never);
    const existing = { id: "existing" };
    vi.spyOn(ProductsRepository, "findByExternalIdentity").mockResolvedValue(existing as never);
    const create = vi.spyOn(ProductsRepository, "create");
    await expect(ProductsService.addProduct({ url: preview.canonicalUrl })).resolves.toBe(existing);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a new product and protects missing product mutations", async () => {
    vi.spyOn(ProductsService, "fetchPreview").mockResolvedValue(preview as never);
    vi.spyOn(ProductsRepository, "findByExternalIdentity").mockResolvedValue(null);
    vi.spyOn(ProductsRepository, "create").mockResolvedValue({ id: "new" } as never);
    await expect(ProductsService.addProduct({ url: preview.canonicalUrl })).resolves.toEqual({ id: "new" });
    vi.spyOn(ProductsRepository, "findById").mockResolvedValue(null);
    await expect(ProductsService.deleteProduct("missing")).rejects.toMatchObject({ statusCode: 404 });
  });
});
