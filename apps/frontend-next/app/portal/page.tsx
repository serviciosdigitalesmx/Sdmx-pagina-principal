import { Suspense } from "react";
import { PortalClient } from "@/components/native/PortalClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black">
          Cargando portal...
        </div>
      }
    >
      <PortalClient />
    </Suspense>
  );
}
