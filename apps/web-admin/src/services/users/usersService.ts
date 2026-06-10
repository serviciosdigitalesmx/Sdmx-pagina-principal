import { fixService } from '../fixService';

export const usersService = {
  getUsers: (...args: Parameters<typeof fixService.getUsers>) =>
    fixService.getUsers(...args),

  inviteUser: (...args: Parameters<typeof fixService.inviteUser>) =>
    fixService.inviteUser(...args),

  updateUserRole: (...args: Parameters<typeof fixService.updateUserRole>) =>
    fixService.updateUserRole(...args),

  deactivateUser: (...args: Parameters<typeof fixService.deactivateUser>) =>
    fixService.deactivateUser(...args),

  getUserPurchaseOrders: (...args: Parameters<typeof fixService.getUserPurchaseOrders>) =>
    fixService.getUserPurchaseOrders(...args),
};
