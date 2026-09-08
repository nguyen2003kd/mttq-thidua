/* eslint-disable */
import type { NotificationDeviceDeviceInfo } from './notificationDeviceDeviceInfo.ts';
import type { NotificationDevicePlatform } from './notificationDevicePlatform.ts';

export interface NotificationDevice {
  id: string;
  user_id: string;
  platform: NotificationDevicePlatform;
  device_id: string;
  /** @nullable */
  device_name: string | null;
  /** @nullable */
  push_token: string | null;
  /** @nullable */
  one_signal_player_id: string | null;
  /** @nullable */
  device_info: NotificationDeviceDeviceInfo;
  is_active: boolean;
  /** @nullable */
  last_used_at: string | null;
  created_at: string;
  /** @nullable */
  updated_at: string | null;
}
