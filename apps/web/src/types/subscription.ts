export interface Plan {
  id: string;
  name: string;
  price: number;
  maxProducts: number;
  checkIntervalHours: number;
  features?: string[];
}

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  plan: Plan;
}
