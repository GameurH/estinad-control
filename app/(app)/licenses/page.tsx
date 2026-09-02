import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listLicenses } from "@/lib/licensing/queries";
import {
  EmptyState,
  KindBadge,
  LicenseStatusBadge,
  Mono,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
  Tag,
  TenantStatusBadge,
  Tr,
} from "@/components/ui";
import { Filters } from "@/components/filters";
import { daysUntil, formatDate, formatSeats, shortHash } from "@/lib/utils";
import type { LicenseKind, LicenseStatus } from "@/types/database";

export const metadata = { title: "Licenses" };
export const dynamic = "force-dynamic";

const KINDS: LicenseKind[] = ["trial", "paid"];
const STATUSES: LicenseStatus[] = ["active", "expired", "revoked", "suspended"];

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const licenses = await listLicenses({
    q: sp.q,
    kind: (KINDS as string[]).includes(sp.kind ?? "") ? (sp.kind as LicenseKind) : "all",
    status: (STATUSES as string[]).includes(sp.status ?? "")
      ? (sp.status as LicenseStatus)
      : "all",
  });

  return (
    <>
      <PageHeader
        eyebrow="Commercial plane"
        title="Licenses"
        description="Signed license keys, device bindings, terms and lifecycle."
      />

      <Filters
        searchPlaceholder="License key or device hash…"
        selects={[
          {
            name: "kind",
            label: "Kind",
            value: sp.kind ?? "all",
            options: [
              { value: "all", label: "All" },
              ...KINDS.map((k) => ({ value: k, label: k })),
            ],
          },
          {
            name: "status",
            label: "Status",
            value: sp.status ?? "all",
            options: [
              { value: "all", label: "All" },
              ...STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
      />

      <div className="px-6 py-6 lg:px-8">
        <Panel>
          {licenses.length === 0 ? (
            <EmptyState
              title="No licenses match."
              description="Adjust filters, or issue a license from Provisioning."
            />
          ) : (
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>License key</Th>
                    <Th>Tenant</Th>
                    <Th>Kind</Th>
                    <Th>Status</Th>
                    <Th>Products</Th>
                    <Th>Seats</Th>
                    <Th>Device</Th>
                    <Th>Term</Th>
                    <Th>Validations</Th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((l) => {
                    const days = daysUntil(l.expires_at);
                    return (
                      <Tr key={l.id}>
                        <Td>
                          <Link
                            href={`/licenses/${l.id}`}
                            className="font-mono text-xs text-ink hover:underline"
                          >
                            {l.license_key}
                          </Link>
                          {l.signature ? (
                            <Mono className="block text-[0.6rem] text-faint">signed</Mono>
                          ) : (
                            <Mono className="block text-[0.6rem] text-faint">unsigned</Mono>
                          )}
                        </Td>
                        <Td>
                          {l.tenants ? (
                            <>
                              <Link
                                href={`/tenants/${l.tenants.id}`}
                                className="text-sm font-medium text-ink hover:underline"
                              >
                                {l.tenants.name}
                              </Link>
                              <div className="mt-0.5">
                                <TenantStatusBadge status={l.tenants.status} />
                              </div>
                            </>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </Td>
                        <Td>
                          <KindBadge kind={l.kind} />
                        </Td>
                        <Td>
                          <LicenseStatusBadge status={l.status} />
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {(l.products ?? []).map((p) => (
                              <Tag key={p}>{p}</Tag>
                            ))}
                          </div>
                        </Td>
                        <Td className="text-ink-secondary">{formatSeats(l.seats)}</Td>
                        <Td>
                          {l.device_hash ? (
                            <Mono title={l.device_hash}>{shortHash(l.device_hash)}</Mono>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </Td>
                        <Td>
                          <Mono className="block">{formatDate(l.expires_at)}</Mono>
                          {days !== null && l.status === "active" ? (
                            <span
                              className="font-mono text-[0.65rem]"
                              style={{
                                color:
                                  days < 0
                                    ? "var(--status-danger-fg)"
                                    : days <= 30
                                      ? "var(--status-warn-fg)"
                                      : "var(--color-muted)",
                              }}
                            >
                              {days < 0 ? `${-days}d over` : `${days}d`}
                            </span>
                          ) : null}
                        </Td>
                        <Td>
                          <Mono>{l.validation_count ?? 0}</Mono>
                          {(l.failed_validation_count ?? 0) > 0 ? (
                            <Mono className="block text-[0.65rem]" style={{ color: "var(--status-danger-fg)" }}>
                              {l.failed_validation_count} failed
                            </Mono>
                          ) : null}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
      </div>
    </>
  );
}
