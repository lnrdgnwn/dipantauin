import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackedProductsApi } from "@/lib/api/products";
import { queryKeys } from "@/lib/query-keys";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: trackedProductsApi.getAll,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => trackedProductsApi.getOne(id),
    enabled: !!id,
  });
}

export function useTrackProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trackedProductsApi.track,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { targetPrice?: number; isActive?: boolean; notifyOnDrop?: boolean; notifyOnIncrease?: boolean } }) =>
      trackedProductsApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

export function useUntrackProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trackedProductsApi.untrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useCheckProductNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trackedProductsApi.checkNow,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
