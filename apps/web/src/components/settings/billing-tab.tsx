"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, usePlans } from "@/hooks/use-subscription";
import { subscriptionApi } from "@/lib/api/subscription";
import { Check, Crown, Zap } from "lucide-react";
import { useState } from "react";

export function BillingTab() {
  const { data: subscription } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoadingId(planId);
    try {
      const result = await subscriptionApi.checkout(planId);
      if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
    } finally {
      setLoadingId(null);
    }
  };

  const currentPlanId = subscription?.planId;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      {subscription && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium caption-mono">Current Plan</p>
              <h3 className="text-xl font-bold mt-1">{subscription.plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {subscription.currentPeriodEnd
                  ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString("id-ID", { dateStyle: "long" })}`
                  : "No renewal required"}
              </p>
            </div>
            <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"} className="h-7 px-3">
              {subscription.status}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Plan selection */}
      <div>
        <h3 className="font-semibold mb-4">Change Plan</h3>
        {plansLoading ? (
          <div className="grid gap-4 md:grid-cols-2">{[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans?.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              return (
                <Card key={plan.id} className={isCurrent ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan.price === 0 ? <Crown className="size-4 text-muted-foreground" /> : <Zap className="size-4 text-primary" />}
                        <CardTitle>{plan.name}</CardTitle>
                      </div>
                      {isCurrent && <Badge>Current</Badge>}
                    </div>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">
                        {plan.price === 0 ? "Free" : `Rp ${plan.price.toLocaleString("id-ID")}`}
                      </span>
                      {plan.price > 0 && <span className="text-sm ml-1">/mo</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> {plan.maxProducts} products</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Every {plan.checkIntervalHours}h checks</li>
                    </ul>
                    <Button
                      className="w-full rounded-full"
                      variant={isCurrent ? "secondary" : "default"}
                      disabled={isCurrent || loadingId === plan.id}
                      onClick={() => !isCurrent && handleUpgrade(plan.id)}
                    >
                      {loadingId === plan.id ? "Redirecting..." : isCurrent ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
