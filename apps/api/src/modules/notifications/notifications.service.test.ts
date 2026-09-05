import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns cursor pagination without leaking extra rows", async () => {
    vi.spyOn(NotificationsRepository, "findForUser").mockResolvedValue([{ id: "a" }, { id: "b" }, { id: "c" }] as never);
    const result = await NotificationsService.getNotifications("user", { limit: 2, order: "newest" });
    expect(result).toEqual({ items: [{ id: "a" }, { id: "b" }], pageInfo: { hasMore: true, nextCursor: "b" } });
  });

  it("returns unread count and number marked as read", async () => {
    vi.spyOn(NotificationsRepository, "countUnread").mockResolvedValue(4);
    vi.spyOn(NotificationsRepository, "markAllAsRead").mockResolvedValue({ count: 4 });
    await expect(NotificationsService.getUnreadCount("user")).resolves.toEqual({ count: 4 });
    await expect(NotificationsService.markAllAsRead("user")).resolves.toEqual({ updated: 4 });
  });

  it.each(["markAsRead", "deleteNotification"] as const)("returns 404 when %s cannot find an owned notification", async (method) => {
    const repositoryMethod = method === "markAsRead" ? "markAsRead" : "deleteOwned";
    vi.spyOn(NotificationsRepository, repositoryMethod).mockResolvedValue({ count: 0 });
    await expect(NotificationsService[method]("owner", "foreign-id")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("creates only enabled threshold-crossing notifications", async () => {
    vi.spyOn(NotificationsRepository, "findActiveTrackers").mockResolvedValue([
      { id: "drop", userId: "u1", targetPrice: 90, notifyOnDrop: true, notifyOnIncrease: false },
      { id: "disabled", userId: "u2", targetPrice: 90, notifyOnDrop: false, notifyOnIncrease: true },
      { id: "none", userId: "u3", targetPrice: null, notifyOnDrop: true, notifyOnIncrease: true },
    ] as never);
    const createMany = vi.spyOn(NotificationsRepository, "createMany").mockResolvedValue({ count: 1 });
    await NotificationsService.processPriceChange({ id: "product", name: "Phone" }, 100, 85);
    expect(createMany).toHaveBeenCalledWith([expect.objectContaining({ userId: "u1", type: "PRICE_DROP" })]);
  });
});
