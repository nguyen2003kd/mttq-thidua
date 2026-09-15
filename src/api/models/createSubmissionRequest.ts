/* eslint-disable */
import type { CreateSubmissionItem } from './createSubmissionItem.ts';

export interface CreateSubmissionRequest {
  criteriaGroupId?: string;
  /** @nullable */
  items?: CreateSubmissionItem[] | null;
  isDraft?: boolean;
}
