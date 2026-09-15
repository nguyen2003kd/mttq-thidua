import { z } from 'zod';

export const EMPTY_CRITERIA_MESSAGE = 'Cần có ít nhất một tiêu chí trước khi áp dụng.';
export const CRITERIA_TOTAL_MISMATCH_MESSAGE =
  'Tổng điểm tiêu chí con không khớp với tổng điểm nhóm tiêu chí. Vui lòng kiểm tra lại';

const toScoreUnit = (value: number) => Math.round(value * 100);

export const criteriaApplicationSchema = z
  .object({
    groupMaxPoint: z.number().finite().positive(),
    childMaxPoints: z.array(z.number().finite().nonnegative()).min(1, EMPTY_CRITERIA_MESSAGE),
  })
  .superRefine(({ groupMaxPoint, childMaxPoints }, context) => {
    const childTotal = childMaxPoints.reduce((total, point) => total + point, 0);
    if (toScoreUnit(childTotal) !== toScoreUnit(groupMaxPoint)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['childMaxPoints'],
        message: CRITERIA_TOTAL_MISMATCH_MESSAGE,
      });
    }
  });

export function validateCriteriaApplication(groupMaxPoint: number, childMaxPoints: number[]) {
  const childTotal = childMaxPoints.reduce((total, point) => total + point, 0);
  const result = criteriaApplicationSchema.safeParse({ groupMaxPoint, childMaxPoints });

  return {
    success: result.success,
    childTotal,
    message: result.success ? null : result.error.issues[0]?.message ?? CRITERIA_TOTAL_MISMATCH_MESSAGE,
  };
}
