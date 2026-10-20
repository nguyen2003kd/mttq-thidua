import { describe, expect, it } from 'vitest';
import { buildCouncilPeriodUrl, isCouncilApprovalView } from './councilPeriodNavigation';

describe('councilPeriodNavigation', () => {
  const periodId = '1161f17b-1635-4a9c-8dc7-62624f329c16';

  it('requires a period chosen from the council entry flow', () => {
    expect(isCouncilApprovalView(new URLSearchParams(`periodId=${periodId}`))).toBe(false);
    expect(isCouncilApprovalView(new URLSearchParams(`view=periods&periodId=${periodId}`))).toBe(false);
    expect(isCouncilApprovalView(new URLSearchParams(`view=council&periodId=${periodId}`))).toBe(true);
    expect(isCouncilApprovalView(new URLSearchParams('view=council'))).toBe(false);
  });

  it('builds a council route with the selected period', () => {
    expect(buildCouncilPeriodUrl('/thi-dua/duyet/hoi-dong-tdkt', periodId))
      .toBe(`/thi-dua/duyet/hoi-dong-tdkt?view=council&periodId=${periodId}`);
  });
});
