import { describe, expect, it } from 'vitest';
import {
  CRITERIA_TOTAL_MISMATCH_MESSAGE,
  EMPTY_CRITERIA_MESSAGE,
  validateCriteriaApplication,
  validateCriteriaDeadline,
} from './criteriaValidation';

describe('validateCriteriaApplication', () => {
  it('cho phép áp dụng khi tổng điểm tiêu chí con bằng tổng điểm nhóm', () => {
    expect(validateCriteriaApplication(10, [3, 3, 4])).toMatchObject({ success: true, childTotal: 10 });
  });

  it('chặn khi tổng điểm tiêu chí con nhỏ hơn tổng điểm nhóm', () => {
    expect(validateCriteriaApplication(10, [3, 3, 2])).toMatchObject({
      success: false,
      childTotal: 8,
      message: CRITERIA_TOTAL_MISMATCH_MESSAGE,
    });
  });

  it('chặn khi tổng điểm tiêu chí con lớn hơn tổng điểm nhóm', () => {
    expect(validateCriteriaApplication(10, [6, 5])).toMatchObject({
      success: false,
      childTotal: 11,
      message: CRITERIA_TOTAL_MISMATCH_MESSAGE,
    });
  });

  it('chặn nhóm chưa có tiêu chí con', () => {
    expect(validateCriteriaApplication(10, [])).toMatchObject({
      success: false,
      childTotal: 0,
      message: EMPTY_CRITERIA_MESSAGE,
    });
  });
});

describe('validateCriteriaDeadline', () => {
  const trustedNowMs = Date.parse('2026-10-01T09:00:00');

  it('requires a deadline for an applied group that has none', () => {
    expect(validateCriteriaDeadline({ deadline: '', originalDeadline: '', isApplied: true, trustedNowMs }))
      .toBe('Vui lòng chọn hạn nộp cho nhóm tiêu chí đã áp dụng.');
  });

  it('requires an applied group deadline to remain after trusted time', () => {
    expect(validateCriteriaDeadline({
      deadline: '2026-10-01T08:00',
      originalDeadline: '2026-10-01T08:00',
      isApplied: true,
      trustedNowMs,
    })).toBe('Hạn nộp phải sau thời gian chuẩn hiện tại.');
    expect(validateCriteriaDeadline({
      deadline: '2026-10-02T10:00',
      originalDeadline: '2026-10-02T10:00',
      isApplied: true,
      trustedNowMs,
    })).toBeNull();
  });

  it('keeps an optional unchanged deadline on a non-applied group', () => {
    expect(validateCriteriaDeadline({
      deadline: '2026-09-01T10:00',
      originalDeadline: '2026-09-01T10:00',
      isApplied: false,
      trustedNowMs,
    })).toBeNull();
  });
});
