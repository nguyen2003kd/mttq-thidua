/* eslint-disable */
import type { Error } from './error.ts';

export interface ErrorResponse {
  success: boolean;
  /** @nullable */
  data?: Error[] | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
