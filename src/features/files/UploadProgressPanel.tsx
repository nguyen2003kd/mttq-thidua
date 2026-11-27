import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileImage,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { useUploadProgressStore, type UploadQueueItem } from './uploadProgressStore';

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  const Icon = ['xlsx', 'xls', 'csv'].includes(ext ?? '')
    ? FileSpreadsheet
    : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext ?? '')
      ? FileImage
      : FileText;
  return <Icon className="h-[18px] w-[18px] text-slate-500" aria-hidden="true" />;
}

function StatusIcon({ item }: { item: UploadQueueItem }) {
  switch (item.status) {
    case 'success':
      return <CheckCircle2 className="size-5 text-emerald-600" aria-label="Thành công" />;
    case 'error':
      return <XCircle className="size-5 text-red-600" aria-label="Thất bại" />;
    case 'unknown':
      return <AlertTriangle className="size-5 text-amber-600" aria-label="Cần kiểm tra" />;
    case 'uploading':
      return <LoaderCircle className="size-5 animate-spin text-sky-600" aria-label="Đang tải" />;
    default:
      return <Clock3 className="size-5 text-slate-400" aria-label="Đang chờ" />;
  }
}

function statusLabel(item: UploadQueueItem): string {
  switch (item.status) {
    case 'success': return 'Đã tải lên';
    case 'error': return 'Tải lên thất bại';
    case 'unknown': return 'Cần kiểm tra kết quả';
    case 'uploading': return item.source === 'bulk'
      ? 'Đang xử lý (' + item.progress + '%)'
      : 'Đang tải lên ' + item.progress + '%';
    default: return 'Đang chờ tải lên';
  }
}

export function UploadProgressPanel() {
  const items = useUploadProgressStore((state) => state.items);
  const visible = useUploadProgressStore((state) => state.visible);
  const minimized = useUploadProgressStore((state) => state.minimized);
  const toggleMinimized = useUploadProgressStore((state) => state.toggleMinimized);
  const dismiss = useUploadProgressStore((state) => state.dismiss);
  const clearFinished = useUploadProgressStore((state) => state.clearFinished);

  if (!visible || items.length === 0) return null;

  const total = items.length;
  const succeeded = items.filter((item) => item.status === 'success').length;
  const failed = items.filter((item) => item.status === 'error').length;
  const unknown = items.filter((item) => item.status === 'unknown').length;
  const active = items.some((item) => item.status === 'queued' || item.status === 'uploading');
  const completed = succeeded + failed + unknown;
  const progress = Math.round(items.reduce((sum, item) => {
    if (item.status === 'success' || item.status === 'error' || item.status === 'unknown') {
      return sum + 100;
    }
    return sum + item.progress;
  }, 0) / total);

  const summary = active
    ? 'Đang xử lý ' + completed + '/' + total + ' file'
    : succeeded === total
      ? 'Đã tải lên thành công ' + total + '/' + total + ' file'
      : 'Đã xử lý ' + total + ' file';

  if (minimized) {
    return (
      <div className="pointer-events-none fixed bottom-4 right-3 z-[90] sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={toggleMinimized}
          className="pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_10px_36px_rgba(15,35,55,0.2)] transition-colors hover:bg-slate-50"
          aria-label={'Mở bảng tiến trình tải file. ' + summary}
        >
          <UploadCloud className="size-5 text-sky-700" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-800">{summary}</span>
            <span className="block text-xs text-slate-500">
              {failed > 0 ? failed + ' lỗi · ' : ''}
              {unknown > 0 ? unknown + ' cần kiểm tra · ' : ''}
              Nhấn để xem chi tiết
            </span>
          </span>
          <ChevronUp className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[90] w-[calc(100vw-1.5rem)] sm:bottom-6 sm:right-6 sm:w-[400px]">
      <section
        aria-label="Tiến trình tải file"
        className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_50px_rgba(15,35,55,0.2)]"
      >
        <div className="border-b border-slate-100 px-4 pb-3 pt-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
              <UploadCloud className="size-5 text-sky-700" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900">Tiến trình tải file</h2>
              <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">{summary}</p>
            </div>
            <button
              type="button"
              onClick={toggleMinimized}
              aria-label="Thu gọn bảng tiến trình tải file"
              title="Thu gọn"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <ChevronDown className="size-4" />
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label={active ? 'Thu gọn trong khi đang tải' : 'Đóng bảng tiến trình tải file'}
              title={active ? 'Thu gọn khi đang tải' : 'Đóng'}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <X className="size-4" />
            </button>
          </div>
          <div
            role="progressbar"
            aria-label="Tiến độ hoàn thành lượt tải file"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div className="h-full rounded-full bg-sky-600 transition-[width] duration-300" style={{ width: progress + '%' }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="font-medium text-emerald-700">{succeeded} thành công</span>
            {failed > 0 && <span className="font-medium text-red-700">{failed} thất bại</span>}
            {unknown > 0 && <span className="font-medium text-amber-700">{unknown} cần kiểm tra</span>}
            {active && <span className="text-slate-500">{total - completed} đang xử lý</span>}
          </div>
        </div>

        <ul className="max-h-[min(330px,48dvh)] divide-y divide-slate-100 overflow-y-auto overscroll-contain">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2.5 px-4 py-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <FileTypeIcon name={item.name} />
              </span>
              <div className="min-w-0 flex-1">
                <p title={item.name} className="truncate text-[13px] font-semibold leading-5 text-slate-800">{item.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px]">
                  <span className="text-slate-500">{formatSize(item.size)}</span>
                  <span className={
                    item.status === 'success' ? 'font-medium text-emerald-700'
                      : item.status === 'error' ? 'font-medium text-red-700'
                        : item.status === 'unknown' ? 'font-medium text-amber-700'
                          : 'text-slate-500'
                  }>
                    {statusLabel(item)}
                  </span>
                </div>
                {item.status === 'uploading' && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-500 transition-[width] duration-300" style={{ width: item.progress + '%' }} />
                  </div>
                )}
                {item.error && (
                  <p title={item.error} className="mt-1 line-clamp-2 break-words text-[11px] leading-4 text-slate-500">
                    {item.error}
                  </p>
                )}
              </div>
              <span className="mt-1 shrink-0"><StatusIcon item={item} /></span>
            </li>
          ))}
        </ul>

        <div className="flex min-h-12 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2">
          <span className="text-[11px] text-slate-500">
            {active ? 'Vui lòng kiểm tra lại tệp tin sau khi hoàn tất' : 'Đã hoàn tất lượt tải lên.'}
          </span>
          <button
            type="button"
            onClick={clearFinished}
            disabled={active}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Xóa lịch sử
          </button>
        </div>
      </section>
    </div>
  );
}
