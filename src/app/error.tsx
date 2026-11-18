"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";

export default function ErrorBoundary({
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
    <main className="container-page flex flex-1 items-center justify-center py-20">
      <ErrorState
        className="w-full max-w-xl"
        description="An unexpected error occurred. Please try again. If the problem continues, contact us."
        reference={digest}
        onRetry={() => retry()}
      />
    </main>
  );
}
