/* eslint-disable */

export type NotificationMutateBodyChannel = typeof NotificationMutateBodyChannel[keyof typeof NotificationMutateBodyChannel];


export const NotificationMutateBodyChannel = {
  in_app: 'in_app',
  push: 'push',
  email: 'email',
  sms: 'sms',
  zalo: 'zalo',
} as const;
