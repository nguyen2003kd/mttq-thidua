import { describe, expect, it } from 'vitest';
import { formatVietnamDeadline, parseVietnamDateTime, toVietnamDateTimeInput, toVietnamOffsetDateTime } from './vietnamDateTime';

describe('Vietnam deadline timezone', () => {
  it('parses TimeAPI local datetime (no offset) as UTC+7, not UTC', () => {
    expect(parseVietnamDateTime('2026-11-26T17:00:00')).toBe(Date.parse('2026-11-26T10:00:00Z'));
  });

  it('respects an explicit offset and returns correct ICT input value', () => {
    expect(parseVietnamDateTime('2026-11-26T17:00:00+07:00')).toBe(Date.parse('2026-11-26T10:00:00Z'));
    expect(toVietnamDateTimeInput('2026-11-26T10:00:00Z')).toBe('2026-11-26T17:00');
  });

  it('sends datetime-local with an explicit offset and preserves the selected instant', () => {
    expect(toVietnamOffsetDateTime('2026-11-26T17:00')).toBe('2026-11-26T17:00:00+07:00');
    expect(parseVietnamDateTime(toVietnamOffsetDateTime('2026-11-26T17:00'))).toBe(Date.parse('2026-11-26T10:00:00Z'));
  });

  it('handles day boundary without shifting the effective calendar date', () => {
    expect(toVietnamDateTimeInput('2026-11-25T17:00:00Z')).toBe('2026-11-26T00:00');
    expect(toVietnamOffsetDateTime('2026-11-26T23:59')).toBe('2026-11-26T23:59:00+07:00');
  });

  it('preserves the legacy date-only end-of-day behavior', () => {
    expect(toVietnamDateTimeInput('2026-11-26')).toBe('2026-11-26T23:59');
  });

  it('renders full deadline with Vietnam date and time for UTC and ICT inputs', () => {
    expect(formatVietnamDeadline('2026-11-26T10:00:00Z')).toBe('26/11/2026 17:00');
    expect(formatVietnamDeadline('2026-11-26T17:00:00+07:00')).toBe('26/11/2026 17:00');
  });

  it('renders midnight boundary and date-only deadlines in Vietnam time', () => {
    expect(formatVietnamDeadline('2026-11-25T17:00:00Z')).toBe('26/11/2026 00:00');
    expect(formatVietnamDeadline('2026-11-26')).toBe('26/11/2026 23:59');
    expect(formatVietnamDeadline(null)).toBe('—');
  });

  it('does not depend on browser timezone for input conversion', () => {
    expect(toVietnamDateTimeInput(Date.parse('2026-11-26T10:00:00Z'))).toBe('2026-11-26T17:00');
  });
});
