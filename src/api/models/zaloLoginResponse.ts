/* eslint-disable */
import type { Error } from './error.ts';
import type { MobileLoginData } from './mobileLoginData.ts';

export interface ZaloLoginResponse {
  success: boolean;
  data?: MobileLoginData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
