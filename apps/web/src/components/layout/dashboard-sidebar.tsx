"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Home,
  Settings,
  Bell,
  CreditCard,
  ShieldAlert,
  Users,
  CircleAlert,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin", icon: ShieldAlert },
  { name: "Manage Users", href: "/admin/users", icon: Users },
  {
    name: "Manage Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  { name: "Failed Checks", href: "/admin/price-checks", icon: CircleAlert },
];

export function DashboardSidebar({
  isCollapsed = false,
  mobileOpen = false,
  onNavigate,
}: {
  isCollapsed?: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const unreadCount = useUnreadCount();

  const isAdmin = user?.role === "ADMIN";
  const currentNavigation = isAdmin ? adminNavigation : navigation;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:z-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "lg:w-20" : "lg:w-64",
      )}
      aria-label="Navigasi utama"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          isCollapsed ? "justify-center" : "px-6",
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          {!isCollapsed && (
            <span className="font-semibold tracking-tight text-foreground">
              Dipantauin
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-y-auto py-4",
          isCollapsed ? "px-2" : "px-6",
        )}
      >
        <nav
          className={cn(
            "flex flex-col space-y-1",
            isCollapsed ? "items-center" : "w-full",
          )}
        >
          {currentNavigation.map((item) => {
            const isActive =
              item.href === "/dashboard" || item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "group relative flex items-center text-sm font-medium transition-colors",
                  isCollapsed
                    ? "size-11 justify-center rounded-full"
                    : "w-full gap-3 rounded-md px-3 py-2",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}

                <div className="relative shrink-0">
                  <item.icon
                    className={cn(
                      "size-4",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    aria-hidden="true"
                  />

                  {!isAdmin &&
                    item.name === "Notifications" &&
                    unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                </div>

                {!isCollapsed && (
                  <span className="flex flex-1 items-center justify-between">
                    {item.name}

                    {!isAdmin &&
                      item.name === "Notifications" &&
                      unreadCount > 0 && (
                        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
