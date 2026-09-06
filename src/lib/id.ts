/** Sinh id duy nhất — dùng crypto.randomUUID khi có, fallback timestamp+random. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Thời điểm hiện tại dạng ISO string. */
export function nowIso(): string {
  return new Date().toISOString();
}
