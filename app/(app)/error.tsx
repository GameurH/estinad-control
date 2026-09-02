"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AppError({
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
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="hairline max-w-md bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 h-1.5 w-1.5 rotate-45 border border-line-strong" aria-hidden />
        <h2 className="text-sm font-semibold text-ink">Something failed while loading.</h2>
        <p className="mt-2 text-sm text-muted">
          {error.message || "An unexpected error occurred in the console."}
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[0.65rem] text-faint">ref {error.digest}</p>
        ) : null}
        <Button type="button" variant="primary" size="sm" onClick={reset} className="mt-6">
          Retry
        </Button>
      </div>
    </div>
  );
}
