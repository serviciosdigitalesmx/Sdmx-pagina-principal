import { redirect } from "next/navigation";
import { optionalEnv } from "@white-label/config";
import { getPublicApiPath } from "@/lib/public-api";

export default function AuthGooglePage() {
  const publicUrl = optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ?? "https://serviciosdigitalesmx.online";

  const url = new URL(getPublicApiPath("/api/auth/google"), publicUrl);
  url.searchParams.set("origin", publicUrl);

  redirect(url.toString());
}
