import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listTenants } from "@/lib/licensing/queries";
import { setTenantStatusAction } from "@/lib/licensing/actions";
import { ActionDialog } from "@/components/action-dialog";
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
  TenantStatusBadge,
  Tr,
} from "@/components/ui";
import { Filters } from "@/components/filters";
import { daysUntil, formatDate } from "@/lib/utils";
import type { TenantStatus } from "@/types/database";

export const metadata = { title: "Subscriptions" };
export const dynamic = "force-dynamic";

const STATUSES: TenantStatus[] = ["trial", "active", "suspended", "cancelled"];

/** Row-level lifecycle actions — identical bindings across table and mobile cards. */
function LifecycleActions({ id, name, status }: { id: string; name: string; status: TenantStatus }) {
  return (
    <>
      {status !== "active" ? (
        <ActionDialog
          label="Activate"
          title="Activate subscription"
          description={`Set ${name} to active.`}
          confirmLabel="Activate"
          action={setTenantStatusAction.bind(null, {
            tenantId: id,
            status: "active",
          })}
        />
      ) : null}
      {status === "active" || status === "trial" ? (
        <ActionDialog
          label="Suspend"
          title="Suspend subscription"
          description={`Suspend ${name}. All licenses stop validating at runtime.`}
          confirmLabel="Suspend"
          danger
          requireText="SUSPEND"
          action={setTenantStatusAction.bind(null, {
            tenantId: id,
            status: "suspended",
          })}
        />
      ) : null}
      {status !== "cancelled" ? (
        <ActionDialog
          label="Cancel"
          title="Cancel subscription"
          description={`Commercial end of life for ${name}.`}
          confirmLabel="Cancel subscription"
          danger
          requireText="CANCEL"
          action={setTenantStatusAction.bind(null, {
            tenantId: id,
            status: "cancelled",
          })}
        />
      ) : null}
    </>
  );
}

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

      <PageBody>
        <Panel>
          {tenants.length === 0 ? (
            <EmptyState title="No subscriptions match." />
          ) : (
            <>
              <div className="hidden md:block">
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
                                <Mono className="ml-2 text-[0.65rem]">
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
                                <LifecycleActions id={t.id} name={t.name} status={t.status} />
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              </div>

              <CardList>
                {tenants.map((t) => {
                  const days = daysUntil(t.primary_license?.expires_at ?? t.trial_ends_at);
                  return (
                    <CardRow key={t.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/tenants/${t.id}`}
                            className="font-medium text-ink hover:underline"
                          >
                            {t.name}
                          </Link>
                          <Mono className="block text-[0.65rem] text-faint">{t.slug}</Mono>
                        </div>
                        <TenantStatusBadge status={t.status} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="eyebrow">Trial / term</p>
                          <p className="mt-0.5 text-xs text-ink-secondary">
                            {formatDate(t.trial_ends_at)}
                            {days !== null ? (
                              <span className="ml-1.5 font-mono text-[0.65rem] text-faint">
                                {days >= 0 ? `${days}d left` : `${-days}d over`}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div>
                          <p className="eyebrow">Term ends</p>
                          <p className="mt-0.5 text-xs text-ink-secondary">
                            {formatDate(t.primary_license?.expires_at ?? null)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <p className="eyebrow">Licenses</p>
                        {t.primary_license ? (
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <KindBadge kind={t.primary_license.kind} />
                            <LicenseStatusBadge status={t.primary_license.status} />
                            <Mono className="text-[0.65rem] text-faint">{t.license_count} total</Mono>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-xs text-faint">none issued</p>
                        )}
                      </div>

                      <div className="hairline-t mt-3 flex flex-wrap gap-2 pt-3">
                        <LifecycleActions id={t.id} name={t.name} status={t.status} />
                      </div>
                    </CardRow>
                  );
                })}
              </CardList>
            </>
          )}
        </Panel>

        <div className="hairline-t pt-4">
          <p className="eyebrow">Lifecycle</p>
          <p className="mt-1.5 font-mono text-[0.65rem] leading-relaxed text-faint">
            tenant → subscription → provisioning → license → device → entitlement → renewal /
            revocation
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Seats across licenses: {tenants.reduce((acc, t) => acc + t.active_license_count, 0)}{" "}
            active licenses in view. Renewals and revocations live at the license level — see{" "}
            <Link href="/licenses" className="text-ink-secondary underline hover:text-ink">
              Licenses
            </Link>
            .
          </p>
        </div>
      </PageBody>
    </>
  );
}
