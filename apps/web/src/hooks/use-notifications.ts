import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";

export function useNotifications(params?: { read?: boolean; type?: string }) {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, params ?? {}],
    queryFn: () => notificationsApi.getAll(params),
  });
}

export function useUnreadCount() {
  const { data } = useQuery({ queryKey: [...queryKeys.notifications.all, "unread-count"], queryFn: notificationsApi.getUnreadCount, staleTime: 30_000 });
  return data ?? 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
