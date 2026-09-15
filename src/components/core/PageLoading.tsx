import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
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
        'flex items-center justify-center bg-background',
        overlay
          ? 'fixed inset-x-0 bottom-0 top-14 z-40 bg-background/80 backdrop-blur-[2px]'
          : 'min-h-[240px] w-full',
        className,
      )}
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

/** Hiển thị khi một query đang tải dữ liệu lần đầu; không che màn hình lúc refetch nền. */
export function GlobalApiLoading() {
  const initialFetchingCount = useIsFetching({
    predicate: (query) => query.state.fetchStatus === 'fetching' && query.state.data === undefined,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (initialFetchingCount === 0) {
      setVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, [initialFetchingCount]);

  return visible ? <PageLoading overlay /> : null;
}
