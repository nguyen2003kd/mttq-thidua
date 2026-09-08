/* eslint-disable */
import type { Error } from './error.ts';

export interface RestoreFileResponse {
  success: boolean;
  /** @nullable */
  data?: boolean | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
