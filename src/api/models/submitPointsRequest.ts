/* eslint-disable */
import type { SubmitPointItem } from './submitPointItem.ts';

export interface SubmitPointsRequest {
  submissionId?: string;
  /** @nullable */
  items?: SubmitPointItem[] | null;
}
