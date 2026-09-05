import { User } from "./auth";
import { Plan, Subscription } from "./subscription";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  trackedProducts: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export interface AdminUser extends User {
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  trackedProductsCount: number;
  subscriptions: Subscription[];
}

export interface AdminSubscription extends Subscription {
  user: User;
  plan: Plan;
}

export interface AdminPayment {
  id: string; amount: number; status: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED"; providerTransactionId: string; createdAt: string;
  user: Pick<User, "name" | "email">;
}

export interface AdminPriceCheck {
  id: string; status: "PENDING" | "SUCCESS" | "FAILED"; startedAt: string; completedAt: string | null; errorMessage: string | null;
  product: { id: string; name: string; platform: string };
}
