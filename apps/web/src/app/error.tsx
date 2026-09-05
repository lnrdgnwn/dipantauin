"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      </div>
      <Button onClick={reset} className="rounded-full">
        Try again
      </Button>
    </div>
  );
}
