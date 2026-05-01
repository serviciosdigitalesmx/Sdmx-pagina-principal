import type { Session as AppSession } from "@/lib/session";
import { getSupabaseClient } from "@/lib/supabase";

type UserRow = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
};

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  billing_exempt: boolean;
};

type SubscriptionRow = {
  tenant_id: string;
  plan: "basic" | "pro" | "enterprise";
  status: "pending" | "active" | "past_due" | "canceled" | "trialing";
  provider: string;
  external_id: string;
  current_period_end: string | null;
  raw_payload: Record<string, unknown>;
};

export async function hydrateSessionFromSupabase(): Promise<AppSession> {
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Usuario no autenticado");

  const [{ data: users, error: userError }, { data: shops, error: shopError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
    supabase.from("users").select("id,auth_user_id,tenant_id,full_name,email").eq("auth_user_id", authData.user.id).limit(1),
    supabase.from("shops").select("id,name,slug,billing_exempt").eq("id", authData.user.user_metadata?.tenant_id || authData.user.app_metadata?.tenant_id || "").limit(1),
    supabase.from("subscriptions").select("tenant_id,plan,status,provider,external_id,current_period_end,raw_payload").eq("tenant_id", authData.user.user_metadata?.tenant_id || authData.user.app_metadata?.tenant_id || "").order("created_at", { ascending: false }).limit(1)
  ]);

  if (userError) throw userError;
  if (shopError) throw shopError;
  if (subscriptionError) throw subscriptionError;

  const user = users?.[0] as UserRow | undefined;
  const shop = shops?.[0] as ShopRow | undefined;
  const subscription = subscriptions?.[0] as SubscriptionRow | undefined;
  if (!user || !shop) throw new Error("No se pudo hidratar la sesión del tenant");

  return {
    accessToken: (await supabase.auth.getSession()).data.session?.access_token || "",
    refreshToken: (await supabase.auth.getSession()).data.session?.refresh_token || "",
    expiresAt: (await supabase.auth.getSession()).data.session?.expires_at
      ? new Date((await supabase.auth.getSession()).data.session!.expires_at! * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
    user: {
      id: user.id,
      auth_user_id: user.auth_user_id,
      tenant_id: user.tenant_id,
      full_name: user.full_name,
      email: user.email,
      branch_id: null,
      created_at: "",
      updated_at: ""
    } as AppSession["user"],
    shop,
    subscription: subscription
      ? {
          tenant_id: subscription.tenant_id,
          plan: subscription.plan,
          status: subscription.status,
          provider: subscription.provider as any,
          external_id: subscription.external_id,
          current_period_end: subscription.current_period_end,
          raw_payload: subscription.raw_payload
        }
      : null,
    roles: [],
    permissions: []
  };
}
