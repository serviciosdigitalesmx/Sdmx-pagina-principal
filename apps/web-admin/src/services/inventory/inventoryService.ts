import { fixService } from '../fixService';

export const inventoryService = {
  getInventory: (...args: Parameters<typeof fixService.getInventory>) =>
    fixService.getInventory(...args),

  createInventoryItem: (...args: Parameters<typeof fixService.createInventoryItem>) =>
    fixService.createInventoryItem(...args),

  updateInventoryItem: (...args: Parameters<typeof fixService.updateInventoryItem>) =>
    fixService.updateInventoryItem(...args),

  getInventoryMovements: (...args: Parameters<typeof fixService.getInventoryMovements>) =>
    fixService.getInventoryMovements(...args),

  getStockAlerts: (...args: Parameters<typeof fixService.getStockAlerts>) =>
    fixService.getStockAlerts(...args),

  acknowledgeStockAlert: (...args: Parameters<typeof fixService.acknowledgeStockAlert>) =>
    fixService.acknowledgeStockAlert(...args),
};
