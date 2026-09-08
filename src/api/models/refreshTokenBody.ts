/* eslint-disable */
import type { RefreshTokenBodyDeviceInfo } from './refreshTokenBodyDeviceInfo.ts';

export interface RefreshTokenBody {
  refresh_token?: string;
  device_info?: RefreshTokenBodyDeviceInfo;
}
