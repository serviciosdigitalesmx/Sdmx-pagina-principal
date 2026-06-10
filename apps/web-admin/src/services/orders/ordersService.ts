import { fixService } from '../fixService';

export const ordersService = {
  getOrders: (...args: Parameters<typeof fixService.getOrders>) =>
    fixService.getOrders(...args),

  getOrderById: (...args: Parameters<typeof fixService.getOrderById>) =>
    fixService.getOrderById(...args),

  createOrder: (...args: Parameters<typeof fixService.createOrder>) =>
    fixService.createOrder(...args),

  uploadOrderAttachment: (...args: Parameters<typeof fixService.uploadOrderAttachment>) =>
    fixService.uploadOrderAttachment(...args),

  addOrderNote: (...args: Parameters<typeof fixService.addOrderNote>) =>
    fixService.addOrderNote(...args),

  updateOrderStatus: (...args: Parameters<typeof fixService.updateOrderStatus>) =>
    fixService.updateOrderStatus(...args),

  updateOrderFinancials: (...args: Parameters<typeof fixService.updateOrderFinancials>) =>
    fixService.updateOrderFinancials(...args),

  updateOrderDetails: (...args: Parameters<typeof fixService.updateOrderDetails>) =>
    fixService.updateOrderDetails(...args),

  getOrderChecklist: (...args: Parameters<typeof fixService.getOrderChecklist>) =>
    fixService.getOrderChecklist(...args),

  updateOrderChecklist: (...args: Parameters<typeof fixService.updateOrderChecklist>) =>
    fixService.updateOrderChecklist(...args),

  updateOrderWarranty: (...args: Parameters<typeof fixService.updateOrderWarranty>) =>
    fixService.updateOrderWarranty(...args),
};
