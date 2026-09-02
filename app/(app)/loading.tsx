import { Skeleton } from "@/components/ui";

/** Generic route-loading skeleton: a PageHeader-shaped block plus one Panel-shaped block. */
export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <p className="sr-only">Loading…</p>

      {/* PageHeader shape */}
      <div className="hairline-b bg-bg px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <Skeleton className="mb-3 h-2.5 w-28" />
        <Skeleton className="h-5 w-44 max-w-full sm:w-56" />
        <Skeleton className="mt-2 h-3 w-72 max-w-full" />
      </div>

      {/* Generic panel shape */}
      <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="hairline bg-card shadow-card">
          <div className="hairline-b bg-surface-2/60 px-4 py-3">
            <Skeleton className="h-2.5 w-24" />
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
