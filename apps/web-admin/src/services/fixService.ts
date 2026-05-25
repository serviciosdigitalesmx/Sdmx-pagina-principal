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

type LandingServicePayload = {
  title: string;
  description: string;
};

type SocialLinkPayload = {
  label: string;
  href: string;
};

type ServiceRequestPayload = {
  id?: string;
  tenant_id?: string;
  folio?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  device_type?: string | null;
  device_model?: string | null;
  issue_description?: string | null;
  status?: string;
  quoted_total?: number;
  deposit_amount?: number;
  balance_amount?: number;
  solicitud_origen_ip?: string | null;
  created_at?: string;
  updated_at?: string;
  normalized_status?: string;
};

type TenantLandingSettings = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    branding?: Record<string, unknown> | null;
    landing_content?: Record<string, unknown> | null;
    updated_at?: string;
  };
};

type PurchaseOrderItemPayload = {
  productId?: string;
  skuSnapshot?: string;
  productNameSnapshot?: string;
  quantity: number;
  unitCost: number;
};

type PurchaseOrderPayload = {
  supplierId: string;
  branchId?: string;
  expectedDate?: string;
  notes?: string;
  paymentTerms?: string;
  reference?: string;
  items: PurchaseOrderItemPayload[];
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

  private getBranchId() {
    if (typeof window === 'undefined') {
      return '';
    }
    return new URLSearchParams(window.location.search).get('branchId')?.trim() || '';
  }

  private withBranchQuery(path: string) {
    const branchId = this.getBranchId();
    if (!branchId) {
      return path;
    }
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}branchId=${encodeURIComponent(branchId)}`;
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
      this.withBranchQuery(`/api/${this.tenantId}/customers`),
      { method: 'GET' }
    );
    return result.data;
  }

  public async getInventory(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      this.withBranchQuery(`/api/${this.tenantId}/inventory`),
      { method: 'GET' }
    );
    return result.data;
  }

  public async createInventoryItem(data: { sku: string; description: string; stock: number; branchId?: string }): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/inventory`),
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async updateInventoryItem(id: string, data: { description?: string; stock?: number; branchId?: string | null; note?: string }): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/inventory/${encodeURIComponent(id)}`),
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async getInventoryMovements(id: string): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      this.withBranchQuery(`/api/${this.tenantId}/inventory/${encodeURIComponent(id)}/movements`),
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
      this.withBranchQuery(`/api/${this.tenantId}/orders/${encodeURIComponent(id)}`),
      { method: 'GET' }
    );
    return result.data;
  }

  public async uploadOrderAttachment(orderId: string, file: File, fileType: 'intake_photo' | 'attachment_pdf'): Promise<JsonRecord> {
    const base64 = await this.fileToBase64(file);
    const result = await this.request<ApiListResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/orders/${encodeURIComponent(orderId)}/attachments`),
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
      this.withBranchQuery(`/api/${this.tenantId}/orders/${encodeURIComponent(orderId)}/notes`),
      {
        method: 'POST',
        body: JSON.stringify({ note }),
      }
    );
    return result.data;
  }

  public async updateOrderStatus(orderId: string, status: string, note?: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/orders/${encodeURIComponent(orderId)}/status`),
      {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }
    );
    return result.data;
  }

  public async getOrders(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      this.withBranchQuery(`/api/${this.tenantId}/orders`),
      { method: 'GET' }
    );
    return result.data;
  }

  public async getBalance(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      this.withBranchQuery(`/api/${this.tenantId}/finance/balance`),
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

  public async getBranches(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      `/api/${this.tenantId}/branches`,
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

  public async getSupplierById(id: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/suppliers/${encodeURIComponent(id)}`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async createSupplier(data: JsonRecord): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/suppliers`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async updateSupplier(id: string, data: JsonRecord): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/suppliers/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async deleteSupplier(id: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      `/api/${this.tenantId}/suppliers/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    return result.data;
  }

  public async getPurchaseOrders(): Promise<JsonRecord[]> {
    const result = await this.request<ApiListResponse<JsonRecord[]>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders`),
      { method: 'GET' }
    );
    return result.data;
  }

  public async getPurchaseOrderById(id: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders/${encodeURIComponent(id)}`),
      { method: 'GET' }
    );
    return result.data;
  }

  public async createPurchaseOrder(data: PurchaseOrderPayload): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders`),
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async updatePurchaseOrder(id: string, data: JsonRecord): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders/${encodeURIComponent(id)}`),
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  public async updatePurchaseOrderStatus(id: string, status: string, note?: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders/${encodeURIComponent(id)}/status`),
      {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }
    );
    return result.data;
  }

  public async receivePurchaseOrder(id: string, payload?: { notes?: string; receivedItems?: Array<{ skuSnapshot?: string; quantity: number }> }): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders/${encodeURIComponent(id)}/receive`),
      {
        method: 'POST',
        body: JSON.stringify(payload ?? {}),
      }
    );
    return result.data;
  }

  public async deletePurchaseOrder(id: string): Promise<JsonRecord> {
    const result = await this.request<ApiSingleResponse<JsonRecord>>(
      this.withBranchQuery(`/api/${this.tenantId}/purchase-orders/${encodeURIComponent(id)}`),
      { method: 'DELETE' }
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

  public async getServiceRequests(): Promise<ServiceRequestPayload[]> {
    const result = await this.request<ApiListResponse<ServiceRequestPayload[]>>(
      `/api/${this.tenantId}/requests`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async getServiceRequestById(id: string): Promise<ServiceRequestPayload> {
    const result = await this.request<ApiSingleResponse<ServiceRequestPayload>>(
      `/api/${this.tenantId}/requests/${encodeURIComponent(id)}`,
      { method: 'GET' }
    );
    return result.data;
  }

  public async convertServiceRequestToOrder(id: string, payload: {
    estimatedCost: number;
    deviceType?: string;
    deviceModel?: string;
    issue?: string;
    createCustomer?: boolean;
  }): Promise<ApiSingleResponse<{ request: ServiceRequestPayload; order: JsonRecord }>> {
    return this.request<ApiSingleResponse<{ request: ServiceRequestPayload; order: JsonRecord }>>(
      `/api/${this.tenantId}/requests/${encodeURIComponent(id)}/convert`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  public async getTenantLandingSettings(): Promise<ApiSingleResponse<TenantLandingSettings>> {
    return this.request<ApiSingleResponse<TenantLandingSettings>>(`/api/auth/tenant/${encodeURIComponent(this.tenantId)}/settings`, {
      method: 'GET',
    });
  }

  public async updateTenantLandingSettings(payload: {
    branding?: Record<string, unknown>;
    landingContent?: {
      heroTitle: string;
      heroSubtitle: string;
      heroDescription: string;
      primaryCtaLabel: string;
      primaryCtaHref: string;
      secondaryCtaLabel: string;
      secondaryCtaHref: string;
      contactLabel: string;
      contactHref: string;
      seoTitle: string;
      seoDescription: string;
      services: LandingServicePayload[];
      socialLinks: SocialLinkPayload[];
      showMap: boolean;
      mapEmbedUrl: string;
      showVideo: boolean;
      videoUrl: string;
    };
  }): Promise<ApiSingleResponse<TenantLandingSettings>> {
    return this.request<ApiSingleResponse<TenantLandingSettings>>(`/api/auth/tenant/${encodeURIComponent(this.tenantId)}/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
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
