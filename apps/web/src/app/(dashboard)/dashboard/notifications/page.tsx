"use client";

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const { data: notifications, isLoading, isError, refetch } = useNotifications(tab === "unread" ? { read: false } : undefined);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: markingAll } = useMarkAllAsRead();
  const { mutate: deleteNotification, isPending: deleting } = useDeleteNotification();

  const all = notifications ?? [];

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      <PageHeader
        title="Notifikasi"
        description="Perubahan harga dan aktivitas watchlist terbaru."
      >
        {all.some((notification) => !notification.isRead) && (
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => markAllAsRead()}
            disabled={markingAll}
          >
            <CheckCheck className="mr-2 size-4" />
            Tandai semua dibaca
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <LoadingState text="Memuat notifikasi..." />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="unread">Belum dibaca</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {all.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Belum ada notifikasi"
                description="Perubahan harga dan target yang tercapai akan muncul di sini."
              />
            ) : (
              all.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  deleting={deleting}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {all.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                title="Semua sudah dibaca"
                description="Tidak ada notifikasi baru saat ini."
              />
            ) : (
              all.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  deleting={deleting}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
