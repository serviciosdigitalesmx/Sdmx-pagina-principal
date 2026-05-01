"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export type PlanCode = "basic" | "pro" | "enterprise";
export type SubscriptionStatus = "pending" | "trialing" | "active" | "past_due" | "suspended" | "canceled";

export type Subscription = {
  plan: PlanCode;
  status: SubscriptionStatus;
  current_period_end?: string | null;
  provider?: 'mercadopago' | 'trial';
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const tenantId = sessionData.session?.user.user_metadata?.tenant_id || sessionData.session?.user.app_metadata?.tenant_id || "";
        if (!tenantId) {
          if (mounted) setSubscription(null);
          return;
        }

        const { data, error } = await supabase
          .from("subscriptions")
          .select("plan,status,current_period_end,provider")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;
        setSubscription((data as Subscription | null) ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    const timeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, []);

  return { subscription, loading };
}
