import { optionalEnv, fetchJson } from "@white-label/config";
import { StorefrontClient } from "@/components/storefront-client";

type CatalogItem = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  brand: string | null;
  sale_price: number;
  cost: number;
  minimum_stock: number;
  unit: string | null;
  location: string | null;
  notes: string | null;
  is_active: boolean;
  stock_current: number;
  in_stock: boolean;
  inventory_state: "agotado" | "bajo" | "disponible";
};

type StoreCatalogResponse = {
  success: true;
  tenant: {
    slug: string;
    name: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    } | null;
  };
  data: {
    catalog: CatalogItem[];
  };
};

const defaultTenantSlug = optionalEnv("NEXT_PUBLIC_STORE_TENANT_SLUG") ?? "";
const brandName = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_NAME") ?? "Tienda";
const brandShort = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_SHORT") ?? "ST";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tenant?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const tenantSlug = params.tenant?.trim() || defaultTenantSlug;
  let initialCatalog: CatalogItem[] = [];

  if (tenantSlug) {
    try {
      const payload = await fetchJson<StoreCatalogResponse>(`/api/public/store/${encodeURIComponent(tenantSlug)}/catalog`);
      initialCatalog = payload.data.catalog;
    } catch {
      initialCatalog = [];
    }
  }

  return (
    <StorefrontClient
      brandName={brandName}
      brandShort={brandShort}
      defaultTenantSlug={defaultTenantSlug}
      initialTenantSlug={tenantSlug}
      initialCatalog={initialCatalog}
    />
  );
}
