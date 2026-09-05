import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed border-border", className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center h-10 gap-1.5 px-4 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <Button onClick={action.onClick} className="rounded-full">{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
