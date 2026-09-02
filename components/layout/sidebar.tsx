"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Monogram } from "@/components/monogram";
import { getNav } from "./nav-items";

export function Sidebar({ showOperators = false }: { showOperators?: boolean }) {
  const pathname = usePathname();
  const nav = getNav(showOperators);

  return (
    <aside className="hairline-e sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-bg md:flex">
      <div className="hairline-b flex h-14 shrink-0 items-center px-5">
        <Link href="/dashboard" className="flex items-center gap-3" aria-label="ESTINAD Control home">
          <Monogram className="h-6 w-6" />
          <span className="block">
            <span className="block font-mono text-xs font-semibold tracking-[0.3em] text-ink">ESTINAD</span>
            <span className="eyebrow mt-0.5 block">Control · Ops</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary">
        <ul>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 items-center gap-3 border-l-2 pl-[18px] pr-5 text-sm transition-colors",
                    active
                      ? "border-accent bg-surface font-medium text-ink"
                      : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hairline-t px-5 py-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          control.estinad.com
        </p>
      </div>
    </aside>
  );
}
