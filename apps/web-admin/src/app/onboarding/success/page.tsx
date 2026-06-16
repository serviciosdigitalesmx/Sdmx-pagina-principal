import { Suspense } from "react";
import { OnboardingSuccessRedirect } from "./redirect-to-dashboard";

export default function OnboardingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] px-6 text-slate-950">
          Preparando el panel...
        </div>
      }
    >
      <OnboardingSuccessRedirect />
    </Suspense>
  );
}
