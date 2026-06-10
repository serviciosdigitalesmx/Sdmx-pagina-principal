import { fixService } from '../fixService';

export const securityService = {
  getSecuritySummary: (...args: Parameters<typeof fixService.getSecuritySummary>) =>
    fixService.getSecuritySummary(...args),

  getAuditLogs: (...args: Parameters<typeof fixService.getAuditLogs>) =>
    fixService.getAuditLogs(...args),

  getSecuritySessions: (...args: Parameters<typeof fixService.getSecuritySessions>) =>
    fixService.getSecuritySessions(...args),

  revokeSecuritySession: (...args: Parameters<typeof fixService.revokeSecuritySession>) =>
    fixService.revokeSecuritySession(...args),

  rotateSecurityKeys: (...args: Parameters<typeof fixService.rotateSecurityKeys>) =>
    fixService.rotateSecurityKeys(...args),

  getMfaSetup: (...args: Parameters<typeof fixService.getMfaSetup>) =>
    fixService.getMfaSetup(...args),

  verifyMfaCode: (...args: Parameters<typeof fixService.verifyMfaCode>) =>
    fixService.verifyMfaCode(...args),

  setAdminMfaRequirement: (...args: Parameters<typeof fixService.setAdminMfaRequirement>) =>
    fixService.setAdminMfaRequirement(...args),
};
