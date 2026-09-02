import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LicenseStatus, TenantStatus } from "@/types/database";

/* ============================================================
   ESTINAD Control — UI primitives
   Monochrome editorial console language: hairline frames, mono
   meta, square corners, restrained shadow. Status is the only
   chroma, expressed through badges and 6px dots.
   ============================================================ */

/* ------------------------------ Page scaffolding ------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="hairline-b bg-bg">
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5 lg:px-8">
        <div>
          <p className="eyebrow mb-2">{eyebrow}</p>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("hairline bg-card shadow-card", className)} {...rest}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="hairline-b flex flex-wrap items-center justify-between gap-3 bg-surface-2/60 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow">{title}</h2>
        {meta ? <span className="font-mono text-[0.65rem] text-faint">{meta}</span> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------ Stats ------------------------------ */

export function Stat({
  label,
  value,
  meta,
  href,
}: {
  label: string;
  value: string | number;
  meta?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-mono text-3xl tracking-tight text-ink">{value}</p>
      {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
    </>
  );
  const cls =
    "hairline bg-card p-5 shadow-card transition-colors " +
    (href ? "hover:bg-surface" : "");
  return href ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------ Badges ------------------------------ */

type Tone = "ok" | "warn" | "danger" | "info" | "neutral";

const TONES: Record<Tone, { fg: string; bg: string }> = {
  ok: { fg: "var(--status-ok-fg)", bg: "var(--status-ok-bg)" },
  warn: { fg: "var(--status-warn-fg)", bg: "var(--status-warn-bg)" },
  danger: { fg: "var(--status-danger-fg)", bg: "var(--status-danger-bg)" },
  info: { fg: "var(--status-info-fg)", bg: "var(--status-info-bg)" },
  neutral: { fg: "var(--status-neutral-fg)", bg: "var(--status-neutral-bg)" },
};

const LICENSE_TONES: Record<LicenseStatus, Tone> = {
  active: "ok",
  expired: "warn",
  revoked: "danger",
  suspended: "neutral",
};

const TENANT_TONES: Record<TenantStatus, Tone> = {
  trial: "info",
  active: "ok",
  suspended: "warn",
  cancelled: "danger",
};

const KIND_TONES: Record<string, Tone> = {
  paid: "neutral",
  trial: "info",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em]"
      style={{ color: t.fg, background: t.bg }}
    >
      {dot ? <span className="h-1.5 w-1.5 rotate-45" style={{ background: t.fg }} /> : null}
      {children}
    </span>
  );
}

export function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  return (
    <Badge tone={LICENSE_TONES[status] ?? "neutral"} dot>
      {status}
    </Badge>
  );
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <Badge tone={TENANT_TONES[status] ?? "neutral"} dot>
      {status}
    </Badge>
  );
}

export function KindBadge({ kind }: { kind: string }) {
  return <Badge tone={KIND_TONES[kind] ?? "neutral"}>{kind}</Badge>;
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="hairline inline-flex items-center bg-bg px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">
      {children}
    </span>
  );
}

/* ------------------------------ Tables ------------------------------ */

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({
  children,
  className,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "hairline-b bg-surface-2/60 px-4 py-2.5 text-left font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("hairline-b px-4 py-3 align-middle text-sm text-ink", className)}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  href,
}: {
  children: ReactNode;
  href?: string;
}) {
  if (href) {
    return (
      <tr className="group transition-colors hover:bg-surface">
        {children}
      </tr>
    );
  }
  return <tr className="transition-colors hover:bg-surface">{children}</tr>;
}

/* ------------------------------ States ------------------------------ */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 h-1.5 w-1.5 rotate-45 border border-line-strong" aria-hidden />
        <p className="text-sm font-medium text-ink">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface-2", className)} />;
}

export function Mono({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("font-mono text-xs text-ink-secondary", className)} {...rest}>
      {children}
    </span>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="eyebrow">{label}</p>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

/** Key–value hairline grid used across detail pages. */
export function DetailGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;
  return <div className={cn("grid gap-px bg-line", map[cols])}>{children}</div>;
}

export function DetailCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-card p-4">
      <p className="eyebrow mb-1.5">{label}</p>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}
