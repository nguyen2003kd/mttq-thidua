/* eslint-disable */
import type { Error } from './error.ts';
import type { NotificationDevice } from './notificationDevice.ts';

export type RegisterNotificationDevice200 = {
  success: boolean;
  data?: NotificationDevice & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
};
