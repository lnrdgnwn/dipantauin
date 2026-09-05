"use client";

import { useAdminSubscriptions, useAdminPayments } from "@/hooks/use-admin";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { CreditCard, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminPayment, AdminSubscription } from "@/types/admin";
import { formatRupiah } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSubscriptionsPage() {
  const { data: subscriptions, isLoading: subsLoading } = useAdminSubscriptions();
  const { data: payments, isLoading: paymentsLoading } = useAdminPayments();

  if (subsLoading || paymentsLoading) return <LoadingState text="Loading data..." />;

  return (
    <div className="flex flex-col gap-6 max-w-300 mx-auto w-full">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <CreditCard className="size-6 text-primary" /> Subscriptions & Payments
          </span>
        }
        description="Manage all user subscriptions and view payment history."
      />

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="size-3.5" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <TrendingUp className="size-3.5" /> Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Plan</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Period Start</th>
                    <th className="px-6 py-4 font-medium">Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions?.map((sub: AdminSubscription) => (
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{sub.user?.name}</span>
                          <span className="text-muted-foreground text-xs">{sub.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{sub.plan?.name}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString("id-ID") : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("id-ID") : "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!subscriptions || subscriptions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No subscriptions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((payment: AdminPayment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{payment.user?.name}</span>
                          <span className="text-muted-foreground text-xs">{payment.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {payment.providerTransactionId}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatRupiah(payment.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={payment.status === "PAID" ? "default" : payment.status === "PENDING" ? "outline" : "secondary"} className="text-[10px]">
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                  {(!payments || payments.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
