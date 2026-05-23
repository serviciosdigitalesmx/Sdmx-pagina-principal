import { Suspense } from "react";
import { RedirectToAdmin } from "./redirect-to-admin";

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white px-6 py-12 text-slate-950">Preparando tu panel...</div>}>
      <RedirectToAdmin />
    </Suspense>
  );
}
