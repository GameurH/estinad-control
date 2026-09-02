import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { getTenantDetail } from "@/lib/licensing/queries";
import { setTenantStatusAction } from "@/lib/licensing/actions";
import { ActionDialog } from "@/components/action-dialog";
import {
  DetailCell,
  DetailGrid,
  KindBadge,
  LicenseStatusBadge,
  Mono,
  PageHeader,
  Panel,
  PanelHeader,
  TenantStatusBadge,
  TableWrap,
  Td,
  Th,
  Tr,
  EmptyState,
  Tag,
} from "@/components/ui";
import { formatDate, formatDateTime, formatRelative, formatSeats, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { tenant, licenses, audit, owners } = await getTenantDetail(id);
  if (!tenant) notFound();

  const status = tenant.status;

  return (
    <>
      <PageHeader
        eyebrow={`Tenant · ${tenant.slug}`}
        title={tenant.business_name ?? tenant.name}
        description={tenant.owner_email ?? undefined}
        actions={
          <>
            {status !== "active" ? (
              <ActionDialog
                label="Activate"
                title="Activate subscription"
                description={`Set ${tenant.name} to active. Suspended/cancelled tenants stop validating at runtime.`}
                confirmLabel="Activate"
                action={setTenantStatusAction.bind(null, { tenantId: tenant.id, status: "active" })}
              />
            ) : null}
            {status === "active" || status === "trial" ? (
              <ActionDialog
                label="Suspend"
                title="Suspend subscription"
                description={`Suspend ${tenant.name}. All license validation will report tenant_suspended.`}
                confirmLabel="Suspend"
                danger
                requireText="SUSPEND"
                action={setTenantStatusAction.bind(null, { tenantId: tenant.id, status: "suspended" })}
              />
            ) : null}
            {status !== "cancelled" ? (
              <ActionDialog
                label="Cancel"
                title="Cancel subscription"
                description={`Cancel ${tenant.name}'s subscription. This is the commercial end of life.`}
                confirmLabel="Cancel subscription"
                danger
                requireText="CANCEL"
                action={setTenantStatusAction.bind(null, { tenantId: tenant.id, status: "cancelled" })}
              />
            ) : null}
            <Link
              href="/provisioning"
              className="h-8 bg-ink px-3 text-xs font-medium leading-8 text-bg transition-opacity hover:opacity-90"
            >
              Issue license
            </Link>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <DetailGrid cols={4}>
          <DetailCell label="Status">
            <div className="flex items-center gap-2">
              <TenantStatusBadge status={status} />
            </div>
          </DetailCell>
          <DetailCell label="Business type">{humanize(tenant.business_type)}</DetailCell>
          <DetailCell label="Trial ends">{formatDateTime(tenant.trial_ends_at)}</DetailCell>
          <DetailCell label="Created">{formatDateTime(tenant.created_at)}</DetailCell>
          <DetailCell label="Activated">{formatDateTime(tenant.activated_at)}</DetailCell>
          <DetailCell label="Suspended">{formatDateTime(tenant.suspended_at)}</DetailCell>
          <DetailCell label="Cancelled">{formatDateTime(tenant.cancelled_at)}</DetailCell>
          <DetailCell label="Owner phone">{tenant.owner_phone ?? "—"}</DetailCell>
        </DetailGrid>

        <Panel>
          <PanelHeader title="Licenses" meta={`${licenses.length} issued`} />
          {licenses.length === 0 ? (
            <EmptyState
              title="No licenses issued to this tenant."
              description="Issue one from the Provisioning section."
            />
          ) : (
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>License key</Th>
                    <Th>Kind</Th>
                    <Th>Status</Th>
                    <Th>Products</Th>
                    <Th>Seats</Th>
                    <Th>Device</Th>
                    <Th>Issued</Th>
                    <Th>Expires</Th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((l) => (
                    <Tr key={l.id}>
                      <Td>
                        <Link
                          href={`/licenses/${l.id}`}
                          className="font-mono text-xs text-ink hover:underline"
                        >
                          {l.license_key}
                        </Link>
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
                      <Td className="font-mono text-xs text-ink-secondary">
                        {l.device_hash ? (l.device_hash === "" ? "unbound" : l.device_hash.slice(0, 10) + "…") : "—"}
                      </Td>
                      <Td className="text-ink-secondary">{formatDate(l.issued_at)}</Td>
                      <Td className="text-ink-secondary">{formatDate(l.expires_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        {owners.length > 0 ? (
          <Panel>
            <PanelHeader title="Owners" meta="tenant_owners" />
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Invited</Th>
                    <Th>Accepted</Th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <Mono>{o.user_id.slice(0, 8)}…</Mono>
                      </Td>
                      <Td>
                        <Tag>{o.role}</Tag>
                      </Td>
                      <Td className="text-ink-secondary">{formatDate(o.invited_at)}</Td>
                      <Td className="text-ink-secondary">{formatDate(o.accepted_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Panel>
        ) : null}

        <Panel>
          <PanelHeader title="Tenant audit" meta={`${audit.length} entries`} />
          {audit.length === 0 ? (
            <EmptyState title="No audit entries for this tenant." />
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Mono className="text-ink">{humanize(a.action)}</Mono>
                      <Tag>{a.actor_type}</Tag>
                      {a.actor_email ? <Mono className="text-[0.65rem] text-faint">{a.actor_email}</Mono> : null}
                    </div>
                    <Mono className="text-[0.65rem] text-faint">
                      {formatDateTime(a.created_at)} · {formatRelative(a.created_at)}
                    </Mono>
                  </div>
                  {a.details && Object.keys(a.details).length > 0 ? (
                    <p className="mt-1 break-all font-mono text-[0.65rem] leading-relaxed text-muted">
                      {JSON.stringify(a.details)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
