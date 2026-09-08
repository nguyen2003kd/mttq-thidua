/* eslint-disable */
import type { Error } from './error.ts';
import type { NotificationListData } from './notificationListData.ts';

export interface NotificationListResponse {
  success: boolean;
  data?: NotificationListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
