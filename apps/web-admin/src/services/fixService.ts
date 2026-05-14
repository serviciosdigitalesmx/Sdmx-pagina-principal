type JsonRecord = Record<string, unknown>;

type ApiListResponse<T> = {
  success: true;
  data: T;
};

class FixService {
  private tokenKey = 'srfix_auth_token';

  private get apiUrl() {
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  }

  private get tenantId() {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant-local';
  }

  private getToken(): string {
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_DEFAULT_API_TOKEN || '';
    }
    return window.sessionStorage.getItem(this.tokenKey) || process.env.NEXT_PUBLIC_DEFAULT_API_TOKEN || '';
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({} as JsonRecord));
      throw new Error((payload.error as string) || `HTTP ${response.status}`);
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
}

export const fixService = new FixService();
