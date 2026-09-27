import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageLoadingProps {
  label?: string;
  overlay?: boolean;
  className?: string;
}

export function PageLoading({
  label = 'Đang tải dữ liệu…',
  overlay = false,
  className,
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        'fade-in flex items-center justify-center bg-background',
        overlay
          ? 'fixed inset-x-0 bottom-0 top-14 z-40 bg-background/80 backdrop-blur-[2px]'
          : 'h-full min-h-[calc(100dvh-8rem)] w-full',
        className,
      )}
      style={{ animationDelay: '150ms', animationFillMode: 'both' }}
    >
      <div className="flex min-w-48 flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-5">
        <span className="relative flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
        </span>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    </div>
  );
}
