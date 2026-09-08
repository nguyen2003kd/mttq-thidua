/* eslint-disable */
import type { NotificationPreferenceUpdateItemChannel } from './notificationPreferenceUpdateItemChannel.ts';
import type { NotificationPreferenceUpdateItemNotificationType } from './notificationPreferenceUpdateItemNotificationType.ts';

export type NotificationPreferenceUpdateItem = {
  notification_type: NotificationPreferenceUpdateItemNotificationType;
  channel: NotificationPreferenceUpdateItemChannel;
  is_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
};
