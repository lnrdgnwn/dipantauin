import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ["admin", "dashboard", "summary"],
    queryFn: adminApi.getDashboardSummary,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: adminApi.getUsers,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
    },
  });
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: queryKeys.admin.subscriptions,
    queryFn: adminApi.getAllSubscriptions,
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: queryKeys.admin.payments,
    queryFn: adminApi.getAllPayments,
  });
}

export function useAdminPriceChecks() {
  return useQuery({ queryKey: queryKeys.admin.priceChecks, queryFn: adminApi.getPriceChecks });
}
