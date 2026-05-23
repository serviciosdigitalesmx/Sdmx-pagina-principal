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

type EncodedFilePayload = {
  fileName: string;
  mimeType: string;
  base64: string;
  fileType: 'intake_photo' | 'attachment_pdf';
};

import { readAuthToken } from "@/lib/auth-storage";
import { getCurrentSession } from "@/lib/session";

class FixService {
  private get apiUrl() {
    return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  }

  private get tenantId() {
    const session = getCurrentSession();
    if (session?.tenantSlug) {
      return session.tenantSlug;
    }
    throw new Error("Sesión inválida: tenant_slug ausente");
  }

  private getToken(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    return readAuthToken() || '';
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

  public async getOrderById(id: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/orders/${encodeURIComponent(id)}`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async uploadOrderAttachment(orderId: string, file: File, fileType: 'intake_photo' | 'attachment_pdf'): Promise<JsonRecord> {
    const base64 = await this.fileToBase64(file);
    const result = await this.request<ApiListResponse<JsonRecord>>(
      `/api/${this.tenantId}/orders/${encodeURIComponent(orderId)}/attachments`,
      {
        method: 'POST',
        body: JSON.stringify({
          files: [
            {
              fileName: file.name,
              mimeType: file.type || (fileType === 'attachment_pdf' ? 'application/pdf' : 'image/*'),
              base64,
              fileType,
            } satisfies EncodedFilePayload,
          ],
        }),
      }
    );
    return result.data;
  }

  public async addOrderNote(orderId: string, note: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/orders/${encodeURIComponent(orderId)}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({ note }),
      }
    );
    return result.data;
  }

  public async updateOrderStatus(orderId: string, status: string, note?: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
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

  private async fileToBase64(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = typeof reader.result === 'string' ? reader.result : '';
        resolve(value);
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
}

export const fixService = new FixService();
