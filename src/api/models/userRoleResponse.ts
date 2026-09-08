/* eslint-disable */
import type { Error } from './error.ts';
import type { UserRole } from './userRole.ts';

export interface UserRoleResponse {
  success: boolean;
  data?: UserRole & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
