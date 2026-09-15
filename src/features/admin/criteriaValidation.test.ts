import { describe, expect, it } from 'vitest';
import {
  CRITERIA_TOTAL_MISMATCH_MESSAGE,
  EMPTY_CRITERIA_MESSAGE,
  validateCriteriaApplication,
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
