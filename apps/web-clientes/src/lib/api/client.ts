const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function resolveApiBaseUrl() {
  if (!DEFAULT_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return DEFAULT_API_BASE_URL.replace(/\/$/, "");
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}
