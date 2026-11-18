import { RotateCcw, TriangleAlert } from "lucide-react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  /** Shown to help support match server logs (e.g. Next.js error digest). */
  reference?: string;
  /** Provide from a Client Component (e.g. an error boundary's `retry`). */
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again in a moment.",
  reference,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-card px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {reference ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Reference: {reference}
        </p>
      ) : null}
      {onRetry || action ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <Button onClick={onRetry} variant="secondary">
              <RotateCcw aria-hidden /> Try again
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
