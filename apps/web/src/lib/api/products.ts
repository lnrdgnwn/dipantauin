import { api } from "@/lib/api";
import type { ProductPreview, TrackedProduct } from "@/types/product";

export const trackedProductsApi = {
  getAll: () =>
    api
      .get<{
        data: { items: TrackedProduct[] };
      }>("/tracked-products", { params: { limit: 20 } })
      .then((r) => r.data.data.items),
  getOne: (id: string) =>
    api
      .get<{ data: TrackedProduct }>(`/tracked-products/${id}`)
      .then((r) => r.data.data),
  track: (payload: {
    url: string;
    targetPrice: number;
    notifyOnDrop?: boolean;
    notifyOnIncrease?: boolean;
  }) =>
    api
      .post<{ data: TrackedProduct }>("/tracked-products", payload)
      .then((r) => r.data.data),
  update: (
    id: string,
    payload: {
      targetPrice?: number;
      isActive?: boolean;
      notifyOnDrop?: boolean;
      notifyOnIncrease?: boolean;
    },
  ) =>
    api
      .patch<{ data: TrackedProduct }>(`/tracked-products/${id}`, payload)
      .then((r) => r.data.data),
  untrack: (id: string) => api.delete(`/tracked-products/${id}`),
  checkNow: (id: string) =>
    api
      .post<{
        data: { queuedAt: string; notificationId: string; message: string };
      }>(
        `/tracked-products/${id}/check-now`,
      )
      .then((r) => r.data.data),
  preview: (url: string) =>
    api
      .post<{ data: ProductPreview }>("/products/preview", { url })
      .then((r) => r.data.data),
};
