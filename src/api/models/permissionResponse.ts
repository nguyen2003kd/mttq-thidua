/* eslint-disable */
import type { Error } from './error.ts';
import type { Permission } from './permission.ts';

export interface PermissionResponse {
  success: boolean;
  data?: Permission & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
