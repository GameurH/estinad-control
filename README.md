# ESTINAD Control

Internal commercial & licensing control plane for the ESTINAD ecosystem, deployed at
**control.estinad.com**.

Control manages **commercial state only** — tenants, subscriptions, licenses, device
bindings, and entitlement inspection. It deliberately contains **no runtime licensing
logic**: ESTINAD products consume signed entitlement snapshots produced by the existing
licensing backend (`provision_tenant`, `activate_license`, `validate_license`,
`reset_device_license` RPCs in the `rms` Supabase project). Control calls those RPCs; it
never re-implements, re-signs, or holds signing private keys.

```
Tenant → Subscription → Provisioning → License → Device → Entitlement → Renewal / Revocation
```

## Sections

| Route | Purpose |
|---|---|
| `/dashboard` | Estate overview: tenants, licenses, expiring terms, recent activity |
| `/tenants` | Tenant registry with license rollups + detail |
| `/subscriptions` | Commercial lifecycle: activate / suspend / cancel |
| `/licenses` | License keys, kinds, terms, device bindings, renewal & revocation |
| `/devices` | Device bindings, validation telemetry, device reset (existing RPC) |
| `/entitlements` | Signed snapshot inspection (read-only) |
| `/provisioning` | New tenant + license issuance (existing RPCs), provisioning history |
| `/audit` | `tenant_audit_log` browser with filters |

## Stack

- Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`)
- TypeScript strict
- Tailwind CSS v4 with the shared ESTINAD monochrome design tokens (light, ivory/ink,
  hairlines — matching `estinad-landing` v2)
- `@supabase/ssr` for auth cookies; `@supabase/supabase-js` service-role client for
  privileged, server-only data access
- lucide-react icons

## Security model

1. **Authentication** — Supabase Auth (email/password). The `proxy.ts` refreshes
   sessions and gates every console route.
2. **Authorization** — server-side only (`lib/rbac.ts`): every privileged server
   component and server action calls `requireAdmin()` / `requirePermission()`, which
   verify the user exists in `platform_admins` and check role permissions:

   | Role | Permissions |
   |---|---|
   | `super_admin` | read, manage licenses, manage subscriptions, provision |
   | `admin` | read, manage licenses, manage subscriptions, provision |
   | `support` | read only |

3. **Privileged data access** — the service-role key is used **only** in
   `lib/supabase/admin.ts`, which imports `server-only` (hard build error if it ever
   reaches the browser). It is used strictly *after* the RBAC check.
4. **Auditability** — every mutation writes a `tenant_audit_log` row with the acting
   admin's identity, IP and user agent (`lib/audit.ts`).
5. **Secrets** — the signing private key and service-role key never leave the server.
   Signatures are displayed read-only; the entitlement payload is never editable here.

## Setup

This project uses **bun** (≥ 1.4.0) as package manager and runner.

```bash
bun install
cp .env.example .env.local   # then fill in the values
bun run dev                  # http://localhost:3010
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://zhfietudqhbjuqjqfvpa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<legacy anon key from the rms project>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — server only, never NEXT_PUBLIC_>
```

### Bootstrap the first platform admin

`platform_admins` is intentionally small and managed manually. After creating a user in
Supabase Auth (Dashboard → Authentication → Add user), promote it:

```sql
-- Run in the Supabase SQL editor (rms project)
insert into public.platform_admins (user_id, email, name, role)
select id, email, coalesce(raw_user_meta_data->>'name', email), 'super_admin'
from auth.users
where email = 'you@estinad.com'
on conflict do nothing;
```

Or run `supabase/seed-platform-admin.sql` after editing the email inside.

## Deployment (control.estinad.com)

`next.config.ts` is deploy-ready as-is (Node hosting / Vercel). For Docker deployments,
add `output: "standalone"` to `next.config.ts` and run `node .next/standalone/server.js`
after the build. Required env vars on the host: the four `.env.local` values above
(`NEXT_PUBLIC_SITE_URL` optional, used for metadata).

```bash
bun run build
bun run start
```

Point `control.estinad.com` at the deployment and restrict access (VPN / IP allowlist /
Cloudflare Access) — this is an internal console.

## Boundary rules

- **Commercial plane (here):** `tenants`, `tenant_licenses` commercial columns,
  `tenant_audit_log`, `platform_admins`.
- **Runtime plane (products):** `FeatureController` / `Product` / `Feature` consume
  `entitlement_payload` + `signature` via `validate_license`. Control never implements
  runtime feature gating.
