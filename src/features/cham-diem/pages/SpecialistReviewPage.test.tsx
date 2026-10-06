import { describe, expect, it } from 'vitest';
import { getSpecialistSubmissionPermissions } from '../api/specialistApi';
import { getSpecialistGroupProgress } from '../utils/specialistGroupProgress';

describe('getSpecialistGroupProgress', () => {
  const groups = [
    { periodId: 'period-a', status: 'DA_CHAM', hasModificationRequest: false },
    { periodId: 'period-a', status: 'CHO_CHAM', hasModificationRequest: true },
    { periodId: 'period-a', status: 'CHO_DUYET', hasModificationRequest: false },
    { periodId: 'period-a', status: 'CHUA_NOP', hasModificationRequest: false },
    { periodId: 'period-a', status: 'YEU_CAU_SUA', hasModificationRequest: false },
    { periodId: 'period-a', status: 'DA_CHAM', hasModificationRequest: true },
    { periodId: 'period-b', status: 'DA_CHAM', hasModificationRequest: false },
  ];

  it('counts each group status without overlap for the selected period', () => {
    expect(getSpecialistGroupProgress(groups, 'period-a')).toEqual({
      completedGroups: 1,
      pendingGroups: 1,
      revisionGroups: 3,
      unsubmittedGroups: 1,
      totalCount: 6,
    });
  });

  it('includes all periods when no period is selected', () => {
    expect(getSpecialistGroupProgress(groups, '')).toEqual({
      completedGroups: 2,
      pendingGroups: 1,
      revisionGroups: 3,
      unsubmittedGroups: 1,
      totalCount: 7,
    });
  });
});

describe('getSpecialistSubmissionPermissions', () => {
  it('uses direct approval without a forwarding dialog for the Specialist role', () => {
    expect(getSpecialistSubmissionPermissions('ReviewerApproved', 'SPECIALIST')).toMatchObject({
      canApprove: true,
      usesForwardingDialog: false,
      forwardLabel: 'Duyệt hồ sơ',
    });
  });

  it('keeps the forwarding dialog for Scorer and Reviewer roles', () => {
    expect(getSpecialistSubmissionPermissions('LocalSubmitted', 'SCORER').usesForwardingDialog).toBe(true);
    expect(getSpecialistSubmissionPermissions('ScorerSubmitted', 'REVIEWER').usesForwardingDialog).toBe(true);
  });
});
