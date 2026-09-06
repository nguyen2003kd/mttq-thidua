import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown (B2)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('tính số ngày còn lại và cờ hết hạn', () => {
    vi.setSystemTime(new Date('2026-01-01T08:00:00'));
    const { result } = renderHook(() => useCountdown('2026-01-31'));
    expect(result.current.daysLeft).toBe(30);
    expect(result.current.isExpired).toBe(false);
  });

  it('đích ở quá khứ → isExpired true', () => {
    vi.setSystemTime(new Date('2026-02-10T08:00:00'));
    const { result } = renderHook(() => useCountdown('2026-01-31'));
    expect(result.current.isExpired).toBe(true);
  });

  it('rerender nhiều lần cùng targetDate chỉ tạo interval một lần (dep ổn định)', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00'));
    const setSpy = vi.spyOn(globalThis, 'setInterval');
    const { rerender } = renderHook(({ d }) => useCountdown(d), {
      initialProps: { d: '2026-03-01' },
    });
    rerender({ d: '2026-03-01' });
    rerender({ d: '2026-03-01' });
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it('interval cập nhật daysLeft theo thời gian trôi', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00'));
    const { result } = renderHook(() => useCountdown('2026-01-11'));
    expect(result.current.daysLeft).toBe(10);
    act(() => {
      vi.setSystemTime(new Date('2026-01-03T00:00:00'));
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.daysLeft).toBe(8);
  });
});
