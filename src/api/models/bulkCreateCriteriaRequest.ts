/* eslint-disable */
import type { BulkCriteriaItem } from './bulkCriteriaItem.ts';

export interface BulkCreateCriteriaRequest {
  criteriaGroupId?: string;
  /** @nullable */
  items?: BulkCriteriaItem[] | null;
}
