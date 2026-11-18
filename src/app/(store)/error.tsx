"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function StoreError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <ErrorState
        className="w-full max-w-xl"
        description="This page could not be loaded. Please try again in a moment."
        reference={digest}
        onRetry={() => retry()}
        action={
          <Button asChild variant="ghost">
            <Link href="/">Go to home page</Link>
          </Button>
        }
      />
    </div>
  );
}
