/* eslint-disable */

export type NotificationPreferenceChannel = typeof NotificationPreferenceChannel[keyof typeof NotificationPreferenceChannel];


export const NotificationPreferenceChannel = {
  in_app: 'in_app',
  push: 'push',
  email: 'email',
  sms: 'sms',
  zalo: 'zalo',
} as const;
