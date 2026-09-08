/* eslint-disable */
import type { SessionListResponseDataRowsItem } from './sessionListResponseDataRowsItem.ts';

/**
 * @nullable
 */
export type SessionListResponseData = {
  count: number;
  rows: SessionListResponseDataRowsItem[];
  page: number;
  pageSize: number;
} | null;
