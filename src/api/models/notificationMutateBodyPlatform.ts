/* eslint-disable */

/**
 * @nullable
 */
export type NotificationMutateBodyPlatform = typeof NotificationMutateBodyPlatform[keyof typeof NotificationMutateBodyPlatform] | null;


export const NotificationMutateBodyPlatform = {
  web: 'web',
  ios: 'ios',
  android: 'android',
  zalo_mini_app: 'zalo_mini_app',
} as const;
