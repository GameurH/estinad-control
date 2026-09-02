import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6">
      <div className="text-center">
        <p className="eyebrow mb-3">404 · Not found</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          This record does not exist.
        </h1>
        <p className="mt-2 text-sm text-muted">
          The tenant, license, or page you requested is not available.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block h-9 bg-ink px-4 text-xs font-medium leading-9 text-bg transition-opacity hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
