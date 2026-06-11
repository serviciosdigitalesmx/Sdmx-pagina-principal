import { apiGateway } from '../apiGateway';
import {
  extractTenantRuntimeConfig,
  saveTenantRuntimeConfig,
} from '@/lib/tenant-runtime-config';

function persistRuntimeConfig<T>(response: T): T {
  saveTenantRuntimeConfig(extractTenantRuntimeConfig(response));
  return response;
}

export const tenantSettingsService = {
  getTenantLandingSettings: async (...args: Parameters<typeof apiGateway.getTenantLandingSettings>) => {
    const response = await apiGateway.getTenantLandingSettings(...args);
    return persistRuntimeConfig(response);
  },

  updateTenantLandingSettings: async (...args: Parameters<typeof apiGateway.updateTenantLandingSettings>) => {
    const response = await apiGateway.updateTenantLandingSettings(...args);
    return persistRuntimeConfig(response);
  },

  getTenantSettings: async (...args: Parameters<typeof apiGateway.getTenantSettings>) => {
    const response = await apiGateway.getTenantSettings(...args);
    return persistRuntimeConfig(response);
  },

  updateTenantSettings: async (...args: Parameters<typeof apiGateway.updateTenantSettings>) => {
    const response = await apiGateway.updateTenantSettings(...args);
    return persistRuntimeConfig(response);
  },
};
