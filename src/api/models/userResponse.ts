/* eslint-disable */
import type { Error } from './error.ts';
import type { User } from './user.ts';

export interface UserResponse {
  success: boolean;
  data?: User & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
