/* eslint-disable */
import type { UserRole } from './userRole.ts';

/**
 * @nullable
 */
export type UserRoleListData = {
  count: number;
  rows: UserRole[];
  page: number;
  pageSize: number;
} | null;
