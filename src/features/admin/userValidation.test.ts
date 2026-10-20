import { describe, expect, it } from 'vitest';
import { isValidVietnamesePhoneNumber } from './userValidation';

describe('isValidVietnamesePhoneNumber', () => {
  it('accepts a 10-digit phone number starting with 0', () => {
    expect(isValidVietnamesePhoneNumber('0901234567')).toBe(true);
  });

  it.each([
    'a090000',
    '090123456',
    '09012345678',
    '1901234567',
    '090 1234567',
    '090-123-4567',
    '0901234567\n',
  ])('rejects %s', (value) => {
    expect(isValidVietnamesePhoneNumber(value)).toBe(false);
  });
});
