import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listAudit, listTenantOptions } from "@/lib/licensing/queries";
import { ProvisionForms } from "./provision-forms";
import {
  EmptyState,
  Mono,
  PageHeader,
  Panel,
  PanelHeader,
  Tag,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Provisioning" };
export const dynamic = "force-dynamic";

const PROVISIONING_ACTIONS = [
  "tenant_created",
  "tenant_provisioned_via_control",
  "license_issued",
  "license_issued_via_control",
];

export default async function ProvisioningPage() {
  await requireAdmin();
  const [tenants, history] = await Promise.all([
    listTenantOptions(),
    listAudit({}, 200),
  ]);

  const provisioningHistory = history.filter((a) => PROVISIONING_ACTIONS.includes(a.action));

  return (
    <>
      <PageHeader
        eyebrow="Lifecycle entry point"
        title="Provisioning"
        description="Create tenants and issue licenses. Delegates to the existing provisioning RPCs — the licensing logic stays in the backend."
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <Panel>
          <PanelHeader title="Provision" meta="server-side · audited" />
          <ProvisionForms tenants={tenants} />
        </Panel>

        <Panel>
          <PanelHeader
            title="Provisioning history"
            meta={`${provisioningHistory.length} recent events`}
            actions={
              <Link href="/audit" className="text-xs text-muted underline hover:text-ink">
                Full audit log →
              </Link>
            }
          />
          {provisioningHistory.length === 0 ? (
            <EmptyState
              title="No provisioning events yet."
              description="Provision a tenant above; events appear here immediately."
            />
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {provisioningHistory.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Mono className="text-ink">{a.action}</Mono>
                    {a.tenants ? (
                      <Link
                        href={`/tenants/${a.tenant_id}`}
                        className="text-sm text-ink-secondary hover:text-ink hover:underline"
                      >
                        {a.tenants.name}
                      </Link>
                    ) : null}
                    <Tag>{a.actor_type}</Tag>
                    {a.details && typeof a.details === "object" && "license_key" in a.details ? (
                      <Mono className="text-[0.65rem]">{String(a.details.license_key)}</Mono>
                    ) : null}
                  </div>
                  <Mono className="text-[0.65rem] text-faint">{formatDateTime(a.created_at)}</Mono>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
