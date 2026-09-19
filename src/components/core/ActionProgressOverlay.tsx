import { useEffect, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import {
  getActionProgressSnapshot,
  subscribeActionProgress,
} from '@/lib/action-progress';

/** Hiển thị tiến trình trực quan cho mọi thao tác lưu/gửi dữ liệu. */
export function ActionProgressOverlay() {
  const { activeCount, label } = useSyncExternalStore(
    subscribeActionProgress,
    getActionProgressSnapshot,
    getActionProgressSnapshot,
  );
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (activeCount === 0) {
      if (!visible) return undefined;
      // Một nút Lưu/Gửi có thể thực hiện nhiều API liên tiếp (lưu điểm → upload
      // file → gửi hồ sơ). Chờ ngắn trước khi hiển thị 100% để request kế tiếp
      // không làm thanh tiến trình “hoàn tất” sai giữa chừng.
      const completeTimer = window.setTimeout(() => {
        setProgress(100);
        setCompleted(true);
      }, 700);
      const hideTimer = window.setTimeout(() => {
        setVisible(false);
        setCompleted(false);
        setProgress(0);
      }, 1_120);
      return () => {
        window.clearTimeout(completeTimer);
        window.clearTimeout(hideTimer);
      };
    }

    setCompleted(false);
    const showTimer = window.setTimeout(() => {
      setVisible(true);
      setProgress((current) => Math.max(current, 8));
    }, 140);
    const progressTimer = window.setInterval(() => {
      setProgress((current) => current >= 92 ? current : Math.min(92, current + Math.max(2, Math.ceil((92 - current) / 7))));
    }, 220);

    return () => {
      window.clearTimeout(showTimer);
      window.clearInterval(progressTimer);
    };
  }, [activeCount, visible]);

  if (!visible) return null;

  const displayLabel = completed ? 'Hoàn tất, đang cập nhật dữ liệu…' : label || 'Đang xử lý dữ liệu…';
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/25 px-4 backdrop-blur-[1px]" role="status" aria-live="assertive" aria-label={displayLabel}>
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl" aria-label="Tiến trình xử lý">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {completed ? <CheckCircle2 className="size-5 text-success" /> : <LoaderCircle className="size-5 animate-spin" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{displayLabel}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Vui lòng không đóng trang trong khi hệ thống lưu và gửi dữ liệu.</p>
          </div>
          {!completed && <Send className="mt-1 size-4 text-primary" aria-hidden="true" />}
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`${progress}% hoàn tất`}>
          <div className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-right text-xs font-semibold tabular-nums text-primary">{progress}%</p>
      </section>
    </div>
  );
}
