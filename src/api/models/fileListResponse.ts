/* eslint-disable */
import type { Error } from './error.ts';
import type { FileListData } from './fileListData.ts';

export interface FileListResponse {
  success: boolean;
  data?: FileListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
