import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listAudit, listAuditActions, listTenantOptions } from "@/lib/licensing/queries";
import {
  EmptyState,
  Mono,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
  Tag,
  Tr,
} from "@/components/ui";
import { Filters } from "@/components/filters";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; tenant?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const [entries, actions, tenantOptions] = await Promise.all([
    listAudit({ q: sp.q, action: sp.action, tenantId: sp.tenant }, 150),
    listAuditActions(),
    listTenantOptions(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Audit Log"
        description="Every commercial action, system event, and control-plane operation."
      />

      <Filters
        searchPlaceholder="Actor email, action…"
        selects={[
          {
            name: "action",
            label: "Action",
            value: sp.action ?? "",
            options: [
              { value: "", label: "All actions" },
              ...actions.map((a) => ({ value: a, label: a.replaceAll("_", " ") })),
            ],
          },
          {
            name: "tenant",
            label: "Tenant",
            value: sp.tenant ?? "",
            options: [
              { value: "", label: "All tenants" },
              ...tenantOptions.map((t) => ({ value: t.id, label: t.name })),
            ],
          },
        ]}
      />

      <div className="px-6 py-6 lg:px-8">
        <Panel>
          {entries.length === 0 ? (
            <EmptyState title="No audit entries match." description="Adjust the filters above." />
          ) : (
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Action</Th>
                    <Th>Tenant</Th>
                    <Th>Actor</Th>
                    <Th>Details</Th>
                    <Th>Source</Th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((a) => (
                    <Tr key={a.id}>
                      <Td className="whitespace-nowrap">
                        <Mono>{formatDateTime(a.created_at)}</Mono>
                      </Td>
                      <Td>
                        <Mono className="text-ink">{a.action}</Mono>
                      </Td>
                      <Td>
                        {a.tenants ? (
                          <Link
                            href={`/tenants/${a.tenant_id}`}
                            className="text-sm text-ink hover:underline"
                          >
                            {a.tenants.name}
                          </Link>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Tag>{a.actor_type}</Tag>
                          {a.actor_email ? (
                            <Mono className="text-[0.65rem] text-muted">{a.actor_email}</Mono>
                          ) : null}
                        </div>
                      </Td>
                      <Td className="max-w-md">
                        {a.details && Object.keys(a.details).length > 0 ? (
                          <p className="break-all font-mono text-[0.65rem] leading-relaxed text-muted">
                            {JSON.stringify(a.details)}
                          </p>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </Td>
                      <Td>
                        <Mono className="text-[0.65rem] text-faint">
                          {[a.ip_address, a.user_agent ? "ua" : null].filter(Boolean).join(" · ") || "—"}
                        </Mono>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
        <p className="mt-3 text-xs text-muted">Showing the {entries.length} most recent entries.</p>
      </div>
    </>
  );
}
