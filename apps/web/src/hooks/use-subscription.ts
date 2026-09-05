import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription";
import { queryKeys } from "@/lib/query-keys";

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.billing.subscription,
    queryFn: subscriptionApi.getMine,
    retry: false, // 404 is expected for free users without a sub record
  });
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.billing.plans,
    queryFn: subscriptionApi.getPlans,
    staleTime: 5 * 60 * 1000, // Plans rarely change, cache for 5 min
  });
}
