/* eslint-disable */
import type { Error } from './error.ts';
import type { Role } from './role.ts';

export interface RoleResponse {
  success: boolean;
  data?: Role & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
