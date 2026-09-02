import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listLicenses } from "@/lib/licensing/queries";
import {
  CardList,
  CardRow,
  EmptyState,
  KindBadge,
  LicenseStatusBadge,
  Mono,
  PageBody,
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
import { getCatalog } from "@/lib/licensing/catalog";
import { daysUntil, formatDate, formatSeats, shortHash } from "@/lib/utils";
import type { LicenseKind, LicenseStatus } from "@/types/database";

export const metadata = { title: "Licenses" };
export const dynamic = "force-dynamic";

const KINDS: LicenseKind[] = ["trial", "paid"];
const STATUSES: LicenseStatus[] = ["active", "expired", "revoked", "suspended"];

/** Expiry countdown tone — over: danger, ≤30d: warn, else muted. */
function expiryTone(days: number): string {
  return days < 0 ? "text-danger" : days <= 30 ? "text-warn" : "text-muted";
}

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string; product?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const catalog = await getCatalog();
  const licenses = await listLicenses({
    q: sp.q,
    kind: (KINDS as string[]).includes(sp.kind ?? "") ? (sp.kind as LicenseKind) : "all",
    status: (STATUSES as string[]).includes(sp.status ?? "")
      ? (sp.status as LicenseStatus)
      : "all",
    product: sp.product,
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
            name: "product",
            label: "App",
            value: sp.product ?? "all",
            options: [
              { value: "all", label: "All" },
              ...catalog.map((a) => ({ value: a.id, label: a.name })),
            ],
          },
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

      <PageBody>
        <Panel>
          {licenses.length === 0 ? (
            <EmptyState
              title="No licenses match."
              description="Adjust filters, or issue a license from Provisioning."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
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
                                className="break-all font-mono text-xs text-ink hover:underline"
                              >
                                {l.license_key}
                              </Link>
                              <Mono className="block text-[0.65rem] text-faint">
                                {l.signature ? "signed" : "unsigned"}
                              </Mono>
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
                                <span className={`font-mono text-[0.65rem] ${expiryTone(days)}`}>
                                  {days < 0 ? `${-days}d over` : `${days}d`}
                                </span>
                              ) : null}
                            </Td>
                            <Td>
                              <Mono>{l.validation_count ?? 0}</Mono>
                              {(l.failed_validation_count ?? 0) > 0 ? (
                                <Mono className="block text-[0.65rem] text-danger">
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
              </div>

              {/* Mobile cards */}
              <CardList>
                {licenses.map((l) => {
                  const days = daysUntil(l.expires_at);
                  return (
                    <CardRow key={l.id} className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/licenses/${l.id}`}
                            className="block break-all font-mono text-xs text-ink hover:underline"
                          >
                            {l.license_key}
                          </Link>
                          <Mono className="mt-0.5 block text-[0.65rem] text-faint">
                            {l.signature ? "signed" : "unsigned"}
                          </Mono>
                        </div>
                        <LicenseStatusBadge status={l.status} />
                      </div>

                      <dl className="hairline-t grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3">
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Tenant</dt>
                          <dd>
                            {l.tenants ? (
                              <>
                                <Link
                                  href={`/tenants/${l.tenants.id}`}
                                  className="text-sm font-medium text-ink hover:underline"
                                >
                                  {l.tenants.name}
                                </Link>
                                <div className="mt-1">
                                  <TenantStatusBadge status={l.tenants.status} />
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-faint">—</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow mb-1">Kind</dt>
                          <dd>
                            <KindBadge kind={l.kind} />
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Term</dt>
                          <dd>
                            <Mono>{formatDate(l.expires_at)}</Mono>
                            {days !== null && l.status === "active" ? (
                              <span className={`block font-mono text-[0.65rem] ${expiryTone(days)}`}>
                                {days < 0 ? `${-days}d over` : `${days}d`}
                              </span>
                            ) : null}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Seats</dt>
                          <dd className="text-sm text-ink-secondary">{formatSeats(l.seats)}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Device</dt>
                          <dd>
                            {l.device_hash ? (
                              <Mono title={l.device_hash}>{shortHash(l.device_hash)}</Mono>
                            ) : (
                              <span className="text-sm text-faint">—</span>
                            )}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Validations</dt>
                          <dd>
                            <Mono>{l.validation_count ?? 0}</Mono>
                            {(l.failed_validation_count ?? 0) > 0 ? (
                              <Mono className="block text-[0.65rem] text-danger">
                                {l.failed_validation_count} failed
                              </Mono>
                            ) : null}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="eyebrow mb-1">Products</dt>
                          <dd>
                            {(l.products ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {(l.products ?? []).map((p) => (
                                  <Tag key={p}>{p}</Tag>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-faint">—</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </CardRow>
                  );
                })}
              </CardList>
            </>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
