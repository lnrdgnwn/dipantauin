"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { authApi } from "@/lib/api/auth";
import { LogOut, Settings, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader({
  onToggleNavigation,
}: {
  onToggleNavigation: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const unreadCount = useUnreadCount();

  // Basic breadcrumb logic
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] || "Dashboard";
  const title =
    currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);

  const handleLogout = async () => {
    try {
      await authApi.signOut();
    } finally {
      logout();
      router.replace("/sign-in");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={onToggleNavigation}
            aria-label="Buka atau tutup navigasi"
          >
            <Menu className="size-5" />
          </Button>
          <span>Dashboard</span>
          {segments.length > 1 && (
            <>
              <span>/</span>
              <span className="font-medium text-foreground">{title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Link
            href="/dashboard/notifications"
            className="relative flex size-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <Bell className="size-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-sm font-medium uppercase transition-colors hover:bg-muted/80"
              aria-label="Buka menu akun"
            >
              {user?.name?.[0] || "U"}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "User"}
                    </p>

                    <p className="truncate text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 size-4" aria-hidden="true" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => void handleLogout()}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" aria-hidden="true" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
