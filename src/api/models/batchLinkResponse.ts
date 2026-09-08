/* eslint-disable */
import type { BatchLinkResult } from './batchLinkResult.ts';
import type { Error } from './error.ts';

export interface BatchLinkResponse {
  success: boolean;
  data?: BatchLinkResult | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
