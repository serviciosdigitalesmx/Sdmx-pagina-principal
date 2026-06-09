import { PortalView } from "@/lib/portal/portal-view";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ folio?: string; token?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params;

  return {
    title: `Portal del cliente | ${tenantSlug}`,
    description: "Consulta el estado de tu reparación con folio o token.",
    alternates: {
      canonical: `/t/${tenantSlug}/portal`,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function PortalPage({ params, searchParams }: PageProps) {
  const [{ tenantSlug }, query] = await Promise.all([params, searchParams]);
  const initialFolio = query.folio?.trim() || query.token?.trim() || "";

  return <PortalView tenantSlug={tenantSlug} initialFolio={initialFolio} />;
}
