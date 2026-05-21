type JsonRecord = Record<string, unknown>;

type ApiListResponse<T> = {
  success: true;
  data: T;
};

type ApiSingleResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  error?: string;
  details?: unknown;
};

import { readAuthToken } from "@/lib/auth-storage";

class FixService {
  private get apiUrl() {
    return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  }

  private get tenantId() {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      // Extract subdomain as tenant if not on localhost
      if (host.includes('.') && !host.includes('localhost') && !host.includes('vercel.app')) {
        return host.split('.')[0];
      }
    }
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant-local';
  }

  private getToken(): string {
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_DEFAULT_API_TOKEN || '';
    }
    return readAuthToken() || process.env.NEXT_PUBLIC_DEFAULT_API_TOKEN || '';
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    if (!token) {
      throw new Error('No hay sesión activa. Vuelve a iniciar sesión.');
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({} as ApiErrorResponse));
      const message =
        typeof payload.error === 'string' && payload.error.trim().length > 0
          ? payload.error
          : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  public async getCustomers(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/customers`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getInventory(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/inventory`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async createCustomer(data: JsonRecord): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/customers`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async createOrder(data: JsonRecord): Promise<JsonRecord> {
    const result = await this.request<ApiListResponse<JsonRecord>>(
      `/api/${this.tenantId}/orders`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async getOrders(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/orders`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getBalance(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/finance/balance`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getCashflow(sucursalId: string): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/finance/cashflow/${encodeURIComponent(sucursalId)}`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getProcurementSummary(): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/procurement/summary`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getReportsSummary(): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/reports/summary`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getSuppliers(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/suppliers`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getSecuritySummary(): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/security/summary`,
      { method: 'GET' }
    );
    return result.data;
  }
}

export const fixService = new FixService();
