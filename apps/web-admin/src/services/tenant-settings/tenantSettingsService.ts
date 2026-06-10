import { fixService } from '../fixService';

export const tenantSettingsService = {
  getTenantLandingSettings: (...args: Parameters<typeof fixService.getTenantLandingSettings>) =>
    fixService.getTenantLandingSettings(...args),

  updateTenantLandingSettings: (...args: Parameters<typeof fixService.updateTenantLandingSettings>) =>
    fixService.updateTenantLandingSettings(...args),

  getTenantSettings: (...args: Parameters<typeof fixService.getTenantSettings>) =>
    fixService.getTenantSettings(...args),

  updateTenantSettings: (...args: Parameters<typeof fixService.updateTenantSettings>) =>
    fixService.updateTenantSettings(...args),
};
