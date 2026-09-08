/* eslint-disable */

export type BatchLinkResultItem = {
  file_id: string;
  /** @nullable */
  url: string | null;
  /** @nullable */
  fallback_endpoint: string | null;
  /** @nullable */
  expires_in: number | null;
  error?: string;
};
