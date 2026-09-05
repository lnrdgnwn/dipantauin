export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  products: {
    all: ["tracked-products"] as const,
    detail: (id: string) => ["tracked-products", id] as const,
    history: (id: string, range: string) => ["tracked-products", id, "history", range] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
  billing: {
    subscription: ["billing", "subscription"] as const,
    plans: ["billing", "plans"] as const,
    payments: ["billing", "payments"] as const,
  },
  admin: {
    users: ["admin", "users"] as const,
    subscriptions: ["admin", "subscriptions"] as const,
    payments: ["admin", "payments"] as const,
    priceChecks: ["admin", "price-checks"] as const,
  },
} as const;
