/* eslint-disable */

export type NotificationPreferenceUpdateItemChannel = typeof NotificationPreferenceUpdateItemChannel[keyof typeof NotificationPreferenceUpdateItemChannel];


export const NotificationPreferenceUpdateItemChannel = {
  in_app: 'in_app',
  push: 'push',
  email: 'email',
  sms: 'sms',
  zalo: 'zalo',
} as const;
