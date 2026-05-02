import { getSupabaseClient } from "@/lib/supabase";
import type { ApiResponse } from "@sdmx/contracts";

function resolveBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function isPublicEndpoint(endpoint: string) {
  return endpoint.startsWith('/api/public/');
}

function unauthorizedResponse<T>(message = 'No autorizado'): ApiResponse<T> {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
}

async function resolveBearerToken(endpoint: string): Promise<string | null> {
  if (isPublicEndpoint(endpoint)) {
    return null;
  }

  const supabase = getSupabaseClient();
  const maxAttempts = 10;
  const delayMs = 150;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || null;
    if (token) return token;
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  return null;
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = resolveBaseUrl();

  if (!baseUrl) {
    throw new Error('No se pudo resolver la URL base de la API');
  }

  const token = await resolveBearerToken(endpoint);

  if (!isPublicEndpoint(endpoint) && !token) {
    return unauthorizedResponse<T>('This endpoint requires a valid Bearer token');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.warn("Unauthorized request:", endpoint);
    }

    const result = await response.json().catch(() => ({
      success: false,
      error: { code: 'PARSE_ERROR', message: 'Failed to parse response' }
    }));

    return result as ApiResponse<T>;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`API Error [${endpoint}]:`, errorMessage);

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage,
      },
    };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' }),
};
