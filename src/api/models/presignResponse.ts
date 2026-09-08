/* eslint-disable */
import type { Error } from './error.ts';
import type { PresignResponseData } from './presignResponseData.ts';

export interface PresignResponse {
  success: boolean;
  data?: PresignResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
