/* eslint-disable */
import type { Error } from './error.ts';
import type { RolePermission } from './rolePermission.ts';

export interface RolePermissionArrayResponse {
  success: boolean;
  /** @nullable */
  data?: RolePermission[] | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
