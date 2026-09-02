import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listTenants, type TenantFilters as TFilters } from "@/lib/licensing/queries";
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
  Stat,
  TableWrap,
  Td,
  Th,
  TenantStatusBadge,
  Tr,
} from "@/components/ui";
import { Filters } from "@/components/filters";
import { formatDate, formatSeats } from "@/lib/utils";
import type { TenantStatus } from "@/types/database";

export const metadata = { title: "Tenants" };
export const dynamic = "force-dynamic";

const STATUSES: TenantStatus[] = ["trial", "active", "suspended", "cancelled"];

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filters: TFilters = {
    q: sp.q,
    status: (STATUSES as string[]).includes(sp.status ?? "")
      ? (sp.status as TenantStatus)
      : "all",
  };
  const tenants = await listTenants(filters);

  const trialCount = tenants.filter((t) => t.status === "trial").length;
  const lostCount = tenants.filter(
    (t) => t.status === "suspended" || t.status === "cancelled",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Commercial plane"
        title="Tenants"
        description="Every organization in the estate, with its license rollup."
      />

      <Filters
        searchPlaceholder="Name, business, owner email, slug…"
        selects={[
          {
            name: "status",
            label: "Status",
            value: filters.status ?? "all",
            options: [
              { value: "all", label: "All" },
              ...STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
      />

      <PageBody>
        <Panel>
          {tenants.length === 0 ? (
            <EmptyState
              title="No tenants match."
              description="Adjust the search or status filter."
            />
          ) : (
            <>
              {/* Table — md and up */}
              <div className="hidden md:block">
                <TableWrap>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <Th scope="col">Tenant</Th>
                        <Th scope="col">Status</Th>
                        <Th scope="col">Owner</Th>
                        <Th scope="col">Licenses</Th>
                        <Th scope="col">Primary license</Th>
                        <Th scope="col">Seats</Th>
                        <Th scope="col">Created</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((t) => (
                        <Tr key={t.id}>
                          <Td>
                            <Link
                              href={`/tenants/${t.id}`}
                              className="font-medium text-ink hover:underline"
                            >
                              {t.name}
                            </Link>
                            <Mono className="block text-[0.65rem] text-faint">{t.slug}</Mono>
                          </Td>
                          <Td>
                            <TenantStatusBadge status={t.status} />
                          </Td>
                          <Td className="text-ink-secondary">
                            {t.owner_email ?? <span className="text-faint">—</span>}
                          </Td>
                          <Td>
                            <Mono>
                              {t.license_count} total
                              {t.trial_license_count > 0 ? ` · ${t.trial_license_count} trial` : ""}
                              {t.paid_license_count > 0 ? ` · ${t.paid_license_count} paid` : ""}
                            </Mono>
                          </Td>
                          <Td>
                            {t.primary_license ? (
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <KindBadge kind={t.primary_license.kind} />
                                  <LicenseStatusBadge status={t.primary_license.status} />
                                </div>
                                <Mono className="text-[0.65rem] text-faint">
                                  exp {formatDate(t.primary_license.expires_at)}
                                </Mono>
                              </div>
                            ) : (
                              <span className="text-faint">—</span>
                            )}
                          </Td>
                          <Td className="text-ink-secondary">{formatSeats(t.primary_license?.seats)}</Td>
                          <Td className="text-ink-secondary">{formatDate(t.created_at)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </div>

              {/* Cards — mobile */}
              <CardList>
                {tenants.map((t) => (
                  <CardRow key={t.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/tenants/${t.id}`}
                          className="block truncate font-medium text-ink hover:underline"
                        >
                          {t.name}
                        </Link>
                        <Mono className="block truncate text-[0.65rem] text-faint">{t.slug}</Mono>
                      </div>
                      <TenantStatusBadge status={t.status} />
                    </div>

                    <dl className="hairline-t mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 text-xs">
                      <div className="min-w-0">
                        <dt className="eyebrow">Owner</dt>
                        <dd className="mt-1 truncate text-ink-secondary">
                          {t.owner_email ?? <span className="text-faint">—</span>}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="eyebrow">Licenses</dt>
                        <dd className="mt-1 font-mono text-ink-secondary">
                          {t.license_count} total
                          {t.trial_license_count > 0 ? ` · ${t.trial_license_count} trial` : ""}
                          {t.paid_license_count > 0 ? ` · ${t.paid_license_count} paid` : ""}
                        </dd>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <dt className="eyebrow">Primary license</dt>
                        <dd className="mt-1">
                          {t.primary_license ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <KindBadge kind={t.primary_license.kind} />
                              <LicenseStatusBadge status={t.primary_license.status} />
                              <Mono className="text-[0.65rem] text-faint">
                                exp {formatDate(t.primary_license.expires_at)}
                              </Mono>
                            </div>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="eyebrow">Seats</dt>
                        <dd className="mt-1 text-ink-secondary">
                          {formatSeats(t.primary_license?.seats)}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="eyebrow">Created</dt>
                        <dd className="mt-1 text-ink-secondary">{formatDate(t.created_at)}</dd>
                      </div>
                    </dl>
                  </CardRow>
                ))}
              </CardList>
            </>
          )}
        </Panel>

        {/* Rollup stats — hairline grid, stacked on mobile */}
        <div className="grid gap-px bg-line sm:grid-cols-3">
          <Stat label="Shown" value={tenants.length} />
          <Stat label="Trials" value={trialCount} />
          <Stat label="Suspended / cancelled" value={lostCount} />
        </div>
      </PageBody>
    </>
  );
}
