"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { ProductLimitDialog } from "@/components/subscription/product-limit-dialog";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/hooks/use-auth";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const opener = useRef<HTMLDivElement>(null);
  const toggle = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((value) => !value);
    else setMobileOpen((value) => !value);
  };
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close);
  }, [mobileOpen]);
  useEffect(() => {
    let active = true;
    void authApi.me()
      .then((user) => {
        if (!active) return;
        setAuth(user);
        setIsAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        logout();
        router.replace("/sign-in");
      });
    return () => { active = false; };
  }, [logout, router, setAuth]);
  if (!isAuthReady) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Memuat akun...</div>;
  }
  return <div ref={opener} className="flex min-h-dvh bg-background">
    <ProductLimitDialog />
    {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} />}
    <DashboardSidebar isCollapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
    <div className="flex min-w-0 flex-1 flex-col"><DashboardHeader onToggleNavigation={toggle} /><main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>;
}
