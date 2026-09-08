/* eslint-disable */
import type { RolePermission } from './rolePermission.ts';

/**
 * @nullable
 */
export type RolePermissionListData = {
  count: number;
  rows: RolePermission[];
  page: number;
  pageSize: number;
} | null;
