/* eslint-disable */
import type { Error } from './error.ts';
import type { FileLinkResponseData } from './fileLinkResponseData.ts';

export interface FileLinkResponse {
  success: boolean;
  data?: FileLinkResponseData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
