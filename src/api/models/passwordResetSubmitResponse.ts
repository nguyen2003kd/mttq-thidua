/* eslint-disable */
import type { Error } from './error.ts';
import type { PasswordResetSubmitResponseData } from './passwordResetSubmitResponseData.ts';

export interface PasswordResetSubmitResponse {
  success: boolean;
  /** @nullable */
  data?: PasswordResetSubmitResponseData;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
