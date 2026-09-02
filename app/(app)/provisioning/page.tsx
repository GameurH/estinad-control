import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listAudit, listTenantOptions } from "@/lib/licensing/queries";
import { getCatalog } from "@/lib/licensing/catalog";
import { ProvisionForms } from "./provision-forms";
import {
  EmptyState,
  Mono,
  PageBody,
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
  const [tenants, history, catalog] = await Promise.all([
    listTenantOptions(),
    listAudit({}, 200),
    getCatalog(),
  ]);

  const provisioningHistory = history.filter((a) => PROVISIONING_ACTIONS.includes(a.action));

  return (
    <>
      <PageHeader
        eyebrow="Lifecycle entry point"
        title="Provisioning"
        description="Create tenants and issue licenses. Delegates to the existing provisioning RPCs — the licensing logic stays in the backend."
      />

      <PageBody>
        <Panel>
          <PanelHeader title="Provision" meta="server-side · audited" />
          <ProvisionForms tenants={tenants} catalog={catalog} />
        </Panel>

        <Panel>
          <PanelHeader
            title="Provisioning history"
            meta={`${provisioningHistory.length} recent events`}
            actions={
              <Link
                href="/audit"
                className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
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
            <ul className="divide-line divide-y">
              {provisioningHistory.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-surface"
                >
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Mono className="text-[0.65rem] text-ink">{a.action}</Mono>
                    {a.tenants ? (
                      <Link
                        href={`/tenants/${a.tenant_id}`}
                        className="truncate text-sm text-ink-secondary transition-colors hover:text-ink hover:underline"
                      >
                        {a.tenants.name}
                      </Link>
                    ) : null}
                    <Tag>{a.actor_type}</Tag>
                    {a.details && typeof a.details === "object" && "license_key" in a.details ? (
                      <Mono className="text-[0.65rem] text-faint">{String(a.details.license_key)}</Mono>
                    ) : null}
                  </div>
                  <Mono className="text-[0.65rem] text-faint">{formatDateTime(a.created_at)}</Mono>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
