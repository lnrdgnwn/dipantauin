"use client";

import { useAdminDashboardSummary, useAdminPayments } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, ShieldAlert, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { AdminPayment, AdminStats } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";

export default function AdminOverviewPage() {
  const { data: summary, isLoading: summaryLoading } = useAdminDashboardSummary();
  const { data: payments, isLoading: paymentsLoading } = useAdminPayments();

  if (summaryLoading || paymentsLoading) {
    return <LoadingState text="Loading admin overview..." />;
  }

  const stats = summary as AdminStats | undefined;

  return (
    <div className="flex flex-col gap-8 max-w-300 mx-auto w-full">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="size-6 text-primary" /> Admin Dashboard
          </span>
        }
        description="Global system overview and statistics."
      />

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card variant="soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium caption-mono uppercase text-muted-foreground">Total Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.activeUsers || 0} active</p>
          </CardContent>
        </Card>

        <Card variant="soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium caption-mono uppercase text-muted-foreground">Active Subs</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.trackedProducts || 0} active tracked products</p>
          </CardContent>
        </Card>

        <Card variant="soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium caption-mono uppercase text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">All paid transactions</p>
          </CardContent>
        </Card>

      </div>

      {/* Recent Payments */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Payments</h2>
        <div className="grid gap-3">
          {payments?.slice(0, 5).map((payment: AdminPayment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div>
                <p className="font-medium text-sm">{payment.user?.name || "Unknown User"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{payment.user?.email}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatRupiah(payment.amount)}</p>
                <Badge variant={payment.status === "PAID" ? "default" : "secondary"} className="mt-1 text-[10px]">
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
          {(!payments || payments.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No recent payments.</p>
          )}
        </div>
      </div>
    </div>
  );
}
