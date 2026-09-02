import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy") : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy · HH:mm") : "—";
}

export function formatRelative(value: string | null | undefined): string {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : "—";
}

export function daysUntil(value: string | null | undefined): number | null {
  const d = toDate(value);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function truncate(value: string | null | undefined, n = 24): string {
  if (!value) return "—";
  return value.length <= n ? value : `${value.slice(0, n - 1)}…`;
}

/** Humanize an audit action or identifier: license_issued → License issued */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Group seats JSONB (e.g. {"pos":1,"waiter":0}) into "pos ×1, waiter ×0" */
export function formatSeats(seats: unknown): string {
  if (!seats || typeof seats !== "object") return "—";
  const entries = Object.entries(seats as Record<string, unknown>).filter(
    ([, v]) => typeof v === "number" && v > 0,
  );
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k} ×${v}`).join(", ");
}

export function shortHash(hash: string | null | undefined, n = 10): string {
  if (!hash) return "—";
  if (hash === "") return "unbound";
  return hash.length <= n ? hash : `${hash.slice(0, n)}…`;
}
