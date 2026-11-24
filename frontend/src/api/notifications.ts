import { apiClient } from './client';
export interface RescueNotification { notificationId: number; userId: number; title: string; message: string; isRead: boolean; createdAt: string; }
export const notificationApi = {
  list: async (beforeId?: number) => (await apiClient.get<RescueNotification[]>('/api/notifications', { params: { beforeId } })).data,
  count: async () => (await apiClient.get<{count: number}>('/api/notifications/unread-count')).data.count,
  read: async (id: number) => { await apiClient.patch(`/api/notifications/${id}/read`); },
  readAll: async () => { await apiClient.patch('/api/notifications/read-all'); }
};
