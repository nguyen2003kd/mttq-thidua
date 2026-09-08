/* eslint-disable */
import type { Notification } from './notification.ts';

/**
 * @nullable
 */
export type NotificationListData = {
  count: number;
  rows: Notification[];
  page: number;
  pageSize: number;
  unread_count: number;
} | null;
