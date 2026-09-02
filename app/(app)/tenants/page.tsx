import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listTenants, type TenantFilters as TFilters } from "@/lib/licensing/queries";
import {
  EmptyState,
  KindBadge,
  LicenseStatusBadge,
  Mono,
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

      <div className="px-6 py-6 lg:px-8">
        <Panel>
          {tenants.length === 0 ? (
            <EmptyState
              title="No tenants match."
              description="Adjust the search or status filter."
            />
          ) : (
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Tenant</Th>
                    <Th>Status</Th>
                    <Th>Owner</Th>
                    <Th>Licenses</Th>
                    <Th>Primary license</Th>
                    <Th>Seats</Th>
                    <Th>Created</Th>
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
                      <Td className="text-ink-secondary">{t.owner_email ?? "—"}</Td>
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
          )}
        </Panel>

        <div className="mt-4 grid gap-px bg-line sm:grid-cols-3">
          <Stat label="Shown" value={tenants.length} />
          <Stat
            label="Trials"
            value={tenants.filter((t) => t.status === "trial").length}
          />
          <Stat
            label="Suspended / cancelled"
            value={tenants.filter((t) => t.status === "suspended" || t.status === "cancelled").length}
          />
        </div>
      </div>
    </>
  );
}
