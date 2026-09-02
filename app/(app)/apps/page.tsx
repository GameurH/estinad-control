import { requireAdmin } from "@/lib/rbac";
import { getCatalog, type CatalogApp } from "@/lib/licensing/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Mono,
  PageBody,
  PageHeader,
  Panel,
  PanelHeader,
  Stat,
  TableWrap,
  Td,
  Th,
  Tag,
  Tr,
} from "@/components/ui";

export const metadata = { title: "Apps" };
export const dynamic = "force-dynamic";

interface AppStats {
  licenses: number;
  active: number;
  seats: number;
}

export default async function AppsPage() {
  await requireAdmin();
  const catalog = await getCatalog();
  const stats = await adoptionStats(catalog);

  const totalApps = catalog.length;
  const licensedApps = catalog.filter((a) => (stats[a.id]?.licenses ?? 0) > 0).length;
  const totalSeats = catalog.reduce((acc, a) => acc + (stats[a.id]?.seats ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Commercial plane · Portfolio"
        title="Apps"
        description="The app catalog Control can license. Bundles derive from each tenant's business type."
      />

      <PageBody>
        <div className="grid gap-px bg-line sm:grid-cols-3">
          <Stat label="Apps in catalog" value={totalApps} meta="product_catalog (rms)" />
          <Stat label="Apps in use" value={licensedApps} meta="Licensed by at least one tenant" />
          <Stat label="Licensed seats" value={totalSeats} meta="Sum across all apps" />
        </div>

        <Panel>
          <PanelHeader title="Catalog" meta="adoption per app" />
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>App</Th>
                  <Th>Kind</Th>
                  <Th>Bundles</Th>
                  <Th>Default seats</Th>
                  <Th>Licensed tenants</Th>
                  <Th>Active licenses</Th>
                  <Th>Seats</Th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((a) => {
                  const s = stats[a.id] ?? { licenses: 0, active: 0, seats: 0 };
                  return (
                    <Tr key={a.id}>
                      <Td>
                        <span className="font-mono text-xs font-medium text-ink">{a.id}</span>
                        <Mono className="block text-[0.65rem] text-faint">{a.name}</Mono>
                      </Td>
                      <Td>
                        <Tag>{a.kind.replaceAll("_", " ")}</Tag>
                      </Td>
                      <Td>
                        {a.bundle_groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {a.bundle_groups.map((g) => (
                              <Tag key={g}>{g}</Tag>
                            ))}
                          </div>
                        ) : (
                          <Mono className="text-[0.65rem] text-faint">à la carte</Mono>
                        )}
                      </Td>
                      <Td>
                        <Mono>{a.default_seats}</Mono>
                      </Td>
                      <Td>
                        <Mono>{s.licenses}</Mono>
                      </Td>
                      <Td>
                        <Mono>{s.active}</Mono>
                      </Td>
                      <Td>
                        <Mono>{s.seats}</Mono>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <p className="text-xs leading-relaxed text-muted">
          Runtime enforcement of products and seats is consumed by the apps via signed
          entitlements — the entitlements layer in Estinad Core (INT-369) is the dependency
          for that. Control manages the commercial state only.
        </p>
      </PageBody>
    </>
  );
}

async function adoptionStats(catalog: CatalogApp[]): Promise<Record<string, AppStats>> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("tenant_licenses")
    .select("products, seats, status");
  if (error || !data) return {};

  const stats: Record<string, AppStats> = {};
  for (const app of catalog) stats[app.id] = { licenses: 0, active: 0, seats: 0 };

  for (const row of data as { products: string[] | null; seats: unknown; status: string }[]) {
    for (const productId of row.products ?? []) {
      if (!stats[productId]) continue;
      stats[productId].licenses += 1;
      if (row.status === "active") {
        stats[productId].active += 1;
        const seats = row.seats;
        if (seats && typeof seats === "object" && typeof (seats as Record<string, unknown>)[productId] === "number") {
          stats[productId].seats += (seats as Record<string, number>)[productId] ?? 0;
        }
      }
    }
  }
  return stats;
}
