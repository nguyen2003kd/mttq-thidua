/* eslint-disable */
import type { Error } from './error.ts';

export interface RevokeSessionResponse {
  success: boolean;
  data?: unknown | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
