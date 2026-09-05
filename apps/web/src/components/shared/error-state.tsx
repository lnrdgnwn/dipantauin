import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading the data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4", className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="rounded-full mt-6">
          Try again
        </Button>
      )}
    </div>
  );
}
