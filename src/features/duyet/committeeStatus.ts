export const COMMITTEE_APPROVED_STAGE = 'CommitteeFinalized' as const;

export function isCommitteeSubmissionApproved(currentStage: string) {
  return currentStage === COMMITTEE_APPROVED_STAGE;
}
