import { describe, expect, it } from 'vitest';
import { buildScoreEntryUrl, isScoreEntryView } from './scoreEntryNavigation';

describe('scoreEntryNavigation', () => {
  const periodId = '1161f17b-1635-4a9c-8dc7-62624f329c16';

  it('requires an explicit selected-period view before showing scores', () => {
    expect(isScoreEntryView(new URLSearchParams(`groupPeriodFilter=${periodId}`))).toBe(false);
    expect(isScoreEntryView(new URLSearchParams(`view=periods&groupPeriodFilter=${periodId}`))).toBe(false);
    expect(isScoreEntryView(new URLSearchParams(`view=score&groupPeriodFilter=${periodId}`))).toBe(true);
    expect(isScoreEntryView(new URLSearchParams('view=score'))).toBe(false);
  });

  it('builds a score route with the chosen period explicitly marked', () => {
    expect(buildScoreEntryUrl('/thi-dua/cham-diem', periodId))
      .toBe(`/thi-dua/cham-diem?view=score&groupPeriodFilter=${periodId}`);
  });
});
