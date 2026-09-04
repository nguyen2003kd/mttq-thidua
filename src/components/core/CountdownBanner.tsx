import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import { CalendarClock } from 'lucide-react';

interface CountdownBannerProps {
  deadline: string | Date;
  label?: string;
  className?: string;
}

export function CountdownBanner({ deadline, label = 'Thời hạn còn lại', className }: CountdownBannerProps) {
  const { daysLeft, isExpired } = useCountdown(deadline);

  const urgency =
    isExpired ? 'expired' :
    daysLeft <= 7 ? 'critical' :
    daysLeft <= 30 ? 'warning' : 'normal';

  const styles = {
    normal: 'bg-primary/5 border-primary/20 text-primary',
    warning: 'bg-warning/5 border-warning/20 text-warning',
    critical: 'bg-destructive/5 border-destructive/20 text-destructive',
    expired: 'bg-muted border-border text-muted-foreground',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border px-4 py-3',
      styles[urgency],
      className,
    )}>
      <CalendarClock className="h-5 w-5 shrink-0" />
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{label}:</span>
        <span className="text-lg font-bold tabular-nums">
          {!isExpired ? `${daysLeft} ngày` : 'Đã hết hạn'}
        </span>
      </div>
    </div>
  );
}
