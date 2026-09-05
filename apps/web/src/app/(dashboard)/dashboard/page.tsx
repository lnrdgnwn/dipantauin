"use client";

import { useProducts } from "@/hooks/use-products";
import { useNotifications } from "@/hooks/use-notifications";
import { useSubscription } from "@/hooks/use-subscription";
import { Package, Bell, TrendingDown, Plus, Activity } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentProducts } from "@/components/dashboard/recent-products";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: products = [], isLoading: prodLoading } = useProducts();
  const { data: notifications = [] } = useNotifications();
  const { data: subscription } = useSubscription();

  const activeProducts = products.filter((product) => product.isActive);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const productsWithDrop = products.filter((p) =>
    p.targetPrice && p.product.currentPrice && p.product.currentPrice <= p.targetPrice
  );

  return (
    <div className="flex flex-col gap-8 max-w-300 mx-auto w-full">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="display-lg">
            Selamat {new Date().getHours() < 12 ? "pagi" : new Date().getHours() < 18 ? "siang" : "malam"},{" "}
            {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="body-lg text-muted-foreground mt-1">
            {subscription?.plan
              ? `Kamu menggunakan paket ${subscription.plan.name}.`
              : "Pantau produk incaranmu dari satu tempat."}
          </p>
        </div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center justify-center h-10 gap-1.5 px-4 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="size-4" /> Pantau produk
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tracked"
          value={prodLoading ? "—" : products.length}
          icon={Package}
          description="Products being monitored"
        />
        <StatCard
          title="Active"
          value={prodLoading ? "—" : activeProducts.length}
          icon={Activity}
          description="Currently running checks"
        />
        <StatCard
          title="Targets Hit"
          value={prodLoading ? "—" : productsWithDrop.length}
          icon={TrendingDown}
          description="Below or at target price"
        />
        <StatCard
          title="Unread Alerts"
          value={unreadCount}
          icon={Bell}
          description="Notifications waiting"
        />
      </div>

      <RecentProducts products={products} isLoading={prodLoading} />
      <RecentAlerts notifications={notifications} />
    </div>
  );
}
