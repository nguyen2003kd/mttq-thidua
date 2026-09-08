/* eslint-disable */
import type { Error } from './error.ts';
import type { PermissionListData } from './permissionListData.ts';

export interface PermissionListResponse {
  success: boolean;
  data?: PermissionListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
