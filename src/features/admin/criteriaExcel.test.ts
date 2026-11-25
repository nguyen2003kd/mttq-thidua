import { describe, expect, it } from 'vitest';
import { parseCriteriaExcelRows } from './criteriaExcel';

describe('Excel criteria deadlines in Vietnam time', () => {
  it('preserves the entered Vietnam wall-clock time with an explicit UTC+7 offset', () => {
    const result = parseCriteriaExcelRows([
      ['Nội dung', 'Điểm chuẩn', 'Ghi chú', 'Hạn nộp'],
      ['Nhóm kiểm thử', 10, '', '2030-11-26 17:00'],
      ['Tiêu chí kiểm thử', 10, '', '2030-11-26 16:00'],
    ]);

    expect(result.deadline).toBe('2030-11-26T17:00:00+07:00');
    expect(result.criteria[0].deadline).toBe('2030-11-26T16:00:00+07:00');
    expect(new Date(result.deadline!).toISOString()).toBe('2030-11-26T10:00:00.000Z');
  });
});
