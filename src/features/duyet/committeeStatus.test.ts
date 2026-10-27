import { describe, expect, it } from 'vitest';
import { isCommitteeSubmissionApproved } from './committeeStatus';

describe('isCommitteeSubmissionApproved', () => {
  it.each(['SpecialistApproved', 'LeaderApproved', 'CouncilApproved'])(
    'keeps %s waiting for committee approval',
    (stage) => {
      expect(isCommitteeSubmissionApproved(stage)).toBe(false);
    },
  );

  it('marks a committee-finalized submission as approved', () => {
    expect(isCommitteeSubmissionApproved('CommitteeFinalized')).toBe(true);
  });
});
