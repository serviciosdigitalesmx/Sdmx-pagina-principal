export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { optionalEnv } from "@white-label/config";
import { getPublicApiPath } from "@/lib/public-api";

export default async function AuthGooglePage() {
  const explicitPublicUrl =
    optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ??
    optionalEnv("NEXT_PUBLIC_APP_URL") ??
    "https://app.serviciosdigitalesmx.online";
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const publicUrl = explicitPublicUrl ?? (host ? `${proto}://${host}` : null);

  if (!publicUrl) {
    throw new Error("Missing public URL context for auth/google");
  }

  const url = new URL(getPublicApiPath("/api/auth/google"), publicUrl);
  url.searchParams.set("origin", publicUrl);

  redirect(url.toString());
}
