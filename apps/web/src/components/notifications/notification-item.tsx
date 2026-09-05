"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, CheckCircle, Info, ExternalLink, Trash2 } from "lucide-react";
import type { NotificationType } from "@/types/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types/notification";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

const iconMap: Record<NotificationType, { icon: typeof Info; color: string; bg: string }> = {
  PRICE_DROP: { icon: ArrowDownCircle, color: "text-success", bg: "bg-success/10" },
  PRICE_INCREASE: { icon: ArrowUpCircle, color: "text-destructive", bg: "bg-destructive/10" },
  TARGET_REACHED: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  SYSTEM: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
};

export function NotificationItem({ notification, onMarkAsRead, onDelete, deleting }: NotificationItemProps) {
  const config = iconMap[notification.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex gap-4 p-4 rounded-xl border transition-colors",
      !notification.isRead ? "bg-primary/5 border-primary/20" : "bg-card border-border"
    )}>
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full mt-0.5", config.bg)}>
        <Icon className={cn("size-5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-foreground">{notification.title}</h4>
            {!notification.isRead && (
              <Badge className="text-[10px] h-4 px-1.5">NEW</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        <div className="flex items-center gap-3 mt-3">
          {notification.userProduct && (
            <Link
              href={`/dashboard/products/${notification.userProduct.id}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <ExternalLink className="size-3" /> View Product
            </Link>
          )}
          {!notification.isRead && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs rounded-full"
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark as read
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs rounded-full text-destructive"
              disabled={deleting}
              onClick={() => {
                if (window.confirm("Hapus notifikasi ini?")) onDelete(notification.id);
              }}
            >
              <Trash2 className="size-3" /> Hapus
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
