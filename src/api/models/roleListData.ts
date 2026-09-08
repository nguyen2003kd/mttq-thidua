/* eslint-disable */
import type { Role } from './role.ts';

/**
 * @nullable
 */
export type RoleListData = {
  count: number;
  rows: Role[];
  page: number;
  pageSize: number;
} | null;
