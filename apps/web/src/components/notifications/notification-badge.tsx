"use client";

import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/use-notifications";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const count = useUnreadCount();
  if (count === 0) return null;

  return (
    <span className={cn(
      "absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
      className
    )}>
      {count > 9 ? "9+" : count}
    </span>
  );
}
