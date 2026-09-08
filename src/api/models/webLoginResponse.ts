/* eslint-disable */
import type { Error } from './error.ts';
import type { WebLoginData } from './webLoginData.ts';

export interface WebLoginResponse {
  success: boolean;
  data?: WebLoginData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
