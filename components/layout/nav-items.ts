import {
  LayoutDashboard, Building2, CreditCard, KeyRound, LayoutGrid, MonitorSmartphone,
  FileJson2, Rocket, ScrollText, ShieldCheck,
} from "lucide-react";

/** Single source of truth for primary navigation (sidebar, mobile nav, command palette). */
export const NAV = [
  { href: "/dashboard", label: "Dashboard", hint: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", hint: "Commercial plane", icon: Building2 },
  { href: "/subscriptions", label: "Subscriptions", hint: "Lifecycle", icon: CreditCard },
  { href: "/licenses", label: "Licenses", hint: "Keys, renewal, revocation", icon: KeyRound },
  { href: "/apps", label: "Apps", hint: "App catalog & adoption", icon: LayoutGrid },
  { href: "/devices", label: "Devices", hint: "Bindings & validation", icon: MonitorSmartphone },
  { href: "/entitlements", label: "Entitlements", hint: "Signed snapshots", icon: FileJson2 },
  { href: "/provisioning", label: "Provisioning", hint: "New tenants & licenses", icon: Rocket },
  { href: "/audit", label: "Audit Log", hint: "Every action", icon: ScrollText },
] as const;

export const SUPER_ADMIN_NAV = [
  { href: "/operators", label: "Operators", hint: "Platform admins", icon: ShieldCheck },
] as const;

export function getNav(showOperators: boolean) {
  return showOperators ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;
}
