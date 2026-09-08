/* eslint-disable */
import type { Error } from './error.ts';
import type { NotificationDevice } from './notificationDevice.ts';

export type GetNotificationDevices200 = {
  success: boolean;
  /** @nullable */
  data?: NotificationDevice[] | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
};
