import { apiGateway } from '../apiGateway';

export const usersService = {
  getSucursales: () => apiGateway.getSucursales(),

  getUsers: (...args: Parameters<typeof apiGateway.getUsers>) =>
    apiGateway.getUsers(...args),

  inviteUser: (...args: Parameters<typeof apiGateway.inviteUser>) =>
    apiGateway.inviteUser(...args),

  updateUserRole: (...args: Parameters<typeof apiGateway.updateUserRole>) =>
    apiGateway.updateUserRole(...args),

  deactivateUser: (...args: Parameters<typeof apiGateway.deactivateUser>) =>
    apiGateway.deactivateUser(...args),

  getUserPurchaseOrders: (...args: Parameters<typeof apiGateway.getUserPurchaseOrders>) =>
    apiGateway.getUserPurchaseOrders(...args),
};
