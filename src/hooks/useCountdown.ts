import { useState, useEffect, useMemo } from 'react';
import { daysBetween } from '@/lib/utils';

export function useCountdown(targetDate: string | Date) {
  // Key nguyên thuỷ để dep của hook ổn định qua mỗi render.
  const targetKey = typeof targetDate === 'string' ? targetDate : targetDate.getTime();

  const targetMs = useMemo(() => new Date(targetKey).getTime(), [targetKey]);

  const [daysLeft, setDaysLeft] = useState(() => daysBetween(Date.now(), targetMs));

  useEffect(() => {
    const tick = () => setDaysLeft(daysBetween(Date.now(), targetMs));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetMs]);

  const isExpired = daysLeft <= 0;

  return { daysLeft, isExpired };
}
