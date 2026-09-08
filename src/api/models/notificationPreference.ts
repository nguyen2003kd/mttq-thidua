/* eslint-disable */
import type { NotificationPreferenceChannel } from './notificationPreferenceChannel.ts';
import type { NotificationPreferenceNotificationType } from './notificationPreferenceNotificationType.ts';

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationPreferenceNotificationType;
  channel: NotificationPreferenceChannel;
  is_enabled?: boolean;
  /** @nullable */
  quiet_hours_start: string | null;
  /** @nullable */
  quiet_hours_end: string | null;
  created_at: string;
  /** @nullable */
  updated_at: string | null;
}
