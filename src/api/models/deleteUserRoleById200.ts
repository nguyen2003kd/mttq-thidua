/* eslint-disable */
import type { Error } from './error.ts';

export type DeleteUserRoleById200 = {
  success: boolean;
  /** @nullable */
  data?: string | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
};
