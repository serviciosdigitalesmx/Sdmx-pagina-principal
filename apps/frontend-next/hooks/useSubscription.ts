"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

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
        const res = await apiClient.get<{ subscription?: Subscription | null }>("/api/subscription/status");
        if (!mounted) return;
        setSubscription(res.success ? (res.data?.subscription ?? null) : null);
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
