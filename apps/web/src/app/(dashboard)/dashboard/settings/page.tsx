"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Shield, User, CreditCard } from "lucide-react";
import { ProfileTab } from "@/components/settings/profile-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { BillingTab } from "@/components/settings/billing-tab";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      <PageHeader title="Settings" description="Manage your account, security, and billing." />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="size-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="size-3.5" /> Billing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="billing"><BillingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
