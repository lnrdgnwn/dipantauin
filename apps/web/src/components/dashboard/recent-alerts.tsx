import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import type { Notification } from "@/types/notification";

interface RecentAlertsProps {
  notifications: Notification[];
}

export function RecentAlerts({ notifications }: RecentAlertsProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Alerts</h2>
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
        >
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-3">
        {notifications.slice(0, 3).map((n) => (
          <div key={n.id} className={`flex gap-3 p-4 rounded-xl border ${!n.isRead ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
            <Bell className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
