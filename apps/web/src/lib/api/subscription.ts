import { api } from "@/lib/api";
import type { Subscription, Plan } from "@/types/subscription";

export const subscriptionApi = {
  getMine: () => api.get<{ data: Subscription }>("/subscription").then((r) => r.data.data),
  getPlans: () => api.get<{ data: Plan[] }>("/plans").then((r) => r.data.data),
  checkout: (planId: string) =>
    api.post<{ data: { isFree: boolean; checkoutUrl?: string; paymentId?: string } }>("/subscription/checkout", { planId }).then((r) => r.data.data),
  cancel: () => api.post("/subscription/cancel").then((r) => r.data.data),
};
