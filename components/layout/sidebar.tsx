"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  KeyRound,
  MonitorSmartphone,
  FileJson2,
  Rocket,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Monogram } from "@/components/monogram";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/licenses", label: "Licenses", icon: KeyRound },
  { href: "/devices", label: "Devices", icon: MonitorSmartphone },
  { href: "/entitlements", label: "Entitlements", icon: FileJson2 },
  { href: "/provisioning", label: "Provisioning", icon: Rocket },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
] as const;

const SUPER_ADMIN_NAV = [
  { href: "/operators", label: "Operators", icon: ShieldCheck },
] as const;

export function Sidebar({ showOperators = false }: { showOperators?: boolean }) {
  const pathname = usePathname();
  const nav = showOperators ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;

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
                    "flex items-center gap-3 px-5 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface font-medium text-ink"
                      : "text-muted hover:text-ink",
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} aria-hidden />
                  <span className="relative">
                    {label}
                    {active ? (
                      <span
                        className="absolute -left-5 top-1/2 h-3 w-px -translate-y-1/2 bg-ink"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hairline-t px-5 py-4">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
          control.estinad.com
        </p>
      </div>
    </aside>
  );
}
