/* eslint-disable */
import type { Error } from './error.ts';
import type { QuotaResponseData } from './quotaResponseData.ts';

export interface QuotaResponse {
  success: boolean;
  data?: QuotaResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
