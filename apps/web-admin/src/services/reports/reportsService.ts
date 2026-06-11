import { fixService } from '../fixService';

export const reportsService = {
  getReportsSummary: (...args: Parameters<typeof fixService.getReportsSummary>) =>
    fixService.getReportsSummary(...args),
};
