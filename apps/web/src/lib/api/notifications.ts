import { api } from "@/lib/api";
import type { Notification } from "@/types/notification";

export const notificationsApi = {
  getAll: (params?: { read?: boolean; type?: string }) => api.get<{ data: { items: Notification[] } }>("/notifications", { params: { limit: 20, ...params } }).then((r) => r.data.data.items),
  getUnreadCount: () => api.get<{ data: { count: number } }>("/notifications/unread-count").then((r) => r.data.data.count),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};
