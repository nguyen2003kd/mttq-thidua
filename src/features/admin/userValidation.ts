/** Số điện thoại Việt Nam: đúng 10 chữ số, bắt đầu bằng 0. */
export function isValidVietnamesePhoneNumber(value: string): boolean {
  return value.length === 10 && /^0[0-9]{9}$/.test(value);
}
