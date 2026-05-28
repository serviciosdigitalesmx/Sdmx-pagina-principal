export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  brandName: string;
  sucursalName: string;
  userEmail: string;
  userSucursalId: string;
  userRole: string;
}

export interface TenantIndustryProfile {
  tenant_id: string;
  industry_key: string;
  industry_label: string | null;
  asset_label: string;
  order_label: string;
  request_label: string;
  customer_label: string;
  portal_label: string;
  quote_label: string;
  default_workflow_key: string;
  is_active: boolean;
  metadata: JsonObject;
}

export interface TenantEnabledModule {
  id: string;
  tenant_id: string;
  module_key: string;
  module_label: string | null;
  enabled: boolean;
  sort_order: number;
  metadata: JsonObject;
}

export interface TenantLabelOverride {
  id: string;
  tenant_id: string;
  label_key: string;
  label_value: string;
  context: JsonObject;
}

export interface TenantWorkflowStatus {
  id: string;
  tenant_id: string;
  workflow_key: string;
  status_key: string;
  label: string;
  tone: string | null;
  sort_order: number;
  is_default: boolean;
  is_terminal: boolean;
  metadata: JsonObject;
}

export interface TenantFieldDefinition {
  id: string;
  tenant_id: string;
  entity: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date' | 'money';
  required: boolean;
  options: JsonValue[];
  field_order: number;
  placeholder: string | null;
  help_text: string | null;
  visible: boolean;
  validation: JsonObject;
  metadata: JsonObject;
}

export interface TenantSemaphoreRule {
  id?: string;
  tenant_id?: string;
  industry_key?: string | null;
  workflow_key?: string | null;
  status_key: string;
  metric:
    | 'minutes_since_created'
    | 'minutes_since_status_changed'
    | 'minutes_until_scheduled_at'
    | 'minutes_after_scheduled_at'
    | 'minutes_until_due_at'
    | 'minutes_after_due_at'
    | 'minutes_until_promised_at'
    | 'minutes_after_promised_at';
  green_until_minutes?: number | null;
  yellow_until_minutes?: number | null;
  red_after_minutes?: number | null;
  priority?: number | null;
  reason_template?: string | null;
  suggested_action_template?: string | null;
  action_key?: string | null;
  enabled?: boolean;
  metadata?: JsonObject;
  created_at?: string;
  updated_at?: string;
}

export interface TenantWhatsAppTemplate {
  event_key: string;
  label: string;
  template: string;
  enabled: boolean;
  variables: string[];
  fallback_template: string;
}

export interface TenantRuntimeTemplates {
  whatsapp: TenantWhatsAppTemplate[];
  landing: JsonObject;
  portal: JsonObject;
  document: JsonObject;
}

export interface TenantModuleRegistryItem {
  key: string;
  label: string;
  description: string;
  category: string;
  frontend_routes: string[];
  backend_permissions: string[];
  default_enabled_by_industry: string[];
  required_plan: 'basic' | 'pro' | 'scale' | null;
  aliases: string[];
}

export interface TenantPlanLimits {
  users: number | null;
  sucursales: number | null;
  monthly_orders: number | null;
  storage_mb: number | null;
  public_portal: boolean;
  whatsapp_templates: number | null;
  document_templates: number | null;
}

export interface TenantCapabilities {
  plan_key: 'basic' | 'pro' | 'scale';
  access_status: 'active' | 'trial' | 'billing_exempt' | 'master' | 'blocked';
  active_modules: string[];
  locked_modules: string[];
  limits: TenantPlanLimits;
  reasons: string[];
}

export interface TenantRuntimeConfig {
  industryProfile: TenantIndustryProfile | null;
  enabledModules: TenantEnabledModule[];
  labelOverrides: TenantLabelOverride[];
  workflowStatuses: TenantWorkflowStatus[];
  fieldDefinitions: TenantFieldDefinition[];
  semaphoreRules: TenantSemaphoreRule[];
  templates: TenantRuntimeTemplates;
  labels: Record<string, string>;
  statusOptions: Record<string, Array<{ key: string; label: string; tone?: string | null; isDefault?: boolean; isTerminal?: boolean }>>;
  statusLabels: Record<string, string>;
  activeModules: string[];
  capabilities: TenantCapabilities | null;
}
