import { describe, expect, it } from 'vitest';
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
