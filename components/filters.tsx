"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/ui";

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}

/**
 * URL-synced search + select filters. Server pages read the same
 * searchParams, so filters are shareable, bookmarkable, and SSR-fast.
 */
export function Filters({
  searchPlaceholder, searchKey = "q", selects = [],
}: {
  searchPlaceholder?: string; searchKey?: string; selects?: FilterSelect[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get(searchKey) ?? "";
  const [q, setQ] = useState(urlQ);

  // Adjust local state when the URL changes (back/forward nav, external updates).
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (lastUrlQ !== urlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }

  const [pending, startTransition] = useTransition();

  const push = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="hairline-b flex flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:px-6 lg:px-8" role="search">
      <div className="hairline flex h-10 min-w-0 flex-1 items-center gap-2 bg-surface-2/50 px-3 focus-within:border-line-strong sm:h-9 sm:max-w-sm">
        <Search size={13} className="shrink-0 text-faint" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ [searchKey]: q.trim() });
          }}
          onBlur={() => {
            const current = params.get(searchKey) ?? "";
            if (q.trim() !== current) push({ [searchKey]: q.trim() });
          }}
          placeholder={searchPlaceholder ?? "Search…"}
          className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
          aria-label={searchPlaceholder ?? "Search"}
        />
      </div>

      {selects.map((s) => (
        <label key={s.name} className="flex items-center gap-2">
          <span className="eyebrow hidden sm:block">{s.label}</span>
          <Select
            value={s.value}
            onChange={(e) => push({ [s.name]: e.target.value })}
            aria-label={s.label}
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </label>
      ))}

      {pending ? (
        <span className="font-mono text-[0.65rem] text-faint" role="status" aria-live="polite">
          filtering…
        </span>
      ) : null}
    </div>
  );
}
