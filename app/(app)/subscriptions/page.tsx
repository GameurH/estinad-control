import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listTenants } from "@/lib/licensing/queries";
import { setTenantStatusAction } from "@/lib/licensing/actions";
import { ActionDialog } from "@/components/action-dialog";
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
  TenantStatusBadge,
  Tr,
} from "@/components/ui";
import { Filters } from "@/components/filters";
import { daysUntil, formatDate } from "@/lib/utils";
import type { TenantStatus } from "@/types/database";

export const metadata = { title: "Subscriptions" };
export const dynamic = "force-dynamic";

const STATUSES: TenantStatus[] = ["trial", "active", "suspended", "cancelled"];

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (STATUSES as string[]).includes(sp.status ?? "") ? (sp.status as TenantStatus) : "all";
  const tenants = await listTenants({ q: sp.q, status });

  return (
    <>
      <PageHeader
        eyebrow="Commercial plane · Lifecycle"
        title="Subscriptions"
        description="Tenant commercial state drives runtime validation — suspension and cancellation stop service immediately."
      />

      <Filters
        searchPlaceholder="Tenant, owner email…"
        selects={[
          {
            name: "status",
            label: "Status",
            value: status ?? "all",
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
            <EmptyState title="No subscriptions match." />
          ) : (
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Tenant</Th>
                    <Th>Subscription</Th>
                    <Th>Trial / term</Th>
                    <Th>Licenses</Th>
                    <Th>Term ends</Th>
                    <Th className="text-right">Lifecycle</Th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => {
                    const days = daysUntil(t.primary_license?.expires_at ?? t.trial_ends_at);
                    return (
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
                          {formatDate(t.trial_ends_at)}
                          {days !== null ? (
                            <Mono className="ml-2 text-[0.65rem]" >
                              {days >= 0 ? `${days}d left` : `${-days}d over`}
                            </Mono>
                          ) : null}
                        </Td>
                        <Td>
                          {t.primary_license ? (
                            <div className="flex items-center gap-2">
                              <KindBadge kind={t.primary_license.kind} />
                              <LicenseStatusBadge status={t.primary_license.status} />
                              <Mono className="text-[0.65rem] text-faint">
                                {t.license_count} total
                              </Mono>
                            </div>
                          ) : (
                            <span className="text-faint">none issued</span>
                          )}
                        </Td>
                        <Td className="text-ink-secondary">
                          {formatDate(t.primary_license?.expires_at ?? null)}
                        </Td>
                        <Td>
                          <div className="flex justify-end gap-2">
                            {t.status !== "active" ? (
                              <ActionDialog
                                label="Activate"
                                title="Activate subscription"
                                description={`Set ${t.name} to active.`}
                                confirmLabel="Activate"
                                action={setTenantStatusAction.bind(null, {
                                  tenantId: t.id,
                                  status: "active",
                                })}
                              />
                            ) : null}
                            {t.status === "active" || t.status === "trial" ? (
                              <ActionDialog
                                label="Suspend"
                                title="Suspend subscription"
                                description={`Suspend ${t.name}. All licenses stop validating at runtime.`}
                                confirmLabel="Suspend"
                                danger
                                requireText="SUSPEND"
                                action={setTenantStatusAction.bind(null, {
                                  tenantId: t.id,
                                  status: "suspended",
                                })}
                              />
                            ) : null}
                            {t.status !== "cancelled" ? (
                              <ActionDialog
                                label="Cancel"
                                title="Cancel subscription"
                                description={`Commercial end of life for ${t.name}.`}
                                confirmLabel="Cancel subscription"
                                danger
                                requireText="CANCEL"
                                action={setTenantStatusAction.bind(null, {
                                  tenantId: t.id,
                                  status: "cancelled",
                                })}
                              />
                            ) : null}
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          Lifecycle: <Mono>tenant → subscription → provisioning → license → device → entitlement → renewal / revocation</Mono>.
          Seats across licenses:{" "}
          {tenants.reduce((acc, t) => acc + t.active_license_count, 0)} active licenses in view.
          Renewals and revocations live at the license level — see{" "}
          <Link href="/licenses" className="underline hover:text-ink">
            Licenses
          </Link>
          .
        </p>
      </div>
    </>
  );
}
