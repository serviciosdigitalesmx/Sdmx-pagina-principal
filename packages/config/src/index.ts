const fail = (name: string): never => {
  throw new Error(`Missing required environment variable: ${name}`);
};

const apiBaseUrlCandidates = [
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_RENDER_API_URL",
] as const;

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Empty API base URL");
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return url.toString().replace(/\/$/, "");
}

function resolveFirstConfiguredEnv(names: readonly string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}

export function requireEnv(name: string): string {
  switch (name) {
    case "NEXT_PUBLIC_API_BASE_URL":
      return resolveApiBaseUrl();

    case "NEXT_PUBLIC_API_URL":
      return resolveApiBaseUrl();

    case "NEXT_PUBLIC_RENDER_API_URL":
      return process.env.NEXT_PUBLIC_RENDER_API_URL?.trim() || fail(name);

    default: {
      const value = process.env[name]?.trim();
      if (!value) return fail(name);
      return value;
    }
  }
}

export function optionalEnv(name: string): string | null {
  switch (name) {
    case "NEXT_PUBLIC_API_BASE_URL":
      return resolveFirstConfiguredEnv(apiBaseUrlCandidates);

    case "NEXT_PUBLIC_API_URL":
      return resolveFirstConfiguredEnv(apiBaseUrlCandidates);

    case "NEXT_PUBLIC_RENDER_API_URL":
      return process.env.NEXT_PUBLIC_RENDER_API_URL?.trim() || null;

    default:
      return process.env[name]?.trim() || null;
  }
}

export function resolveApiBaseUrl(): string {
  const value = resolveFirstConfiguredEnv(apiBaseUrlCandidates);

  if (!value) {
    return fail("NEXT_PUBLIC_API_URL");
  }

  try {
    return normalizeBaseUrl(value);
  } catch {
    const fallback = value.trim();
    if (fallback && !/^https?:\/\//i.test(fallback)) {
      try {
        return normalizeBaseUrl(`https://${fallback}`);
      } catch {
        // fall through to the explicit error below
      }
    }

    throw new Error("Invalid API base URL in environment. Use a full https:// URL or a bare domain.");
  }
}

export function resolveBaseDomain(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_DOMAIN?.trim(),
    process.env.BASE_DOMAIN?.trim(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const normalized = candidate.replace(/^https?:\/\//, "").replace(/^app\./, "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function resolveSharedCookieDomain(hostname?: string): string | undefined {
  const baseDomain = resolveBaseDomain();

  if (baseDomain) {
    return `.${baseDomain}`;
  }

  const host = hostname?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return undefined;
  }

  if (host.endsWith('.vercel.app')) {
    return undefined;
  }

  const parts = host.split('.').filter(Boolean);
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}`;
  }

  return undefined;
}

export type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
  status?: number;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof Error && (value as ApiError).name === "ApiError";
}

export async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | T | null;

  if (!response.ok) {
    const errorPayload = payload && typeof payload === "object" ? (payload as ApiErrorPayload) : null;
    const message =
      errorPayload?.message && typeof errorPayload.message === "string"
        ? errorPayload.message
        : errorPayload?.error && typeof errorPayload.error === "string"
          ? errorPayload.error
          : `HTTP ${response.status}`;

    throw new ApiError(message, response.status, errorPayload?.details);
  }

  return payload as T;
}
