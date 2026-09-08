/* eslint-disable */
import type { Error } from './error.ts';
import type { SessionListResponseData } from './sessionListResponseData.ts';

export interface SessionListResponse {
  success: boolean;
  /** @nullable */
  data?: SessionListResponseData;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
