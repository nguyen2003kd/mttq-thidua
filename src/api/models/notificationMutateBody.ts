/* eslint-disable */
import type { NotificationMutateBodyChannel } from './notificationMutateBodyChannel.ts';
import type { NotificationMutateBodyData } from './notificationMutateBodyData.ts';
import type { NotificationMutateBodyPlatform } from './notificationMutateBodyPlatform.ts';
import type { NotificationMutateBodyType } from './notificationMutateBodyType.ts';

export interface NotificationMutateBody {
  /**
     * @minLength 1
     * @maxLength 255
     */
  title: string;
  /**
     * @minLength 1
     * @maxLength 2000
     */
  body: string;
  user_id?: string | string[] | unknown | null;
  type?: NotificationMutateBodyType;
  channel?: NotificationMutateBodyChannel;
  /** @nullable */
  platform?: NotificationMutateBodyPlatform;
  /** @nullable */
  data?: NotificationMutateBodyData;
  /** @nullable */
  tenant_id?: string | null;
  /** @nullable */
  scheduled_at?: string | null;
  /** @nullable */
  priority?: number | null;
}
