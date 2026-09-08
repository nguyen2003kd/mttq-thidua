/* eslint-disable */
import type { Error } from './error.ts';
import type { UnreadCountData } from './unreadCountData.ts';

export interface UnreadCountResponse {
  success: boolean;
  data?: UnreadCountData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
