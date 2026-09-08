/* eslint-disable */
import type { User } from './user.ts';

/**
 * @nullable
 */
export type UserListData = {
  count: number;
  rows: User[];
  page: number;
  pageSize: number;
} | null;
