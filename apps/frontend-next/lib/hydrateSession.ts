import type { Session as AppSession } from "@/lib/session";
import { fetchAuthedSessionApi } from "@/lib/sessionApi";

export async function hydrateSessionFromSupabase(): Promise<AppSession> {
  const session = await fetchAuthedSessionApi<AppSession>("auth/me");
  if (!session?.user || !session?.shop) {
    throw new Error("No se pudo hidratar la sesión del tenant");
  }

  return session;
}
