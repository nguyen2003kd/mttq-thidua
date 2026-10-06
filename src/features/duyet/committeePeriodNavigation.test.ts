import { describe, expect, it } from 'vitest';
import { buildCommitteePeriodUrl, isCommitteeApprovalView } from './committeePeriodNavigation';

describe('committeePeriodNavigation', () => {
  const periodId = '1161f17b-1635-4a9c-8dc7-62624f329c16';

  it('requires a period chosen from the committee entry flow', () => {
    expect(isCommitteeApprovalView(new URLSearchParams(`periodId=${periodId}`))).toBe(false);
    expect(isCommitteeApprovalView(new URLSearchParams(`view=periods&periodId=${periodId}`))).toBe(false);
    expect(isCommitteeApprovalView(new URLSearchParams(`view=committee&periodId=${periodId}`))).toBe(true);
    expect(isCommitteeApprovalView(new URLSearchParams('view=committee'))).toBe(false);
  });

  it('builds a committee route with the selected period', () => {
    expect(buildCommitteePeriodUrl('/thi-dua/duyet/ban-thuong-truc', periodId))
      .toBe(`/thi-dua/duyet/ban-thuong-truc?view=committee&periodId=${periodId}`);
  });
});
