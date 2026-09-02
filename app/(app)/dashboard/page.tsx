import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { getDashboardData } from "@/lib/licensing/queries";
import {
  CardList,
  CardRow,
  DetailCell,
  DetailGrid,
  EmptyState,
  LicenseStatusBadge,
  Mono,
  PageBody,
  PageHeader,
  Panel,
  PanelHeader,
  Stat,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { daysUntil, formatDate, formatRelative, shortHash } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAdmin();
  const data = await getDashboardData();

  const activeCount = data.licenseStatusCounts["active"] ?? 0;
  const trialCount = data.licenseKindCounts["trial"] ?? 0;
  const paidCount = data.licenseKindCounts["paid"] ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live commercial state of the ESTINAD estate — tenants, licenses, devices."
      />

      <PageBody className="rise">
        {/* Stat row — hairline grid */}
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Tenants"
            value={data.tenantCount}
            meta={`${data.tenantStatusCounts["active"] ?? 0} active · ${data.tenantStatusCounts["trial"] ?? 0} trial · ${data.tenantStatusCounts["suspended"] ?? 0} suspended`}
            href="/tenants"
          />
          <Stat
            label="Active licenses"
            value={activeCount}
            meta={`${paidCount} paid · ${trialCount} trial`}
            href="/licenses"
          />
          <Stat
            label="Bound devices"
            value={data.boundDeviceCount}
            meta="Device-bound license keys"
            href="/devices"
          />
          <Stat
            label="Expiring ≤ 30 days"
            value={data.expiringSoon.length}
            meta="Active licenses approaching expiry"
            href="/licenses?status=active"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Expiring soon */}
          <Panel className="lg:col-span-3">
            <PanelHeader title="Expiring soon" meta="next 30 days" />
            {data.expiringSoon.length === 0 ? (
              <EmptyState
                title="Nothing expiring in the next 30 days."
                description="Active licenses are comfortably inside their term."
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <TableWrap>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <Th scope="col">Tenant</Th>
                          <Th scope="col">License</Th>
                          <Th scope="col">Kind</Th>
                          <Th scope="col">Status</Th>
                          <Th scope="col">Expires</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expiringSoon.map((l) => {
                          const days = daysUntil(l.expires_at);
                          return (
                            <Tr key={l.id}>
                              <Td>
                                <Link
                                  href={`/tenants/${l.tenants?.id ?? l.tenant_id}`}
                                  className="font-medium text-ink hover:underline"
                                >
                                  {l.tenants?.name ?? <span className="text-faint">—</span>}
                                </Link>
                                <Mono className="block text-[0.65rem] text-faint">
                                  {l.tenants?.slug ?? ""}
                                </Mono>
                              </Td>
                              <Td>
                                <Link
                                  href={`/licenses/${l.id}`}
                                  className="block max-w-[14rem] truncate font-mono text-xs text-ink-secondary hover:text-ink"
                                >
                                  {l.license_key}
                                </Link>
                              </Td>
                              <Td>
                                <Mono className="uppercase">{l.kind}</Mono>
                              </Td>
                              <Td>
                                <LicenseStatusBadge status={l.status} />
                              </Td>
                              <Td>
                                {formatDate(l.expires_at)}
                                <span
                                  className={`ml-2 font-mono text-[0.65rem] ${
                                    days !== null && days <= 7 ? "text-danger" : "text-warn"
                                  }`}
                                >
                                  {days}d
                                </span>
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
                  {data.expiringSoon.map((l) => {
                    const days = daysUntil(l.expires_at);
                    return (
                      <CardRow key={l.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/tenants/${l.tenants?.id ?? l.tenant_id}`}
                              className="block truncate font-medium text-ink hover:underline"
                            >
                              {l.tenants?.name ?? <span className="text-faint">—</span>}
                            </Link>
                            <Link
                              href={`/licenses/${l.id}`}
                              className="mt-0.5 block truncate font-mono text-xs text-ink-secondary hover:text-ink"
                            >
                              {l.license_key}
                            </Link>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <LicenseStatusBadge status={l.status} />
                            <Mono className="uppercase text-faint">{l.kind}</Mono>
                          </div>
                        </div>
                        <div className="hairline-t mt-3 flex items-center justify-between pt-2.5 text-xs">
                          <span className="text-muted">Expires {formatDate(l.expires_at)}</span>
                          <span
                            className={`font-mono text-[0.65rem] ${
                              days !== null && days <= 7 ? "text-danger" : "text-warn"
                            }`}
                          >
                            {days}d
                          </span>
                        </div>
                      </CardRow>
                    );
                  })}
                </CardList>
              </>
            )}
          </Panel>

          {/* Composition */}
          <Panel className="lg:col-span-2">
            <PanelHeader title="Composition" />
            <DetailGrid>
              <DetailCell label="License status">
                <ul className="space-y-1.5">
                  {["active", "expired", "revoked", "suspended"].map((s) => (
                    <li key={s} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-ink-secondary">{s}</span>
                      <Mono>{data.licenseStatusCounts[s] ?? 0}</Mono>
                    </li>
                  ))}
                </ul>
              </DetailCell>
              <DetailCell label="License kind">
                <ul className="space-y-1.5">
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">Paid</span>
                    <Mono>{paidCount}</Mono>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">Trial</span>
                    <Mono>{trialCount}</Mono>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">Total issued</span>
                    <Mono>{data.licenseCount}</Mono>
                  </li>
                </ul>
              </DetailCell>
            </DetailGrid>
            <div className="hairline-t px-4 py-3">
              <p className="text-xs leading-relaxed text-muted">
                Control manages commercial state only. Runtime products consume signed
                entitlement snapshots — see{" "}
                <Link href="/entitlements" className="underline hover:text-ink">
                  Entitlements
                </Link>
                .
              </p>
            </div>
          </Panel>
        </div>

        {/* Recent activity */}
        <Panel>
          <PanelHeader
            title="Recent activity"
            meta="tenant_audit_log"
            actions={
              <Link href="/audit" className="text-xs text-muted underline hover:text-ink">
                View audit log →
              </Link>
            }
          />
          {data.recentAudit.length === 0 ? (
            <EmptyState title="No activity recorded yet." />
          ) : (
            <ul className="divide-y divide-line">
              {data.recentAudit.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3"
                >
                  <div className="min-w-0">
                    <Mono className="text-ink">{a.action}</Mono>
                    <span className="mx-2 text-faint" aria-hidden>
                      ·
                    </span>
                    {a.tenants ? (
                      <Link
                        href={`/tenants/${a.tenant_id}`}
                        className="text-sm text-ink-secondary hover:text-ink hover:underline"
                      >
                        {a.tenants.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-faint">system</span>
                    )}
                    {a.actor_email ? (
                      <>
                        <span className="mx-2 text-faint" aria-hidden>
                          ·
                        </span>
                        <Mono className="text-[0.65rem] text-faint">
                          {shortHash(a.actor_email, 22)}
                        </Mono>
                      </>
                    ) : null}
                  </div>
                  <Mono className="shrink-0 text-[0.65rem] text-faint">
                    {formatRelative(a.created_at)}
                  </Mono>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
