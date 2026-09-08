/* eslint-disable */
import type { NotificationDeviceRegisterDeviceInfo } from './notificationDeviceRegisterDeviceInfo.ts';
import type { NotificationDeviceRegisterPlatform } from './notificationDeviceRegisterPlatform.ts';

export interface NotificationDeviceRegister {
  platform: NotificationDeviceRegisterPlatform;
  device_id: string;
  device_name?: string;
  push_token?: string;
  one_signal_player_id?: string;
  device_info?: NotificationDeviceRegisterDeviceInfo;
}
