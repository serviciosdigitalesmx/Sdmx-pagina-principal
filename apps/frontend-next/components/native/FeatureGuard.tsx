"use client";

import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

type PlanCode = "basic" | "pro" | "enterprise";
const PLAN_ORDER: Record<PlanCode, number> = { basic: 1, pro: 2, enterprise: 3 };
const skipBilling = process.env.NEXT_PUBLIC_E2E_BILLING_BYPASS === "1";

export function FeatureGuard({
  children,
  requiredPlan = "basic",
  featureName = "este módulo"
}: {
  children: React.ReactNode;
  requiredPlan?: PlanCode;
  featureName?: string;
}) {
  const { subscription, loading } = useSubscription();
  const hasSubscriptionAccess =
    Boolean(subscription) &&
    (
      subscription?.status === "active" ||
      (subscription?.status === "trialing" && (
        !subscription.current_period_end ||
        new Date(subscription.current_period_end).getTime() >= Date.now()
      ))
    );
  const currentPlanLevel = subscription ? PLAN_ORDER[subscription.plan] : 0;
  const allowed =
    skipBilling ||
    (hasSubscriptionAccess && currentPlanLevel >= PLAN_ORDER[requiredPlan]);

  if (loading) {
    return (
      <div className="srf-card p-8 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#1F7EDC]/20 border-t-[#1F7EDC] animate-spin" />
        <p className="mt-4 text-slate-400 font-bold">Validando suscripción...</p>
      </div>
    );
  }

  if (!allowed) {
    const currentPlan = subscription?.plan || "sin plan";
    return (
      <div className="srf-card p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FF6A2A]/15 border border-[#FF6A2A]/30 flex items-center justify-center text-[#FF6A2A] text-2xl font-black">
          $
        </div>

        <h2 className="mt-5 text-2xl font-black text-white">Suscripción requerida</h2>
        <p className="mt-2 text-slate-400">
          Para usar {featureName}, necesitas una suscripción válida. Plan actual:{" "}
          <span className="text-[#FF6A2A] font-bold">{subscription?.status || "sin suscripción"}</span>.
          {" "}
          Nivel actual: <span className="text-[#FF6A2A] font-bold">{currentPlan}</span>.
        </p>

        <Link href="/billing" className="mt-6 inline-flex srf-btn-primary px-6 py-3">
          Ver paquetes
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default FeatureGuard;
