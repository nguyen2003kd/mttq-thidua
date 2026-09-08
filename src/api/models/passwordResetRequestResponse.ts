/* eslint-disable */
import type { Error } from './error.ts';
import type { PasswordResetRequestResponseData } from './passwordResetRequestResponseData.ts';

export interface PasswordResetRequestResponse {
  success: boolean;
  data?: PasswordResetRequestResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
