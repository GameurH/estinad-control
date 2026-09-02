import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformAdmin } from "@/types/database";
import { OperatorsClient } from "./operators-client";
import { PageBody, PageHeader, Panel, PanelHeader, TableWrap, Td, Th, Tr, Tag, EmptyState } from "@/components/ui";

export const metadata = { title: "Operators" };
export const dynamic = "force-dynamic";

export default async function OperatorsPage() {
  const me = await requireAdmin().catch(() => redirect("/login"));
  const isSuperAdmin = me.role === "super_admin";

  const db = createAdminClient();
  const { data } = await db
    .from("platform_admins")
    .select("*")
    .order("created_at", { ascending: true });

  const operators = ((data ?? []) as PlatformAdmin[]).sort((a, b) => {
    const rank = { super_admin: 0, admin: 1, support: 2 } as const;
    return rank[a.role] - rank[b.role];
  });

  return (
    <>
      <PageHeader
        eyebrow="Access · super_admin"
        title="Operators"
        description="Platform operators with console access. Roles are enforced server-side on every action."
      />

      <PageBody>
        {isSuperAdmin ? (
          <Panel>
            <PanelHeader title="Invite operator" meta="email · audited" />
            <OperatorsClient
              operators={operators.map((o) => ({
                id: o.id,
                email: o.email,
                name: o.name,
                role: o.role,
                lastLoginAt: o.last_login_at,
                createdAt: o.created_at,
              }))}
              myEmail={me.email}
            />
          </Panel>
        ) : (
          <Panel>
            <EmptyState
              title="Super admin only."
              description="Only super_admin can view and manage operators. You are signed in as support/admin with read or commercial scope elsewhere."
            />
          </Panel>
        )}

        {/* Read-only roster for non-super roles is intentionally omitted:
            the roster itself is access-sensitive. Non-super admins get the
            empty state above. */}

        {isSuperAdmin ? (
          <Panel>
            <PanelHeader title="Role model" meta="enforced server-side" />
            <TableWrap>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Role</Th>
                    <Th>Capabilities</Th>
                  </tr>
                </thead>
                <tbody>
                  <Tr>
                    <Td><Tag>super admin</Tag></Td>
                    <Td className="text-ink-secondary">
                      Everything: commercial operations, provisioning, and operator management (this page).
                    </Td>
                  </Tr>
                  <Tr>
                    <Td><Tag>admin</Tag></Td>
                    <Td className="text-ink-secondary">
                      Commercial operations: licenses, subscriptions, provisioning, device resets. No operator management.
                    </Td>
                  </Tr>
                  <Tr>
                    <Td><Tag>support</Tag></Td>
                    <Td className="text-ink-secondary">
                      Read-only across every section. Cannot mutate anything.
                    </Td>
                  </Tr>
                </tbody>
              </table>
            </TableWrap>
          </Panel>
        ) : null}
      </PageBody>
    </>
  );
}
