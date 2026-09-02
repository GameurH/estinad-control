import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type CatalogKind = "core_app" | "companion" | "module" | "vertical" | "web_app";

export interface CatalogApp {
  id: string;
  name: string;
  kind: CatalogKind;
  default_seats: number;
  /** Business-type groups whose default bundle includes this app (restaurant, retail, clinic…). */
  bundle_groups: string[];
  sort_order: number;
  is_active: boolean;
}

/** Fallback used when the catalog table is unreachable/empty — keeps forms usable. */
export const FALLBACK_CATALOG: CatalogApp[] = [
  { id: "pos", name: "SaharaOS POS (retail till)", kind: "core_app", default_seats: 1, bundle_groups: ["retail", "restaurant"], sort_order: 1, is_active: true },
  { id: "kds", name: "Kitchen Display (KDS)", kind: "companion", default_seats: 1, bundle_groups: ["restaurant"], sort_order: 2, is_active: true },
  { id: "waiter", name: "Waiter app", kind: "companion", default_seats: 2, bundle_groups: ["restaurant"], sort_order: 3, is_active: true },
  { id: "store", name: "Online storefront", kind: "web_app", default_seats: 1, bundle_groups: ["retail"], sort_order: 4, is_active: true },
  { id: "invoices", name: "Invoicing (factures / devis / avoirs)", kind: "module", default_seats: 1, bundle_groups: [], sort_order: 5, is_active: true },
  { id: "clinic", name: "Clinic", kind: "vertical", default_seats: 1, bundle_groups: ["clinic"], sort_order: 6, is_active: true },
  { id: "showcase", name: "Brand showcase storefront", kind: "web_app", default_seats: 1, bundle_groups: ["showcase"], sort_order: 7, is_active: true },
];

/** Read the commercial app registry (server-side, service-role). */
export async function getCatalog(): Promise<CatalogApp[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("product_catalog")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error || !data || data.length === 0) return FALLBACK_CATALOG;
    return data as CatalogApp[];
  } catch {
    return FALLBACK_CATALOG;
  }
}

/** Business-type → default product bundle, derived from the catalog. */
export function bundleForBusinessType(
  catalog: CatalogApp[],
  businessType: string | null | undefined,
): string[] {
  if (!businessType) return ["pos"];
  const ids = catalog
    .filter((a) => a.bundle_groups.includes(businessType))
    .map((a) => a.id);
  return ids.length > 0 ? ids : ["pos"];
}
