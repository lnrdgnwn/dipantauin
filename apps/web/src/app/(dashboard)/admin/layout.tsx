"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/hooks/use-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    void authApi
      .me()
      .then((user) => {
        if (!active) return;
        setAuth(user);
        if (user.role === "ADMIN") setIsAuthorized(true);
        else router.replace("/dashboard");
      })
      .catch(() => {
        if (!active) return;
        logout();
        router.replace("/sign-in");
      });

    return () => {
      active = false;
    };
  }, [logout, router, setAuth]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
        Memeriksa akses admin...
      </div>
    );
  }

  return children;
}
