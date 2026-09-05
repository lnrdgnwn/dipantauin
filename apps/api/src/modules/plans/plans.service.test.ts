import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlansRepository } from "./plans.repository";
import { PlansService } from "./plans.service";

describe("PlansService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("lists only repository-provided active plans", async () => {
    const plans = [{ id: "free" }, { id: "pro" }];
    vi.spyOn(PlansRepository, "findActive").mockResolvedValue(plans as never);
    await expect(PlansService.getPlans()).resolves.toBe(plans);
  });

  it("returns a plan or a stable 404", async () => {
    vi.spyOn(PlansRepository, "findById").mockResolvedValueOnce({ id: "pro" } as never).mockResolvedValueOnce(null);
    await expect(PlansService.getPlanById("pro")).resolves.toEqual({ id: "pro" });
    await expect(PlansService.getPlanById("missing")).rejects.toMatchObject({ statusCode: 404, message: "Plan not found" });
  });
});
