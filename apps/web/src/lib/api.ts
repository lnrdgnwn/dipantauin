import axios from "axios";
import { useAuthStore } from "../hooks/use-auth";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_URL = configuredApiUrl || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Track whether we're already refreshing to avoid infinite loops
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}

// Response interceptor: on 401, try to refresh first, then retry original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      typeof window !== "undefined" &&
      error.response?.data?.code === "PRODUCT_LIMIT_REACHED" &&
      typeof error.response.data.limit === "number"
    ) {
      window.dispatchEvent(
        new CustomEvent("dipantauin:product-limit-reached", {
          detail: { limit: error.response.data.limit },
        }),
      );
    }

    // Only try refresh on 401 and if we haven't already tried on this request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/sign-in")
    ) {
      if (isRefreshing) {
        // Queue this request until refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh
        const refreshRes = await api.post("/auth/refresh");
        const userData = refreshRes.data?.data?.user;

        if (userData) {
          useAuthStore.getState().setAuth(userData);
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed — force sign out
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && window.location.pathname !== "/sign-in") {
          globalThis.open("/sign-in?reason=session-expired", "_self");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
