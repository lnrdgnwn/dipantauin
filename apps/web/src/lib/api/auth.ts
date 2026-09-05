import { api } from "@/lib/api";
import type { User } from "@/types/auth";

export const authApi = {
  signIn: (email: string, password: string) =>
    api.post<{ data: { user: User } }>("/auth/sign-in", { email, password }).then((r) => r.data.data),
  signUp: (name: string, email: string, password: string) =>
    api.post("/auth/sign-up", { name, email, password, confirmPassword: password }).then((r) => r.data),
  verifyEmail: (email: string, code: string) =>
    api.post<{ data: { user: User } }>("/auth/verify-email", { email, code }).then((r) => r.data.data),
  me: () => api.get<{ data: User }>("/auth/me").then((r) => r.data.data),
  updateProfile: (name: string) =>
    api.patch<{ data: User }>("/auth/me", { name }).then((r) => r.data.data),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.patch("/auth/me/password", { currentPassword, newPassword, confirmPassword }),
  signOut: () => api.post("/auth/sign-out"),
};
