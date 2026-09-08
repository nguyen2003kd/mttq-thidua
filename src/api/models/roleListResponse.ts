/* eslint-disable */
import type { Error } from './error.ts';
import type { RoleListData } from './roleListData.ts';

export interface RoleListResponse {
  success: boolean;
  data?: RoleListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
