/* eslint-disable */
import type { Error } from './error.ts';
import type { NotificationPreference } from './notificationPreference.ts';

export type GetNotificationPreferences200 = {
  success: boolean;
  /** @nullable */
  data?: NotificationPreference[] | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
};
