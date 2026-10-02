import { describe, expect, it } from 'vitest';
import { getSpecialistGroupProgress } from '../utils/specialistGroupProgress';

describe('getSpecialistGroupProgress', () => {
  const groups = [
    { periodId: 'period-a', status: 'DA_CHAM', hasModificationRequest: false },
    { periodId: 'period-a', status: 'CHO_CHAM', hasModificationRequest: true },
    { periodId: 'period-b', status: 'DA_CHAM', hasModificationRequest: false },
  ];

  it('counts completion, revision and total only for the selected period', () => {
    expect(getSpecialistGroupProgress(groups, 'period-a')).toEqual({
      completedGroups: 1,
      revisionGroups: 1,
      totalCount: 2,
    });
  });

  it('includes all periods when no period is selected', () => {
    expect(getSpecialistGroupProgress(groups, '')).toEqual({
      completedGroups: 2,
      revisionGroups: 1,
      totalCount: 3,
    });
  });
});
