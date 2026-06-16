import type {
  TenantCapabilities,
  TenantCapabilities as TenantCapabilitiesType,
  TenantRuntimeConfig,
  TenantPlanLimits,
} from '@white-label/types';
import type { TenantBillingSummary } from './tenant-billing';

export type ModuleRegistryEntry = {
  key: string;
  label: string;
  description: string;
  category: string;
  frontend_routes: string[];
  backend_permissions: string[];
  default_enabled_by_industry: string[];
  required_plan: 'basic' | 'pro' | 'scale' | null;
  aliases: string[];
};

export const MODULE_REGISTRY: ModuleRegistryEntry[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Resumen operativo del tenant', category: 'core', frontend_routes: ['/dashboard'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'customers', label: 'Clientes', description: 'Clientes y contactos', category: 'core', frontend_routes: ['/dashboard/clientes'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'requests', label: 'Solicitudes', description: 'Solicitudes públicas y operativas', category: 'operations', frontend_routes: ['/dashboard/solicitudes'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'orders', label: 'Órdenes', description: 'Órdenes, seguimiento y cierre', category: 'operations', frontend_routes: ['/dashboard/ordenes', '/dashboard/archivo'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'appointments', label: 'Citas', description: 'Agenda y visitas', category: 'operations', frontend_routes: ['/dashboard/citas'], backend_permissions: [], default_enabled_by_industry: ['hvac_service'], required_plan: null, aliases: [] },
  { key: 'assets', label: 'Activos', description: 'Elementos atendidos', category: 'operations', frontend_routes: ['/dashboard/activos'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'stock', label: 'Stock', description: 'Productos, existencias y movimientos', category: 'control', frontend_routes: ['/dashboard/stock'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: ['inventory'] },
  { key: 'suppliers', label: 'Proveedores', description: 'Catálogo de proveedores', category: 'control', frontend_routes: ['/dashboard/proveedores'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: [] },
  { key: 'purchase-orders', label: 'Compras', description: 'Órdenes de compra y abastecimiento', category: 'control', frontend_routes: ['/dashboard/compras'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: ['purchases'] },
  { key: 'expenses', label: 'Gastos', description: 'Control de egresos', category: 'control', frontend_routes: ['/dashboard/gastos'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: [] },
  { key: 'finance', label: 'Finanzas', description: 'Flujo de caja y balance', category: 'control', frontend_routes: ['/dashboard/finanzas'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'scale', aliases: [] },
  { key: 'reports', label: 'Reportes', description: 'Indicadores y reportes', category: 'analytics', frontend_routes: ['/dashboard/reportes'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: [] },
  { key: 'documents', label: 'Documentos', description: 'PDFs y comprobantes', category: 'operations', frontend_routes: ['/dashboard/documentos'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'portal', label: 'Seguimiento', description: 'Seguimiento público', category: 'public', frontend_routes: [], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'landing', label: 'Landing', description: 'Página pública del tenant', category: 'public', frontend_routes: [], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Enlaces y plantillas de contacto', category: 'public', frontend_routes: [], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'warranty', label: 'Garantía', description: 'Seguimiento de garantía', category: 'operations', frontend_routes: ['/dashboard/garantia'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'billing', label: 'Billing', description: 'Plan y facturación', category: 'admin', frontend_routes: ['/dashboard/billing'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'settings', label: 'Ajustes', description: 'Configuración del tenant', category: 'admin', frontend_routes: ['/dashboard/landing'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'sucursales', label: 'Sucursales', description: 'Sucursales y contexto operativo', category: 'admin', frontend_routes: ['/dashboard/sucursales'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: [] },
  { key: 'users', label: 'Usuarios', description: 'Usuarios y roles', category: 'admin', frontend_routes: ['/dashboard/seguridad'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: [] },
  { key: 'tasks', label: 'Tareas', description: 'Seguimiento interno', category: 'operations', frontend_routes: ['/dashboard/tareas'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: null, aliases: [] },
  { key: 'security', label: 'Seguridad', description: 'Permisos y auditoría', category: 'admin', frontend_routes: ['/dashboard/seguridad'], backend_permissions: [], default_enabled_by_industry: ['electronics_repair', 'hvac_service'], required_plan: 'pro', aliases: [] },
];

export const PLAN_REGISTRY: Record<TenantCapabilities['plan_key'], { module_allowlist: string[]; limits: TenantPlanLimits }> = {
  basic: {
    module_allowlist: ['dashboard', 'customers', 'requests', 'orders', 'portal', 'landing', 'whatsapp', 'documents'],
    limits: { users: 3, sucursales: 1, monthly_orders: 50, storage_mb: 500, public_portal: true, whatsapp_templates: 5, document_templates: 3 },
  },
  pro: {
    module_allowlist: ['dashboard', 'customers', 'requests', 'orders', 'appointments', 'assets', 'stock', 'suppliers', 'purchase-orders', 'expenses', 'reports', 'documents', 'portal', 'landing', 'whatsapp', 'warranty', 'billing', 'settings', 'sucursales', 'tasks', 'security'],
    limits: { users: 10, sucursales: 5, monthly_orders: 500, storage_mb: 5000, public_portal: true, whatsapp_templates: 50, document_templates: 20 },
  },
  scale: {
    module_allowlist: MODULE_REGISTRY.map((module) => module.key),
    limits: { users: null, sucursales: null, monthly_orders: null, storage_mb: null, public_portal: true, whatsapp_templates: null, document_templates: null },
  },
};

function normalizeKey(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

export function canonicalModuleKey(key: string) {
  const normalized = normalizeKey(key);
  const registry = MODULE_REGISTRY.find((item) => item.key === normalized || item.aliases.includes(normalized));
  return registry?.key ?? normalized;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getIndustryDefaultModules(industryKey?: string | null) {
  const normalized = normalizeKey(industryKey);
  return MODULE_REGISTRY
    .filter((item) => item.default_enabled_by_industry.includes(normalized))
    .map((item) => item.key);
}

function getPlanKeyFromBilling(billing: TenantBillingSummary | null | undefined): TenantCapabilities['plan_key'] {
  if (!billing) return 'basic';
  if (billing.billingExempt) return 'scale';
  if (billing.subscriptionStatus === 'active') return 'pro';
  if (billing.isTrialActive) return 'basic';
  return 'basic';
}

function getAccessStatus(billing: TenantBillingSummary | null | undefined, tenantSlug?: string | null, tenantEmail?: string | null): TenantCapabilities['access_status'] {
  const masterTenantSlug = normalizeKey(process.env.MASTER_TENANT_SLUG);
  const masterAccountEmail = normalizeKey(process.env.MASTER_ACCOUNT_EMAIL);
  if (tenantSlug && masterTenantSlug && normalizeKey(tenantSlug) === masterTenantSlug) return 'master';
  if (tenantEmail && masterAccountEmail && normalizeKey(tenantEmail) === masterAccountEmail) return 'master';
  if (billing?.billingExempt) return 'billing_exempt';
  if (!billing) return 'active';
  if (billing.subscriptionStatus === 'active' || billing.isTrialActive) return billing.isTrialActive ? 'trial' : 'active';
  return 'blocked';
}

export function resolveTenantCapabilities({
  tenantId: _tenantId,
  tenantSlug,
  tenantEmail,
  billing,
  runtimeConfig,
}: {
  tenantId: string;
  tenantSlug?: string | null;
  tenantEmail?: string | null;
  billing?: TenantBillingSummary | null;
  runtimeConfig: Pick<TenantRuntimeConfig, 'industryProfile' | 'enabledModules' | 'activeModules' | 'labels'>;
}): TenantCapabilitiesType {
  const planKey = getPlanKeyFromBilling(billing);
  const accessStatus = getAccessStatus(billing, tenantSlug, tenantEmail);
  const isTrialAccess = accessStatus === 'trial';
  const effectivePlanKey: TenantCapabilities['plan_key'] = isTrialAccess ? 'scale' : planKey;
  const plan = PLAN_REGISTRY[effectivePlanKey];

  const activeModules = runtimeConfig.activeModules.map((module) => canonicalModuleKey(module));
  const enabledModules = runtimeConfig.enabledModules
    .filter((module) => module.enabled)
    .map((module) => canonicalModuleKey(module.module_key));
  const industryModules = getIndustryDefaultModules(runtimeConfig.industryProfile?.industry_key);
  const baseModules = unique(
    isTrialAccess
      ? MODULE_REGISTRY.map((module) => module.key)
      : activeModules.length > 0
        ? activeModules
        : enabledModules.length > 0
          ? enabledModules
          : industryModules,
  );

  const requestedActive = unique(baseModules);
  const locked = unique(MODULE_REGISTRY
    .filter((module) => !requestedActive.includes(module.key))
    .map((module) => module.key));

  const reasons: string[] = [];
  if (enabledModules.length === 0) reasons.push('tenant_without_enabled_modules_uses_industry_defaults');
  if (accessStatus === 'trial') reasons.push('trial_access');
  if (accessStatus === 'billing_exempt') reasons.push('billing_exempt');
  if (accessStatus === 'master') reasons.push('master_override');
  if (billing?.isBillingBlocked) reasons.push('billing_blocked');

  return {
    plan_key: planKey,
    access_status: accessStatus,
    active_modules: requestedActive,
    locked_modules: locked,
    limits: plan.limits,
    reasons,
  };
}
