/* eslint-disable */
import type { Error } from './error.ts';
import type { Notification } from './notification.ts';

export interface NotificationResponse {
  success: boolean;
  data?: Notification & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
