/* eslint-disable */
import type { Permission } from './permission.ts';

/**
 * @nullable
 */
export type PermissionListData = {
  count: number;
  rows: Permission[];
  page: number;
  pageSize: number;
} | null;
