/* eslint-disable */

export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];


export const NotificationChannel = {
  in_app: 'in_app',
  push: 'push',
  email: 'email',
  sms: 'sms',
  zalo: 'zalo',
} as const;
