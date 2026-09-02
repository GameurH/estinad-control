import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listDevices } from "@/lib/licensing/queries";
import { unbindDeviceAction } from "@/lib/licensing/actions";
import { ActionDialog } from "@/components/action-dialog";
import { DeviceResetForm } from "./device-reset";
import {
  EmptyState,
  KindBadge,
  LicenseStatusBadge,
  Mono,
  PageHeader,
  Panel,
  PanelHeader,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { formatDateTime, formatRelative, shortHash } from "@/lib/utils";

export const metadata = { title: "Devices" };
export const dynamic = "force-dynamic";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { devices, validationCache } = await listDevices(sp.q);

  return (
    <>
      <PageHeader
        eyebrow="Runtime plane · Bindings"
        title="Devices"
        description="Device-bound licenses and their validation telemetry."
      />

      <div className="px-6 py-6 lg:px-8">
        <Panel className="mb-6">
          <PanelHeader title="Reset device" meta="existing RPC · audited" />
          <DeviceResetForm />
        </Panel>

        <Panel>
          <PanelHeader title="Bound licenses" meta={`${devices.length} devices`} />
          {devices.length === 0 ? (
            <EmptyState
              title="No device-bound licenses."
              description="Devices appear here after a license is activated from a product."
            />
          ) : (
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Device</Th>
                    <Th>Tenant</Th>
                    <Th>License</Th>
                    <Th>Kind / status</Th>
                    <Th>OS</Th>
                    <Th>Last validated</Th>
                    <Th>Activity</Th>
                    <Th className="text-right">Operations</Th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => {
                    const cache = validationCache.get(d.license_key);
                    return (
                      <Tr key={d.id}>
                        <Td>
                          <Mono title={d.device_hash!}>{shortHash(d.device_hash, 14)}</Mono>
                          {d.device_name ? (
                            <Mono className="block text-[0.65rem] text-faint">{d.device_name}</Mono>
                          ) : null}
                        </Td>
                        <Td>
                          {d.tenants ? (
                            <Link
                              href={`/tenants/${d.tenants.id}`}
                              className="font-medium text-ink hover:underline"
                            >
                              {d.tenants.name}
                            </Link>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </Td>
                        <Td>
                          <Link
                            href={`/licenses/${d.id}`}
                            className="font-mono text-xs text-ink hover:underline"
                          >
                            {d.license_key}
                          </Link>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1.5">
                            <KindBadge kind={d.kind} />
                            <LicenseStatusBadge status={d.status} />
                          </div>
                        </Td>
                        <Td className="text-ink-secondary">{d.device_os ?? "—"}</Td>
                        <Td>
                          <Mono>{formatDateTime(d.last_validated_at)}</Mono>
                          {cache?.blocked_until ? (
                            <Mono
                              className="mt-0.5 block text-[0.65rem]"
                              style={{ color: "var(--status-danger-fg)" }}
                            >
                              blocked until {formatDateTime(cache.blocked_until)}
                            </Mono>
                          ) : null}
                        </Td>
                        <Td>
                          <Mono>{d.validation_count ?? 0} ok</Mono>
                          {(d.failed_validation_count ?? 0) > 0 ? (
                            <Mono
                              className="block text-[0.65rem]"
                              style={{ color: "var(--status-danger-fg)" }}
                            >
                              {d.failed_validation_count} failed
                            </Mono>
                          ) : null}
                          {cache?.consecutive_failures ? (
                            <Mono className="block text-[0.65rem] text-faint">
                              streak {cache.consecutive_failures} · {formatRelative(cache.updated_at)}
                            </Mono>
                          ) : null}
                        </Td>
                        <Td>
                          <div className="flex justify-end">
                            <ActionDialog
                              label="Unbind"
                              title="Unbind device"
                              description={`Clear the binding for ${d.license_key}.`}
                              confirmLabel="Unbind"
                              action={unbindDeviceAction.bind(null, {
                                licenseId: d.id,
                                tenantId: d.tenant_id,
                                licenseKey: d.license_key,
                              })}
                            />
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
      </div>
    </>
  );
}
