import { useState, useEffect } from 'react';
import { daysBetween } from '@/lib/utils';

export function useCountdown(targetDate: string | Date) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const [daysLeft, setDaysLeft] = useState(() => daysBetween(new Date(), target));

  useEffect(() => {
    const interval = setInterval(() => {
      setDaysLeft(daysBetween(new Date(), target));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [target]);

  const isExpired = daysLeft <= 0;

  return { daysLeft, isExpired };
}
