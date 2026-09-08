/* eslint-disable */
import type { Error } from './error.ts';
import type { File } from './file.ts';

export interface FileResponse {
  success: boolean;
  data?: File & (unknown | null);
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
