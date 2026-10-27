import { describe, expect, it } from 'vitest';
import {
  actionLabels,
  auditActionFilterLabels,
  auditActionFilterOptions,
  auditEntityFilterOptions,
  entityLabels,
} from './auditFilterOptions';

describe('Lịch sử thao tác - lựa chọn bộ lọc', () => {
  it('không có mã hoặc nhãn hành động trùng lặp', () => {
    const values = auditActionFilterOptions.map(({ value }) => value);
    const labels = auditActionFilterOptions.map(({ label }) => label.toLocaleLowerCase('vi-VN'));
    expect(new Set(values).size).toBe(values.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(auditActionFilterLabels).toEqual(
      Object.fromEntries(auditActionFilterOptions.map(({ value, label }) => [value, label])),
    );
    expect(values).toEqual(expect.arrayContaining(Object.keys(actionLabels).map((key) => key.toLowerCase())));
  });

  it('yêu cầu sửa và bổ sung tiêu chí chỉ có một lựa chọn cho mỗi nhóm', () => {
    for (const code of ['request_revision', 'add_criteria']) {
      expect(auditActionFilterOptions.filter(({ value }) => value === code)).toHaveLength(1);
      expect(auditActionFilterOptions.filter(({ value }) => value.endsWith(`_${code}`))).toHaveLength(0);
    }
  });

  it('không trùng nhãn đối tượng và vẫn giữ đủ mã dữ liệu', () => {
    const labels = auditEntityFilterOptions.map(({ label }) => label.toLocaleLowerCase('vi-VN'));
    const values = auditEntityFilterOptions.map(({ value }) => value);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toEqual(Object.keys(entityLabels));
  });
});
