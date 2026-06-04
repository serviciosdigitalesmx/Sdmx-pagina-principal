import { readAuthToken } from '@/lib/auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
  tenantSlug?: string;
  sucursalId?: string | null;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    apiOptions: ApiOptions = {}
  ): Promise<T> {
    const { tenantSlug, sucursalId } = apiOptions;
    if (!API_URL) {
      throw new Error('NEXT_PUBLIC_API_URL no configurada');
    }
    let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    // Inject tenantSlug in path if needed
    if (tenantSlug && !url.includes('/:tenantSlug')) {
      url = url.replace('/api/', `/api/${tenantSlug}/`);
    }

    // Add sucursalId as query param if provided
    if (sucursalId) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}sucursalId=${sucursalId}`;
    }

    const headers = new Headers(options.headers ?? {});

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.token || readAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    return data as T;
  }

  // GET
  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, options);
  }

  // POST
  async post<T>(endpoint: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      options
    );
  }

  // PUT
  async put<T>(endpoint: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      options
    );
  }

  // PATCH
  async patch<T>(endpoint: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      options
    );
  }

  // DELETE
  async delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, options);
  }

  // File upload (multipart)
  async upload<T>(
    endpoint: string,
    file: File,
    metadata?: Record<string, unknown>,
    options?: ApiOptions
  ): Promise<T> {
    let url = endpoint;
    if (options?.tenantSlug) {
      url = url.replace('/api/', `/api/${options.tenantSlug}/`);
    }

    if (options?.sucursalId) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}sucursalId=${options.sucursalId}`;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  }
}

export const apiClient = new ApiClient();
