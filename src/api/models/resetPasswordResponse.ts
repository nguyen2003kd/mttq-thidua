/* eslint-disable */
import type { Error } from './error.ts';
import type { ResetPasswordResponseData } from './resetPasswordResponseData.ts';

export interface ResetPasswordResponse {
  success: boolean;
  data?: ResetPasswordResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
