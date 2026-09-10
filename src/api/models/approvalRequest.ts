/* eslint-disable */
import type { ApprovalScoreItem } from './approvalScoreItem.ts';

export interface ApprovalRequest {
  submissionId?: string;
  /** @nullable */
  action?: string | null;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  scoreItems?: ApprovalScoreItem[] | null;
}
