import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getToken() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No session");
  return token;
}

async function request(url, options = {}) {
  if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  const token = await getToken();
  const res = await fetch(`${apiBaseUrl}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) window.location.href = "/login";
    if (res.status === 402) window.location.href = "/pricing";
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export async function apiFetch(url, options = {}) {
  return request(url, options);
}

export async function apiUpload(url, formData) {
  if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  const token = await getToken();
  const res = await fetch(`${apiBaseUrl}${url}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) window.location.href = "/login";
    if (res.status === 402) window.location.href = "/pricing";
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export async function apiDownload(url, filename) {
  if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  const token = await getToken();
  const res = await fetch(`${apiBaseUrl}${url}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) window.location.href = "/login";
    if (res.status === 402) window.location.href = "/pricing";
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function DashboardHeader({ title, subtitle }) {
  return (
    <div className="section">
      <Link href="/dashboard" className="muted">← Volver al dashboard</Link>
      <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>{title}</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
