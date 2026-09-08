/* eslint-disable */
import type { Error } from './error.ts';
import type { UserRoleListData } from './userRoleListData.ts';

export interface UserRoleListResponse {
  success: boolean;
  data?: UserRoleListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
