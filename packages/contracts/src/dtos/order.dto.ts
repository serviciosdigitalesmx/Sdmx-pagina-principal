export interface OrderDTO {
  id: string;
  folio: string;
  tenant_id: string;
  customer_id?: string;
  device_info: {
    type: string;
    model: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
  };
  issue: string;
  estimated_cost?: number;
  promised_date?: string;
  status: string;
  assigned_user_id?: string;
  internal_notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
