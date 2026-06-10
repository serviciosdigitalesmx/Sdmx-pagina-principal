import { fixService } from '../fixService';

export const procurementService = {
  getProcurementSummary: () =>
    fixService.getProcurementSummary(),

  getSuppliers: (...args: Parameters<typeof fixService.getSuppliers>) =>
    fixService.getSuppliers(...args),

  getSupplierById: (...args: Parameters<typeof fixService.getSupplierById>) =>
    fixService.getSupplierById(...args),

  createSupplier: (...args: Parameters<typeof fixService.createSupplier>) =>
    fixService.createSupplier(...args),

  updateSupplier: (...args: Parameters<typeof fixService.updateSupplier>) =>
    fixService.updateSupplier(...args),

  updateSupplierStatus: (...args: Parameters<typeof fixService.updateSupplierStatus>) =>
    fixService.updateSupplierStatus(...args),

  deleteSupplier: (...args: Parameters<typeof fixService.deleteSupplier>) =>
    fixService.deleteSupplier(...args),

  getPurchaseOrders: (...args: Parameters<typeof fixService.getPurchaseOrders>) =>
    fixService.getPurchaseOrders(...args),

  getPurchaseOrderById: (...args: Parameters<typeof fixService.getPurchaseOrderById>) =>
    fixService.getPurchaseOrderById(...args),

  createPurchaseOrder: (...args: Parameters<typeof fixService.createPurchaseOrder>) =>
    fixService.createPurchaseOrder(...args),

  updatePurchaseOrder: (...args: Parameters<typeof fixService.updatePurchaseOrder>) =>
    fixService.updatePurchaseOrder(...args),

  updatePurchaseOrderStatus: (...args: Parameters<typeof fixService.updatePurchaseOrderStatus>) =>
    fixService.updatePurchaseOrderStatus(...args),

  receivePurchaseOrder: (...args: Parameters<typeof fixService.receivePurchaseOrder>) =>
    fixService.receivePurchaseOrder(...args),

  deletePurchaseOrder: (...args: Parameters<typeof fixService.deletePurchaseOrder>) =>
    fixService.deletePurchaseOrder(...args),
};
