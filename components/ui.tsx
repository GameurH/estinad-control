import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LicenseStatus, TenantStatus } from "@/types/database";

/* ============================================================
   ESTINAD Control — UI primitives
   Dark architectural console language: hairline frames, mono
   meta, square corners, restrained elevation. Status is the
   only chroma besides the single brass accent for primary
   actions.
   ============================================================ */

/* ------------------------------ Page scaffolding ------------------------------ */

export function PageHeader({
  eyebrow, title, description, actions,
}: {
  eyebrow: string; title: string; description?: string; actions?: ReactNode;
}) {
  return (
    <header className="hairline-b bg-bg">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{eyebrow}</p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {title}
          </h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function Panel({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("hairline bg-card shadow-card", className)} {...rest}>
      {children}
    </section>
  );
}

export function PanelHeader({ title, meta, actions }: { title: string; meta?: string; actions?: ReactNode }) {
  return (
    <div className="hairline-b flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-surface-2/60 px-4 py-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="eyebrow">{title}</h2>
        {meta ? <span className="truncate font-mono text-[0.65rem] text-faint">{meta}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Standard vertical rhythm + gutter for page content. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

/* ------------------------------ Buttons ------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors " +
  "disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "hairline bg-card text-ink hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger-bg text-danger hairline border-current hover:bg-danger hover:text-bg",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export function Button({
  variant = "secondary", size = "md", className, type = "button", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />;
}

/** Anchor styled as a button (next/link). */
export function ButtonLink({
  variant = "secondary", size = "md", className, ...rest
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}

/** Small mono toggle chip (filters, presets, segmented options). */
export function Chip({
  active = false, className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "hairline inline-flex h-9 select-none items-center justify-center px-2.5 font-mono text-xs transition-colors",
        "disabled:pointer-events-none disabled:opacity-45",
        active ? "border-accent bg-accent text-accent-ink" : "bg-card text-muted hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}

/* ------------------------------ Forms ------------------------------ */

const FIELD_BASE =
  "hairline h-10 w-full bg-surface-2/50 px-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-line-strong";

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, className)} {...rest} />;
}

export function Select({ className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(FIELD_BASE, "h-9 w-auto pr-2 sm:w-auto", className)} {...rest} />;
}

export function Field({
  label, htmlFor, error, hint, children, className,
}: {
  label: string; htmlFor?: string; error?: string; hint?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="eyebrow mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------ Stats ------------------------------ */

export function Stat({ label, value, meta, href }: {
  label: string; value: string | number; meta?: string; href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-mono text-2xl tracking-tight text-ink sm:text-3xl">{value}</p>
      {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
    </>
  );
  const cls =
    "hairline bg-card p-4 shadow-card transition-colors sm:p-5 " +
    (href ? "hover:bg-surface" : "");
  return href ? (
    <Link href={href} className={cls}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------ Badges ------------------------------ */

type Tone = "ok" | "warn" | "danger" | "info" | "neutral";

const TONES: Record<Tone, { fg: string; bg: string }> = {
  ok: { fg: "text-ok", bg: "bg-ok-bg" },
  warn: { fg: "text-warn", bg: "bg-warn-bg" },
  danger: { fg: "text-danger", bg: "bg-danger-bg" },
  info: { fg: "text-info", bg: "bg-info-bg" },
  neutral: { fg: "text-neutral", bg: "bg-neutral-bg" },
};

const LICENSE_TONES: Record<LicenseStatus, Tone> = {
  active: "ok", expired: "warn", revoked: "danger", suspended: "neutral",
};

const TENANT_TONES: Record<TenantStatus, Tone> = {
  trial: "info", active: "ok", suspended: "warn", cancelled: "danger",
};

const KIND_TONES: Record<string, Tone> = { paid: "neutral", trial: "info" };

export function Badge({ children, tone = "neutral", dot = false }: {
  children: ReactNode; tone?: Tone; dot?: boolean;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em]",
        t.fg,
        t.bg,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 shrink-0 rotate-45", t.fg, "bg-current")} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  return <Badge tone={LICENSE_TONES[status] ?? "neutral"} dot>{status}</Badge>;
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge tone={TENANT_TONES[status] ?? "neutral"} dot>{status}</Badge>;
}

export function KindBadge({ kind }: { kind: string }) {
  return <Badge tone={KIND_TONES[kind] ?? "neutral"}>{kind}</Badge>;
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="hairline inline-flex items-center whitespace-nowrap bg-bg px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">
      {children}
    </span>
  );
}

/* ------------------------------ Tables ------------------------------ */

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({ children, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "hairline-b whitespace-nowrap bg-surface-2/60 px-4 py-2.5 text-left font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("hairline-b px-4 py-3 align-middle text-sm text-ink", className)} {...rest}>
      {children}
    </td>
  );
}

export function Tr({ children, href }: { children: ReactNode; href?: string }) {
  if (href) {
    return <tr className="group transition-colors hover:bg-surface">{children}</tr>;
  }
  return <tr className="transition-colors hover:bg-surface">{children}</tr>;
}

/* ------------------------------ Mobile card lists ------------------------------ */

/** Mobile alternative to a wide table — hidden at md and above. */
export function CardList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-px bg-line md:hidden", className)}>{children}</div>
  );
}

/** A single card inside CardList. */
export function CardRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-card p-4", className)}>{children}</div>;
}

/* ------------------------------ States ------------------------------ */

export function EmptyState({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
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
      <div className="break-words text-sm text-ink">{children}</div>
    </div>
  );
}
