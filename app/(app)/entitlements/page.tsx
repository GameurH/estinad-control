import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listEntitlements } from "@/lib/licensing/queries";
import {
  EmptyState,
  KindBadge,
  LicenseStatusBadge,
  Mono,
  PageHeader,
  Panel,
  PanelHeader,
  Tag,
} from "@/components/ui";
import { EntitlementInspector } from "@/components/entitlement-inspector";
import { Filters } from "@/components/filters";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Entitlements" };
export const dynamic = "force-dynamic";

export default async function EntitlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const licenses = await listEntitlements(sp.q);
  const signed = licenses.filter((l) => l.entitlement_payload).length;

  return (
    <>
      <PageHeader
        eyebrow="Commercial → Runtime boundary"
        title="Entitlements"
        description="Signed snapshots consumed by ESTINAD products. Control inspects — it never generates or signs these."
      />

      <Filters searchPlaceholder="License key…" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid gap-px bg-line sm:grid-cols-3">
          <div className="hairline bg-card p-5">
            <p className="eyebrow">Licenses in view</p>
            <p className="mt-3 font-mono text-3xl tracking-tight">{licenses.length}</p>
          </div>
          <div className="hairline bg-card p-5">
            <p className="eyebrow">Signed snapshots</p>
            <p className="mt-3 font-mono text-3xl tracking-tight">{signed}</p>
          </div>
          <div className="hairline bg-card p-5">
            <p className="eyebrow">Awaiting activation</p>
            <p className="mt-3 font-mono text-3xl tracking-tight">{licenses.length - signed}</p>
            <p className="mt-1 text-xs text-muted">Snapshot is built on first activation/validation.</p>
          </div>
        </div>

        {licenses.length === 0 ? (
          <Panel>
            <EmptyState title="No licenses match." />
          </Panel>
        ) : (
          licenses.map((l) => (
            <Panel key={l.id}>
              <PanelHeader
                title={l.license_key}
                meta={`exp ${formatDate(l.expires_at)}`}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <KindBadge kind={l.kind} />
                    <LicenseStatusBadge status={l.status} />
                    {(l.products ?? []).map((p) => (
                      <Tag key={p}>{p}</Tag>
                    ))}
                    <Link
                      href={`/licenses/${l.id}`}
                      className="text-xs text-muted underline hover:text-ink"
                    >
                      License →
                    </Link>
                  </div>
                }
              />
              <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                  {l.tenants ? (
                    <Link href={`/tenants/${l.tenants.id}`} className="font-medium hover:underline">
                      {l.tenants.name}
                    </Link>
                  ) : null}
                  <Mono className="text-[0.65rem] text-faint">{l.tenants?.slug}</Mono>
                </div>
                <EntitlementInspector
                  payload={l.entitlement_payload as Record<string, unknown> | null}
                  signature={l.signature}
                />
              </div>
            </Panel>
          ))
        )}
      </div>
    </>
  );
}
