/* eslint-disable */
import type { Error } from './error.ts';
import type { SendConfirmOtpResponseData } from './sendConfirmOtpResponseData.ts';

export interface SendConfirmOtpResponse {
  success: boolean;
  data?: SendConfirmOtpResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
