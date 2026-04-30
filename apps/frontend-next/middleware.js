import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard"];

export function middleware(req) {
  const shouldProtect = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));
  if (!shouldProtect) return NextResponse.next();

  const hasSupabaseSession = req.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSupabaseSession) {
    const url = new URL("/", req.url);
    url.searchParams.set("reason", "auth_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
