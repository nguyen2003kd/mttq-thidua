/* eslint-disable */
import type { Error } from './error.ts';

export type DeleteFile200 = {
  success: boolean;
  data?: unknown | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
};
