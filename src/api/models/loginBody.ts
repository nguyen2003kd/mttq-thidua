/* eslint-disable */
import type { LoginBodyDeviceInfo } from './loginBodyDeviceInfo.ts';

export interface LoginBody {
  email: string;
  /**
     * @minLength 1
     * @maxLength 128
     */
  password: string;
  device_info?: LoginBodyDeviceInfo;
}
