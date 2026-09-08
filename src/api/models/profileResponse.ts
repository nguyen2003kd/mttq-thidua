/* eslint-disable */
import type { Error } from './error.ts';
import type { UserPublic } from './userPublic.ts';

export interface ProfileResponse {
  success: boolean;
  data?: UserPublic & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
