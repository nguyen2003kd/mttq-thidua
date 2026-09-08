/* eslint-disable */
import type { Error } from './error.ts';
import type { UserListData } from './userListData.ts';

export interface UserListResponse {
  success: boolean;
  data?: UserListData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
