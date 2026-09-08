/* eslint-disable */

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];


export const NotificationType = {
  order_created: 'order_created',
  payment_success: 'payment_success',
  payment_failed: 'payment_failed',
  order_shipped: 'order_shipped',
  order_delivered: 'order_delivered',
  system_alert: 'system_alert',
  promotion: 'promotion',
  chat_message: 'chat_message',
  security_alert: 'security_alert',
  account_update: 'account_update',
} as const;
