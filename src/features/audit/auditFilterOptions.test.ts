import { describe, expect, it } from 'vitest';
import { actionLabels, auditActionFilterOptions, auditEntityFilterOptions, businessActionFilterLabels, entityLabels } from './auditFilterOptions';

describe('Lịch sử thao tác - lựa chọn bộ lọc', () => {
  it('mỗi hành động có nhãn không trùng nhau và giữ đủ mã lọc API', () => {
    const values = auditActionFilterOptions.map(({ value }) => value);
    const labels = auditActionFilterOptions.map(({ label }) => label.toLocaleLowerCase('vi-VN'));
    expect(new Set(values).size).toBe(values.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(values).toEqual(expect.arrayContaining([...Object.keys(actionLabels), ...Object.keys(businessActionFilterLabels)]));
  });

  it('phân biệt yêu cầu sửa và bổ sung tiêu chí theo cấp xử lý', () => {
    for (const prefix of ['scorer', 'reviewer', 'specialist']) {
      for (const action of ['request_revision', 'add_criteria']) {
        const option = auditActionFilterOptions.find((item) => item.value === `${prefix}_${action}`);
        expect(option?.label).toMatch(/\(.+\)/);
      }
    }
  });

  it('không trùng nhãn đối tượng và vẫn giữ đủ mã dữ liệu', () => {
    const labels = auditEntityFilterOptions.map(({ label }) => label.toLocaleLowerCase('vi-VN'));
    expect(new Set(labels).size).toBe(labels.length);
    expect(auditEntityFilterOptions.map(({ value }) => value)).toEqual(Object.keys(entityLabels));
  });
});
