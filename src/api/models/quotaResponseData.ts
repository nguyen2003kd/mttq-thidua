/* eslint-disable */

/**
 * @nullable
 */
export type QuotaResponseData = {
  used_bytes: number;
  used_files: number;
  /** @nullable */
  limit_bytes: number | null;
} | null;
