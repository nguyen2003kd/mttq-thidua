/* eslint-disable */
import type { File } from './file.ts';

/**
 * @nullable
 */
export type FileListData = {
  count: number;
  rows: File[];
  page: number;
  pageSize: number;
} | null;
