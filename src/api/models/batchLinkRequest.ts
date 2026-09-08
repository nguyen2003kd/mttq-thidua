/* eslint-disable */
import type { BatchLinkRequestMode } from './batchLinkRequestMode.ts';

export interface BatchLinkRequest {
  /** @maxItems 100 */
  file_ids: string[];
  mode?: BatchLinkRequestMode;
}
