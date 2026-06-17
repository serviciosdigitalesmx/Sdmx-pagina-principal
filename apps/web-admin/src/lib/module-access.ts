import { getPlatformScope } from '@/lib/scope';
import { resolveVertical } from '@/domain/vertical/VerticalRegistry';
import { getStoredActiveModules, getStoredIndustryKey } from '@/lib/tenant-runtime-config';

export type TenantModuleKey =
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'tasks'
  | 'reports'
  | 'procurement'
  | 'finance'
  | 'security'
  | 'movivendor'
  | 'requests'
  | 'settings'
  | 'users'
  | 'branches'
  | 'archive';

const MODULE_KEY_ALIASES: Record<string, TenantModuleKey> = {
  dashboard: 'orders',
  customers: 'customers',
  requests: 'requests',
  orders: 'orders',
  appointments: 'orders',
  assets: 'inventory',
  stock: 'inventory',
  suppliers: 'procurement',
  'purchase-orders': 'procurement',
  purchases: 'procurement',
  procurement: 'procurement',
  expenses: 'finance',
  gastos: 'finance',
  finance: 'finance',
  reports: 'reports',
  documents: 'settings',
  portal: 'settings',
  landing: 'settings',
  whatsapp: 'settings',
  warranty: 'settings',
  billing: 'settings',
  settings: 'settings',
  sucursales: 'branches',
  branches: 'branches',
  users: 'users',
  usuarios: 'users',
  tasks: 'tasks',
  movivendor: 'movivendor',
  security: 'security',
  seguridad: 'security',
  archive: 'archive',
  archivo: 'archive',
};

function normalizeModuleKey(key: string): TenantModuleKey | null {
  return MODULE_KEY_ALIASES[key] ?? null;
}

const MODULE_ROUTE_MAP: Record<string, TenantModuleKey> = {
  '/dashboard/ordenes': 'orders',
  '/dashboard/clientes': 'customers',
  '/dashboard/stock': 'inventory',
  '/dashboard/tareas': 'tasks',
  '/dashboard/reportes': 'reports',
  '/dashboard/compras': 'procurement',
  '/dashboard/proveedores': 'procurement',
  '/dashboard/finanzas': 'finance',
  '/dashboard/gastos': 'finance',
  '/dashboard/seguridad': 'security',
  '/dashboard/movivendor': 'movivendor',
  '/dashboard/solicitudes': 'requests',
  '/dashboard/usuarios': 'users',
  '/dashboard/sucursales': 'branches',
  '/dashboard/archivo': 'archive',
};

export function getEnabledModules(): string[] {
  const storedActiveModules = getStoredActiveModules();
  if (storedActiveModules.length > 0) {
    return storedActiveModules
      .map((moduleKey) => normalizeModuleKey(moduleKey))
      .filter((moduleKey): moduleKey is TenantModuleKey => Boolean(moduleKey));
  }

  const scope = getPlatformScope();
  const vertical = resolveVertical(getStoredIndustryKey() ?? scope?.verticalCode ?? null);

  return (vertical.enabledModules ?? [])
    .map((moduleKey) => normalizeModuleKey(moduleKey))
    .filter((moduleKey): moduleKey is TenantModuleKey => Boolean(moduleKey));
}

export function isModuleEnabled(moduleKey: TenantModuleKey): boolean {
  const enabled = getEnabledModules();

  if (!enabled.length) {
    return true;
  }

  return enabled.includes(moduleKey);
}

export function isRouteEnabled(pathname: string): boolean {
  if (pathname.startsWith('/dashboard/movivendor')) {
    return true;
  }
  const moduleKey = MODULE_ROUTE_MAP[pathname];

  if (!moduleKey) {
    return true;
  }

  return isModuleEnabled(moduleKey);
}
