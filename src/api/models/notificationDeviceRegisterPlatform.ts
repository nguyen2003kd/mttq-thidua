/* eslint-disable */

export type NotificationDeviceRegisterPlatform = typeof NotificationDeviceRegisterPlatform[keyof typeof NotificationDeviceRegisterPlatform];


export const NotificationDeviceRegisterPlatform = {
  web: 'web',
  ios: 'ios',
  android: 'android',
  zalo_mini_app: 'zalo_mini_app',
} as const;
