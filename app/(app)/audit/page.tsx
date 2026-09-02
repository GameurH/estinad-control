import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { listAudit, listAuditActions, listTenantOptions } from "@/lib/licensing/queries";
import {
  CardList,
  CardRow,
  EmptyState,
  Mono,
  PageBody,
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
import type { Json } from "@/types/database";

export const metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

const DETAIL_CLIP = 140;

const clip = (text: string, max = DETAIL_CLIP) => (text.length > max ? `${text.slice(0, max)}…` : text);

/** Truncated JSON preview; expands via details/summary to the full record. */
function JsonDetails({ value }: { value: Json | null }) {
  if (!value || Object.keys(value).length === 0) {
    return <span className="text-faint">—</span>;
  }
  const text = JSON.stringify(value);
  return (
    <details>
      <summary
        title={text}
        className="cursor-pointer break-all font-mono text-[0.65rem] leading-relaxed text-muted transition-colors hover:text-ink-secondary"
      >
        {clip(text)}
      </summary>
      <pre className="hairline mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all bg-surface px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-ink-secondary">
        {text}
      </pre>
    </details>
  );
}

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

  const rows = entries.map((entry) => ({
    entry,
    source: [entry.ip_address, entry.user_agent ? "ua" : null].filter(Boolean).join(" · ") || "—",
  }));

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

      <PageBody>
        <Panel>
          {entries.length === 0 ? (
            <EmptyState title="No audit entries match." description="Adjust the filters above." />
          ) : (
            <>
              <div className="hidden md:block">
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
                      {rows.map(({ entry: a, source }) => (
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
                            <JsonDetails value={a.details} />
                          </Td>
                          <Td>
                            <Mono className="text-[0.65rem] text-faint">{source}</Mono>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </div>

              <CardList>
                {rows.map(({ entry: a, source }) => (
                  <CardRow key={a.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <Mono className="text-ink">{a.action}</Mono>
                      <Mono className="text-[0.65rem] text-faint">{formatDateTime(a.created_at)}</Mono>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag>{a.actor_type}</Tag>
                        {a.actor_email ? (
                          <Mono className="text-[0.65rem] text-muted">{a.actor_email}</Mono>
                        ) : null}
                      </div>
                      {a.tenants ? (
                        <Link
                          href={`/tenants/${a.tenant_id}`}
                          className="text-xs text-ink-secondary hover:text-ink hover:underline"
                        >
                          {a.tenants.name}
                        </Link>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <JsonDetails value={a.details} />
                    </div>

                    <Mono className="mt-2 block text-[0.65rem] text-faint">{source}</Mono>
                  </CardRow>
                ))}
              </CardList>
            </>
          )}
        </Panel>

        <p className="hairline-t pt-4 text-xs text-muted">
          Showing the {entries.length} most recent entries.
        </p>
      </PageBody>
    </>
  );
}
