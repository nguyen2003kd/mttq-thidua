/* eslint-disable */
import type { Error } from './error.ts';
import type { RegisterResponseData } from './registerResponseData.ts';

export interface RegisterResponse {
  success: boolean;
  data?: RegisterResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
