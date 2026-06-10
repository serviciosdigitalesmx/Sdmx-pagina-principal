import { fixService } from '../fixService';

export const tasksService = {
  getTasks: (...args: Parameters<typeof fixService.getTasks>) =>
    fixService.getTasks(...args),

  getTaskById: (...args: Parameters<typeof fixService.getTaskById>) =>
    fixService.getTaskById(...args),

  createTask: (...args: Parameters<typeof fixService.createTask>) =>
    fixService.createTask(...args),

  updateTask: (...args: Parameters<typeof fixService.updateTask>) =>
    fixService.updateTask(...args),

  updateTaskStatus: (...args: Parameters<typeof fixService.updateTaskStatus>) =>
    fixService.updateTaskStatus(...args),

  getTaskHistory: (...args: Parameters<typeof fixService.getTaskHistory>) =>
    fixService.getTaskHistory(...args),

  deleteTask: (...args: Parameters<typeof fixService.deleteTask>) =>
    fixService.deleteTask(...args),
};
