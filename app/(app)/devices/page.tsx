import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listDevices } from "@/lib/licensing/queries";
import { unbindDeviceAction } from "@/lib/licensing/actions";
import { ActionDialog } from "@/components/action-dialog";
import { DeviceResetForm } from "./device-reset";
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

      <PageBody>
        <Panel>
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
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
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
                                <Mono className="mt-0.5 block text-[0.65rem] text-danger">
                                  blocked until {formatDateTime(cache.blocked_until)}
                                </Mono>
                              ) : null}
                            </Td>
                            <Td>
                              <Mono>{d.validation_count ?? 0} ok</Mono>
                              {(d.failed_validation_count ?? 0) > 0 ? (
                                <Mono className="block text-[0.65rem] text-danger">
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
              </div>

              {/* Mobile cards */}
              <CardList>
                {devices.map((d) => {
                  const cache = validationCache.get(d.license_key);
                  return (
                    <CardRow key={d.id} className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Mono title={d.device_hash!} className="block break-all">
                            {shortHash(d.device_hash, 14)}
                          </Mono>
                          {d.device_name ? (
                            <Mono className="mt-0.5 block text-[0.65rem] text-faint">
                              {d.device_name}
                            </Mono>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <KindBadge kind={d.kind} />
                          <LicenseStatusBadge status={d.status} />
                        </div>
                      </div>

                      <dl className="hairline-t grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3">
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Tenant</dt>
                          <dd>
                            {d.tenants ? (
                              <Link
                                href={`/tenants/${d.tenants.id}`}
                                className="text-sm font-medium text-ink hover:underline"
                              >
                                {d.tenants.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-faint">—</span>
                            )}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">License</dt>
                          <dd>
                            <Link
                              href={`/licenses/${d.id}`}
                              className="block break-all font-mono text-xs text-ink hover:underline"
                            >
                              {d.license_key}
                            </Link>
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow mb-1">OS</dt>
                          <dd className="text-sm text-ink-secondary">{d.device_os ?? "—"}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="eyebrow mb-1">Last validated</dt>
                          <dd>
                            <Mono>{formatDateTime(d.last_validated_at)}</Mono>
                            {cache?.blocked_until ? (
                              <Mono className="mt-0.5 block text-[0.65rem] text-danger">
                                blocked until {formatDateTime(cache.blocked_until)}
                              </Mono>
                            ) : null}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="eyebrow mb-1">Activity</dt>
                          <dd>
                            <Mono>{d.validation_count ?? 0} ok</Mono>
                            {(d.failed_validation_count ?? 0) > 0 ? (
                              <Mono className="ml-2 text-[0.65rem] text-danger">
                                {d.failed_validation_count} failed
                              </Mono>
                            ) : null}
                            {cache?.consecutive_failures ? (
                              <Mono className="mt-0.5 block text-[0.65rem] text-faint">
                                streak {cache.consecutive_failures} · {formatRelative(cache.updated_at)}
                              </Mono>
                            ) : null}
                          </dd>
                        </div>
                      </dl>

                      <div className="hairline-t flex justify-end pt-3">
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
