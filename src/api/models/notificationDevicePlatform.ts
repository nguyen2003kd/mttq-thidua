/* eslint-disable */

export type NotificationDevicePlatform = typeof NotificationDevicePlatform[keyof typeof NotificationDevicePlatform];


export const NotificationDevicePlatform = {
  web: 'web',
  ios: 'ios',
  android: 'android',
  zalo_mini_app: 'zalo_mini_app',
} as const;
