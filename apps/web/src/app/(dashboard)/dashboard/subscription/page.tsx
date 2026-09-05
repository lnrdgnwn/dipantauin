"use client";

import { useSubscription, usePlans } from "@/hooks/use-subscription";
import { subscriptionApi } from "@/lib/api/subscription";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown } from "lucide-react";
import { useState } from "react";
import type { Plan } from "@/types/subscription";

function PlanCard({ plan, isCurrentPlan }: { plan: Plan; isCurrentPlan: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const result = await subscriptionApi.checkout(plan.id);
      if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const isFree = plan.price === 0;

  return (
    <Card className={isCurrentPlan ? "border-primary shadow-md relative overflow-hidden" : "relative overflow-hidden"}>
      {isCurrentPlan && <div className="absolute top-0 inset-x-0 h-0.5 bg-primary" />}
      {!isFree && !isCurrentPlan && (
        <div className="absolute top-3 right-3">
          <Badge className="text-[10px] gap-1 h-5 px-1.5">
            <Zap className="size-2.5" /> Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2">
          {isFree ? <Crown className="size-4 text-muted-foreground" /> : <Crown className="size-4 text-primary" />}
          <CardTitle className="text-xl">{plan.name}</CardTitle>
        </div>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">
            {plan.price === 0 ? "Free" : `Rp ${plan.price.toLocaleString("id-ID")}`}
          </span>
          {plan.price > 0 && <span className="text-sm ml-1">/month</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5">
            <Check className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Track up to <strong>{plan.maxProducts}</strong> products</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Check className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Price checks every <strong>{plan.checkIntervalHours} hour{plan.checkIntervalHours !== 1 ? "s" : ""}</strong></span>
          </li>
          <li className="flex items-start gap-2.5">
            <Check className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Email notifications</span>
          </li>
          {!isFree && (
            <li className="flex items-start gap-2.5">
              <Check className="size-4 text-primary shrink-0 mt-0.5" />
              <span>Price history charts</span>
            </li>
          )}
        </ul>
        <Button
          className="w-full rounded-full"
          variant={isCurrentPlan ? "secondary" : "default"}
          disabled={isCurrentPlan || loading}
          onClick={!isCurrentPlan ? handleUpgrade : undefined}
        >
          {loading ? "Redirecting..." : isCurrentPlan ? "Current Plan" : "Upgrade"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();

  const currentPlanId = subscription?.planId;

  return (
    <div className="flex flex-col gap-8 max-w-[900px] mx-auto w-full">
      <PageHeader
        title="Subscription"
        description="Manage your plan and billing."
      />

      {/* Current Plan Banner */}
      {!subLoading && subscription && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your current plan</p>
                <h2 className="text-2xl font-bold text-foreground mt-0.5">
                  {subscription.plan.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.currentPeriodEnd
                    ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Forever free"
                  }
                </p>
              </div>
              <Badge
                variant={subscription.status === "ACTIVE" ? "default" : "secondary"}
                className="h-7 px-3 text-xs"
              >
                {subscription.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        {plansLoading ? (
          <LoadingState text="Loading plans..." />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {plans?.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={currentPlanId === plan.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
