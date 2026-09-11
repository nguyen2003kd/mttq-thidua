import { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

interface ApiErrorMessage {
  vi?: string;
  en?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: ApiErrorMessage }>;
}

export interface NotificationItemApi {
  id: string;
  messageId: string;
  title: string | null;
  body: string | null;
  type: string | null;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PagedNotifications {
  items: NotificationItemApi[];
  total: number;
  page: number;
  pageSize: number;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const notificationsApi = {
  list: (page = 1, pageSize = 10) =>
    request<PagedNotifications>({ url: '/api/v1/notifications', method: 'GET', params: { page, pageSize } }),
  unreadCount: () => request<{ count: number }>({ url: '/api/v1/notifications/unread-count', method: 'GET' }),
  markRead: (messageId: string) =>
    request<{ marked: boolean }>({ url: `/api/v1/notifications/${messageId}/read`, method: 'POST' }),
  readAll: () => request<{ updated: number }>({ url: '/api/v1/notifications/read-all', method: 'POST' }),
};

export default notificationsApi;
