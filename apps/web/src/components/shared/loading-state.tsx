import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  className?: string;
  text?: string;
}

export function LoadingState({ className, text = "Loading..." }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground", className)}>
      <Loader2 className="size-8 animate-spin" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />;
}
