/* eslint-disable */
import type { CompressInfo } from './compressInfo.ts';

export interface File {
  id: string;
  path: string;
  name: string;
  mime: string;
  type: string;
  /** @nullable */
  size: number | null;
  compress_info: CompressInfo | null;
  /** @nullable */
  title: string | null;
  /** @nullable */
  description: string | null;
  /** @nullable */
  note: string | null;
  is_library: boolean;
  created_at: string;
  /** @nullable */
  updated_at: string | null;
  /** @nullable */
  created_by: string | null;
  /** @nullable */
  updated_by: string | null;
}
