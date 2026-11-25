import { useState, useEffect, useMemo } from 'react';
import { daysBetween } from '@/lib/utils';

export function useCountdown(targetDate: string | Date) {
  // Key nguyên thuỷ để dep của hook ổn định qua mỗi render.
  const targetKey = typeof targetDate === 'string' ? targetDate : targetDate.getTime();

  const targetMs = useMemo(() => new Date(targetKey).getTime(), [targetKey]);

  const [daysLeft, setDaysLeft] = useState(() => daysBetween(Date.now(), targetMs));
  const [isExpired, setIsExpired] = useState(() => targetMs <= Date.now());

  useEffect(() => {
    const tick = () => {
      setDaysLeft(daysBetween(Date.now(), targetMs));
      setIsExpired(targetMs <= Date.now());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetMs]);

  return { daysLeft, isExpired };
}
