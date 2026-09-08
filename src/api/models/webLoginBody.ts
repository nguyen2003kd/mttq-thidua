/* eslint-disable */
import type { WebLoginBodyDeviceInfo } from './webLoginBodyDeviceInfo.ts';

export interface WebLoginBody {
  email: string;
  /**
     * @minLength 1
     * @maxLength 128
     */
  password: string;
  device_info?: WebLoginBodyDeviceInfo;
}
