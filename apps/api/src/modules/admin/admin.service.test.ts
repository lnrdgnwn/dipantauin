import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminRepository } from "./admin.repository";
import { AdminService, createPlanSchema } from "./admin.service";

describe("AdminService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("paginates users and flattens tracked-product counts", async () => {
    vi.spyOn(AdminRepository, "findUsers").mockResolvedValue([
      { id: "a", _count: { userProducts: 2 } }, { id: "b", _count: { userProducts: 0 } }, { id: "c", _count: { userProducts: 1 } },
    ] as never);
    await expect(AdminService.getUsers({ limit: 2 })).resolves.toEqual({
      items: [{ id: "a", trackedProductsCount: 2 }, { id: "b", trackedProductsCount: 0 }],
      pageInfo: { hasMore: true, nextCursor: "b" },
    });
  });

  it.each([
    ["getUser", "findUserById", "User not found"],
    ["getSubscription", "findSubscriptionDetail", "Subscription not found"],
    ["getPayment", "findPaymentDetail", "Payment not found"],
  ] as const)("returns 404 from %s for missing records", async (service, repository, message) => {
    vi.spyOn(AdminRepository, repository).mockResolvedValue(null);
    await expect(AdminService[service]("missing")).rejects.toMatchObject({ statusCode: 404, message });
  });

  it("sanitizes marketplace errors and BigInt IDs", async () => {
    vi.spyOn(AdminRepository, "findPriceChecks").mockResolvedValue([
      { id: 1n, errorMessage: "request timeout" }, { id: 2n, errorMessage: "secret internal failure" },
    ] as never);
    const result = await AdminService.getPriceChecks({ limit: 10 });
    expect(result.items).toEqual([
      { id: "1", errorMessage: "Marketplace tidak merespons tepat waktu" },
      { id: "2", errorMessage: "Pemeriksaan marketplace gagal" },
    ]);
  });

  it("strictly validates plan creation business fields", () => {
    expect(createPlanSchema.safeParse({ code: "pro", name: "Pro", price: -1, maxProducts: 0, checkIntervalMin: 0 }).success).toBe(false);
    expect(createPlanSchema.safeParse({ code: "PRO", name: "Pro", price: 0, maxProducts: 1, checkIntervalMin: 60 }).success).toBe(true);
  });
});
