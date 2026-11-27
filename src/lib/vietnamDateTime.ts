/**
 * Thời hạn nghiệp vụ của MTTQVN được nhập/hiển thị theo giờ Việt Nam (UTC+07:00),
 * không phụ thuộc múi giờ hệ điều hành của người dùng hoặc máy chủ.
 */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const VIETNAM_OFFSET = '+07:00';
const EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/** Epoch milliseconds for an ISO timestamp; no-offset timestamps are interpreted as ICT, not UTC. */
export function parseVietnamDateTime(value?: string | null): number {
  if (!value) return Number.NaN;
  const text = value.trim();
  // Giá trị ngày thuần từ dữ liệu cũ được hiểu là hết ngày tại Việt Nam.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T23:59:00` : text;
  return Date.parse(EXPLICIT_ZONE.test(normalized) ? normalized : `${normalized}${VIETNAM_OFFSET}`);
}

/** For datetime-local inputs: display the exact instant in Asia/Ho_Chi_Minh. */
export function toVietnamDateTimeInput(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '';
  const timestamp = typeof value === 'number' ? value : parseVietnamDateTime(value);
  if (!Number.isFinite(timestamp)) return '';
  return new Date(timestamp + VIETNAM_OFFSET_MS).toISOString().slice(0, 16);
}

/** Format deadline in Vietnamese time, consistently across browsers: DD/MM/YYYY HH:mm. */
export function formatVietnamDeadline(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const input = toVietnamDateTimeInput(value instanceof Date ? value.getTime() : value);
  if (!input) return '—';
  const [date, time] = input.split('T');
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year} ${time}`;
}

/** Hiển thị hạn nộp theo giờ Việt Nam và đồng hồ 12 giờ: DD/MM/YYYY hh:mm AM/PM. */
export function formatVietnamDeadlineAmPm(value?: string | number | Date | null): string {
  const formatted = formatVietnamDeadline(value);
  if (formatted === '—') return formatted;
  const separator = formatted.lastIndexOf(' ');
  const [hours, minutes] = formatted.slice(separator + 1).split(':').map(Number);
  const hour12 = String(hours % 12 || 12).padStart(2, '0');
  return `${formatted.slice(0, separator)} ${hour12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** Attach explicit +07:00 to a datetime-local value before submitting it to DateTimeOffset APIs. */
export function toVietnamOffsetDateTime(value?: string | null): string | null {
  if (!value) return null;
  const text = value.trim();
  if (EXPLICIT_ZONE.test(text)) {
    if (!Number.isFinite(Date.parse(text))) throw new Error('Thời gian không hợp lệ.');
    return text;
  }
  if (!LOCAL_DATE_TIME.test(text)) throw new Error('Thời gian không hợp lệ.');
  const withOffset = `${text.length === 16 ? `${text}:00` : text}${VIETNAM_OFFSET}`;
  if (!Number.isFinite(Date.parse(withOffset))) throw new Error('Thời gian không hợp lệ.');
  return withOffset;
}
