/* eslint-disable */
import type { Error } from './error.ts';
import type { RolePermissionListData } from './rolePermissionListData.ts';

export interface RolePermissionListResponse {
  success: boolean;
  data?: RolePermissionListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
