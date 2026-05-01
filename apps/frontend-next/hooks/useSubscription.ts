"use client";

import { useEffect, useState } from "react";
import { fetchAuthedSessionApi } from "@/lib/sessionApi";

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
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetchAuthedSessionApi<{
          accessGranted: boolean;
          subscription: Subscription | null;
        }>("subscription/status");

        if (!mounted) return;
        setAccessGranted(Boolean(response.accessGranted));
        setSubscription(response.subscription ?? null);
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

  return { subscription, accessGranted, loading };
}
