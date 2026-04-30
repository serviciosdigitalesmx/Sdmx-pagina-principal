import { supabase } from "./supabaseClient.js";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("No session");
  }

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
    if (res.status === 401) {
      window.location.href = "/login";
    }
    if (res.status === 402) {
      window.location.href = "/pricing";
    }
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
};

export const apiUpload = async (url: string, formData: FormData) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("No session");
  }

  const res = await fetch(`${apiBaseUrl}${url}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      window.location.href = "/login";
    }
    if (res.status === 402) {
      window.location.href = "/pricing";
    }
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
};

export const apiDownload = async (url: string, filename: string) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("No session");
  }

  const res = await fetch(`${apiBaseUrl}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      window.location.href = "/login";
    }
    if (res.status === 402) {
      window.location.href = "/pricing";
    }
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const blob = await res.blob();
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
};
