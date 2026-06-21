import type { TenantRuntimeConfig } from '@white-label/types';

export function cleanTenantTextField(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

export function getTenantFieldDefinition(runtimeConfig: TenantRuntimeConfig, entity: string, fieldKey: string) {
  return runtimeConfig.fieldDefinitions.find(
    (field) => field.entity === entity && field.field_key === fieldKey && field.visible !== false,
  ) ?? null;
}

export function isTenantFieldRequired(runtimeConfig: TenantRuntimeConfig, entity: string, fieldKey: string) {
  return Boolean(getTenantFieldDefinition(runtimeConfig, entity, fieldKey)?.required);
}

export function getMissingRequiredTextField(runtimeConfig: TenantRuntimeConfig, entity: string, fieldKey: string, value: unknown) {
  if (!isTenantFieldRequired(runtimeConfig, entity, fieldKey)) {
    return null;
  }

  return cleanTenantTextField(value) ? null : fieldKey;
}
