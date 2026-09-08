/* eslint-disable */
import type { NotificationChannel } from './notificationChannel.ts';
import type { NotificationData } from './notificationData.ts';
import type { NotificationType } from './notificationType.ts';

export interface Notification {
  id: string;
  title: string;
  /** @nullable */
  body: string | null;
  type: NotificationType;
  /** @nullable */
  data: NotificationData;
  /** @nullable */
  tenant_id: string | null;
  /** @nullable */
  scheduled_at: string | null;
  /** @nullable */
  priority: number | null;
  /** @nullable */
  created_by: string | null;
  /** @nullable */
  campaign_id: string | null;
  /** @nullable */
  template_id: string | null;
  /** @nullable */
  external_key: string | null;
  /** @nullable */
  dedupe_key: string | null;
  created_at: string;
  /** @nullable */
  updated_at: string | null;
  user_id: string;
  channel: NotificationChannel;
  /** @nullable */
  read_at: string | null;
  /** @nullable */
  deleted_at: string | null;
  /** @nullable */
  archived_at: string | null;
}
