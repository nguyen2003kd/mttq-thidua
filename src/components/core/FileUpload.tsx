import { useRef, useState } from 'react';
import { AlertTriangle, File as FileIcon, FileSpreadsheet, FileText, FileImage, Presentation, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TruncatedText } from './TruncatedText';

export interface FileUploadProps {
  /** Danh sách file đang chọn (controlled) */
  value: File[];
  onChange: (files: File[]) => void;
  /** Cho phép chọn nhiều file 1 lần (mặc định: bật) */
  multiple?: boolean;
  /** attr accept của input, vd ".pdf,.docx,image/*" */
  accept?: string;
  /** Giới hạn dung lượng 1 file (MB) */
  maxSizeMb?: number;
  /** Số file tối đa khi multiple */
  maxFiles?: number;
  disabled?: boolean;
  /** Đang upload (khóa nút xóa) */
  uploading?: boolean;
  /** Progress theo tên file (0-100) — hàng có entry sẽ hiện thanh đỏ chạy từ trái qua phải */
  uploadProgress?: Record<string, number>;
  /** Lỗi cấp form, hiện dòng danger dưới dropzone */
  error?: string | null;
  className?: string;
}

interface FileRow {
  file: File;
  Icon: typeof FileIcon;
  iconCls: string;
  error?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileTypeIcon(name: string, mimeType: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (mimeType.startsWith('image/')) return { Icon: FileImage, iconCls: 'text-primary' };
  if (ext === 'pdf') return { Icon: FileText, iconCls: 'text-destructive' };
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return { Icon: FileText, iconCls: 'text-primary' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, iconCls: 'text-success' };
  if (['ppt', 'pptx'].includes(ext)) return { Icon: Presentation, iconCls: 'text-accent' };
  return { Icon: FileIcon, iconCls: 'text-muted-foreground' };
}

/**
 * File Upload (A4.2): khung viền đứt nét, kéo-thả/click, chọn nhiều file 1 lần.
 * Hiện tên + dung lượng sau khi chọn, cảnh báo rõ nếu vượt giới hạn.
 * Component chỉ quản lý việc CHỌN file — việc upload do parent điều khiển qua useFileUpload.
 */
export function FileUpload({
  value = [],
  onChange,
  multiple = true,
  accept,
  maxSizeMb = 20,
  maxFiles = 10,
  disabled,
  uploading,
  uploadProgress,
  error,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const rows: FileRow[] = value.map((file) => ({
    file,
    ...fileTypeIcon(file.name, file.type),
    error: file.size > maxSizeMb * 1024 * 1024 ? `Vượt quá ${maxSizeMb}MB` : undefined,
  }));

  const pick = (incoming: FileList | null) => {
    if (!incoming?.length || disabled || uploading) return;
    const matchesAccept = (file: File) => {
      if (!accept) return true;
      return accept.split(',').some((token) => {
        const rule = token.trim().toLowerCase();
        if (!rule) return false;
        if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule);
        if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
        return file.type.toLowerCase() === rule;
      });
    };
    const room = multiple ? Math.max(0, maxFiles - value.length) : Math.max(0, 1 - value.length);
    const accepted = Array.from(incoming)
      .filter(matchesAccept)
      .slice(0, room)
      .filter((file) => !value.some((existing) => existing.name === file.name && existing.size === file.size));
    if (accepted.length > 0) onChange?.([...value, ...accepted]);
  };

  const removeAt = (index: number) => {
    if (disabled || uploading) return;
    onChange?.(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('min-w-0 max-w-full', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Vùng tải lên file đính kèm"
        onClick={() => { if (!disabled && !uploading) inputRef.current?.click(); }}
        onKeyDown={(event) => {
          if (!disabled && !uploading && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (disabled || uploading) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!disabled && !uploading) pick(event.dataTransfer.files);
        }}
        className={cn(
          'flex w-full min-w-0 max-w-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-dashed px-4 py-5 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-surface-muted',
          (disabled || uploading) && 'cursor-not-allowed opacity-60',
        )}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <p className="max-w-full break-words text-[13px] text-foreground">
          Kéo thả file vào đây hoặc <span className="font-medium text-primary">bấm để chọn</span>
        </p>
        <p className="max-w-full break-words text-xs text-muted-foreground">
          {multiple ? `Tối đa ${maxFiles} file, ` : ''}mỗi file tối đa {maxSizeMb}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          disabled={disabled || uploading}
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {value.length > 0 && (
        <ul className="mt-2 min-w-0 max-w-full space-y-1.5">
          {rows.map((row, index) => {
            const percent = uploadProgress?.[row.file.name];
            return (
              <li
                key={`${row.file.name}-${index}`}
                className={cn(
                  'relative flex min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-md border px-2.5 py-2',
                  row.error ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                  <row.Icon className={cn('h-4 w-4', row.error ? 'text-destructive' : row.iconCls)} />
                </span>
                <span className="min-w-0 flex-1">
                  <TruncatedText value={row.file.name} className="max-w-full text-[13px] font-medium text-foreground" />
                  <span className="block text-xs text-muted-foreground">
                    {formatSize(row.file.size)}
                    {row.error && <span className="text-destructive"> · {row.error}</span>}
                  </span>
                </span>
                {percent !== undefined && (
                  <span className="shrink-0 text-xs font-medium text-primary tabular-nums">{percent}%</span>
                )}
                <button
                  type="button"
                  disabled={disabled || uploading}
                  aria-label={`Xóa file ${row.file.name}`}
                  onClick={() => removeAt(index)}
                  className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {percent !== undefined && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-[3px] bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
