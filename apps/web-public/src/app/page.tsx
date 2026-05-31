import { PublicPortalLookup } from "@/components/public-portal-lookup";

export default function Home() {
  return (
    <PublicPortalLookup
      title="Rastreo de servicio"
      subtitle="Ingresa el nombre del taller y el folio de tu orden para consultar el estado."
      showTenantInput={true}
    />
  );
}
