import { describe, it, expect } from 'vitest';
import { cn, daysBetween, formatDate, formatDateTime } from './utils';

describe('formatDate / formatDateTime (locale vi-VN)', () => {
  it('formatDate → dd/mm/yyyy', () => {
    expect(formatDate('2026-03-09')).toBe('09/03/2026');
  });
  it('formatDate nhận Date', () => {
    expect(formatDate(new Date('2026-12-31T10:00:00'))).toBe('31/12/2026');
  });
  it('formatDateTime chứa ngày và giờ', () => {
    const s = formatDateTime('2026-03-09T14:30:00');
    expect(s).toContain('09/03/2026');
    expect(s).toMatch(/14[:h]?30|2:30/);
  });
});

describe('cn', () => {
  it('bỏ giá trị falsy', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });
  it('merge tailwind — class sau thắng', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('daysBetween (B3)', () => {
  it('30 ngày trọn', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
  });
  it('cùng ngày khác giờ → 0', () => {
    expect(daysBetween('2026-06-15T01:00:00', '2026-06-15T23:30:00')).toBe(0);
  });
  it('đích ở quá khứ → số âm', () => {
    expect(daysBetween('2026-06-15', '2026-06-10')).toBe(-5);
  });
  it('qua năm nhuận 2024-02-28 → 2024-03-01 = 2', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });
  it('nhận number (epoch ms)', () => {
    const a = new Date('2026-01-01').getTime();
    const b = new Date('2026-01-08').getTime();
    expect(daysBetween(a, b)).toBe(7);
  });
});
