import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { getLicenseDetail } from "@/lib/licensing/queries";
import {
  setLicenseStatusAction,
  unbindDeviceAction,
  rebuildEntitlementAction,
} from "@/lib/licensing/actions";
import { ActionDialog } from "@/components/action-dialog";
import { EntitlementInspector } from "@/components/entitlement-inspector";
import { RenewDialog, RevokeDialog } from "./license-actions";
import {
  DetailCell,
  DetailGrid,
  KindBadge,
  LicenseStatusBadge,
  Mono,
  PageHeader,
  Panel,
  PanelHeader,
  EmptyState,
  Tag,
  TenantStatusBadge,
} from "@/components/ui";
import { formatDate, formatDateTime, formatSeats, humanize, shortHash } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LicenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { license, audit } = await getLicenseDetail(id);
  if (!license) notFound();

  const deviceBound = Boolean(license.device_hash && license.device_hash !== "");
  const tenantId = license.tenants?.id ?? license.tenant_id;

  return (
    <>
      <PageHeader
        eyebrow={`License · ${license.kind}`}
        title={license.license_key}
        description={license.tenants ? `Tenant: ${license.tenants.name}` : undefined}
        actions={
          <>
            <Link
              href={`/tenants/${tenantId}`}
              className="hairline h-8 bg-bg px-3 text-xs leading-8 text-muted transition-colors hover:text-ink"
            >
              Tenant →
            </Link>
            <RenewDialog
              licenseId={license.id}
              tenantId={license.tenant_id}
              licenseKey={license.license_key}
              currentExpiry={license.expires_at}
            />
            {license.status === "active" ? (
              <ActionDialog
                label="Suspend"
                title="Suspend license"
                description={`Temporarily suspend ${license.license_key} without revoking it.`}
                confirmLabel="Suspend"
                action={setLicenseStatusAction.bind(null, {
                  licenseId: license.id,
                  tenantId: license.tenant_id,
                  licenseKey: license.license_key,
                  status: "suspended",
                })}
              />
            ) : license.status === "suspended" ? (
              <ActionDialog
                label="Reactivate"
                title="Reactivate license"
                description={`Return ${license.license_key} to active.`}
                confirmLabel="Reactivate"
                action={setLicenseStatusAction.bind(null, {
                  licenseId: license.id,
                  tenantId: license.tenant_id,
                  licenseKey: license.license_key,
                  status: "active",
                })}
              />
            ) : null}
            {license.status !== "revoked" ? (
              <RevokeDialog
                licenseId={license.id}
                tenantId={license.tenant_id}
                licenseKey={license.license_key}
              />
            ) : null}
          </>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <DetailGrid cols={4}>
          <DetailCell label="Status">
            <div className="flex flex-wrap items-center gap-2">
              <LicenseStatusBadge status={license.status} />
              <KindBadge kind={license.kind} />
            </div>
            {license.revoked_at ? (
              <Mono className="mt-1 block text-[0.65rem]" style={{ color: "var(--status-danger-fg)" }}>
                revoked {formatDate(license.revoked_at)} — {license.revocation_reason ?? "no reason recorded"}
              </Mono>
            ) : null}
          </DetailCell>
          <DetailCell label="Tenant">
            {license.tenants ? (
              <>
                <Link href={`/tenants/${tenantId}`} className="font-medium hover:underline">
                  {license.tenants.name}
                </Link>
                <div className="mt-1">
                  <TenantStatusBadge status={license.tenants.status} />
                </div>
              </>
            ) : (
              "—"
            )}
          </DetailCell>
          <DetailCell label="Issued">{formatDateTime(license.issued_at)}</DetailCell>
          <DetailCell label="Expires">{formatDateTime(license.expires_at)}</DetailCell>
          <DetailCell label="Products">
            <div className="flex flex-wrap gap-1">
              {(license.products ?? []).map((p) => (
                <Tag key={p}>{p}</Tag>
              ))}
              {(license.products ?? []).length === 0 ? "—" : null}
            </div>
          </DetailCell>
          <DetailCell label="Feature IDs">
            {(license.feature_ids ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {license.feature_ids!.map((f) => (
                  <Tag key={f}>{f}</Tag>
                ))}
              </div>
            ) : (
              <span className="text-faint">none</span>
            )}
          </DetailCell>
          <DetailCell label="Seats">{formatSeats(license.seats)}</DetailCell>
          <DetailCell label="Grace days">{license.grace_days ?? "—"}</DetailCell>
        </DetailGrid>

        {/* Device binding */}
        <Panel>
          <PanelHeader title="Device binding" meta="runtime plane" />
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            <DetailCell label="Device hash">
              {deviceBound ? (
                <Mono className="break-all" title={license.device_hash!}>
                  {license.device_hash}
                </Mono>
              ) : (
                <span className="text-faint">unbound</span>
              )}
            </DetailCell>
            <DetailCell label="Device name">{license.device_name ?? "—"}</DetailCell>
            <DetailCell label="Device OS">{license.device_os ?? "—"}</DetailCell>
            <DetailCell label="Last validated">
              {formatDateTime(license.last_validated_at)}
              {license.last_validated_ip ? (
                <Mono className="mt-1 block text-[0.65rem] text-faint">
                  ip {license.last_validated_ip}
                </Mono>
              ) : null}
            </DetailCell>
            <DetailCell label="Validations">{license.validation_count ?? 0}</DetailCell>
            <DetailCell label="Failed validations">
              <span
                style={
                  (license.failed_validation_count ?? 0) > 0
                    ? { color: "var(--status-danger-fg)" }
                    : undefined
                }
              >
                {license.failed_validation_count ?? 0}
              </span>
            </DetailCell>
            <DetailCell label="Device info">
              <Mono className="break-all text-[0.65rem]">
                {license.device_info ? JSON.stringify(license.device_info) : "—"}
              </Mono>
            </DetailCell>
            <div className="bg-card p-4">
              <p className="eyebrow mb-1.5">Operations</p>
              <div className="flex flex-wrap gap-2">
                {deviceBound ? (
                  <ActionDialog
                    label="Unbind device"
                    title="Unbind device"
                    description={`Clear the device binding on ${license.license_key}. The license can then be activated on a new device.`}
                    confirmLabel="Unbind"
                    action={unbindDeviceAction.bind(null, {
                      licenseId: license.id,
                      tenantId: license.tenant_id,
                      licenseKey: license.license_key,
                    })}
                  />
                ) : null}
                {deviceBound ? (
                  <ActionDialog
                    label="Rebuild entitlement"
                    title="Rebuild entitlement snapshot"
                    description="Re-run the existing activation RPC for this license's bound device so the stored snapshot matches current commercial state. Uses the licensing backend — no logic is re-implemented here."
                    confirmLabel="Rebuild"
                    action={rebuildEntitlementAction.bind(null, {
                      licenseKey: license.license_key,
                      deviceHash: license.device_hash!,
                    })}
                  />
                ) : null}
                {!deviceBound ? (
                  <p className="text-xs text-muted">
                    Bind occurs on first activation from the product.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Panel>

        {/* Entitlement inspection */}
        <Panel>
          <PanelHeader title="Entitlement" meta="signed snapshot" />
          <div className="p-4">
            <EntitlementInspector
              payload={license.entitlement_payload as Record<string, unknown> | null}
              signature={license.signature}
            />
          </div>
        </Panel>

        {/* License audit */}
        <Panel>
          <PanelHeader title="License audit" meta={`${audit.length} entries`} />
          {audit.length === 0 ? (
            <EmptyState title="No audit entries reference this license." />
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Mono className="text-ink">{humanize(a.action)}</Mono>
                      {a.actor_email ? (
                        <Mono className="text-[0.65rem] text-faint">{shortHash(a.actor_email, 26)}</Mono>
                      ) : (
                        <Tag>{a.actor_type}</Tag>
                      )}
                    </div>
                    <Mono className="text-[0.65rem] text-faint">{formatDateTime(a.created_at)}</Mono>
                  </div>
                  {a.details ? (
                    <p className="mt-1 break-all font-mono text-[0.65rem] text-muted">
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
