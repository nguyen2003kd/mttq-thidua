/* eslint-disable */
import type { ZaloLoginBodyDeviceInfo } from './zaloLoginBodyDeviceInfo.ts';

export interface ZaloLoginBody {
  zalo_code?: string;
  zalo_open_id?: string;
  device_info?: ZaloLoginBodyDeviceInfo;
}
