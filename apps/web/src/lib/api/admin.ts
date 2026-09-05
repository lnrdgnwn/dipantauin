import { client } from "./client";

export const adminApi = {
  getDashboardSummary: async () => {
    const { data } = await client.get("/admin/dashboard/summary");
    return data.data;
  },

  // Users
  getUsers: async () => {
    const { data } = await client.get("/admin/users");
    return data.data.items;
  },

  updateUserStatus: async (userId: string, status: "ACTIVE" | "SUSPENDED") => {
    const { data } = await client.patch(`/admin/users/${userId}/status`, { status });
    return data.data;
  },

  // Subscriptions
  getAllSubscriptions: async () => {
    const { data } = await client.get("/admin/subscriptions");
    return data.data.items;
  },

  cancelSubscription: async (id: string) => {
    const { data } = await client.post(`/admin/subscriptions/${id}/cancel`);
    return data.data;
  },

  // Payments
  getAllPayments: async () => {
    const { data } = await client.get("/admin/payments");
    return data.data.items;
  },
  getPriceChecks: async () => {
    const { data } = await client.get("/admin/price-checks", { params: { limit: 20, status: "FAILED" } });
    return data.data.items;
  },
};
