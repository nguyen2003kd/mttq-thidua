import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, File as FileIcon, FileSpreadsheet, FileText, FileImage, Plus, Presentation, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';
import { FilePreviewDialog } from './FilePreviewDialog';
import { FileUpload } from './FileUpload';
import { FormDialog } from './FormDialog';
import { TruncatedText } from './TruncatedText';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { downloadFile, filesApi, getFilesApiError, type FileEntityTypeApi, type FileItemApi } from '@/features/files/api/filesApi';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useState, type FormEvent } from 'react';

export interface FileAttachmentListProps {
  entityType: FileEntityTypeApi;
  entityId: string;
  /** Ẩn nút xóa (chỉ xem + tải) */
  readOnly?: boolean;
  /** Text khi chưa có file */
  emptyText?: string;
  /** Cho phép tải thêm file từ danh sách (nút + mở dialog upload) */
  canUpload?: boolean;
  /** Nhãn nút/dialog tải thêm */
  addLabel?: string;
  /** category gắn cho file tải thêm */
  uploadCategory?: string;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileTypeIcon(file: FileItemApi) {
  const ext = (file.extension ?? file.originalName.split('.').pop() ?? '').toLowerCase().replace('.', '');
  if (file.mimeType.startsWith('image/')) return { Icon: FileImage, iconCls: 'text-primary' };
  if (ext === 'pdf') return { Icon: FileText, iconCls: 'text-destructive' };
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return { Icon: FileText, iconCls: 'text-primary' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, iconCls: 'text-success' };
  if (['ppt', 'pptx'].includes(ext)) return { Icon: Presentation, iconCls: 'text-accent' };
  return { Icon: FileIcon, iconCls: 'text-muted-foreground' };
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/**
 * Danh sách file đã upload của một đối tượng (entityType + entityId).
 * Tải file qua presigned URL mới mỗi lần (URL hết hạn sau 1h); xóa mềm có confirm.
 */
export function FileAttachmentList({ entityType, entityId, readOnly, emptyText = 'Chưa có file đính kèm', canUpload, addLabel = 'Thêm file đính kèm', uploadCategory, className }: FileAttachmentListProps) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<FileItemApi | null>(null);
  const [viewing, setViewing] = useState<FileItemApi | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const { uploading, uploadProgress, uploadFiles } = useFileUpload();

  const { data, isLoading } = useQuery({
    queryKey: ['files', entityType, entityId],
    queryFn: () => filesApi.list({ entityType, entityId, page: 1, pageSize: 50 }),
    enabled: Boolean(entityId),
  });
  const files = data?.items ?? [];

  const handleDownload = async (file: FileItemApi) => {
    try {
      await downloadFile(file.id, file.displayName || file.originalName);
    } catch (error) {
      toast.error(getFilesApiError(error));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await filesApi.remove(deleting.id);
      await queryClient.invalidateQueries({ queryKey: ['files', entityType, entityId] });
      toast.success('Đã xóa file.');
    } catch (error) {
      toast.error(getFilesApiError(error));
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pendingFiles.length === 0) return;
    try {
      await uploadFiles(pendingFiles, { entityType, entityId, category: uploadCategory });
      await queryClient.invalidateQueries({ queryKey: ['files', entityType, entityId] });
      setUploadOpen(false);
      setPendingFiles([]);
    } catch {
      // Lỗi từng file đã toast trong hook — giữ dialog mở để thử lại
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <span className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {files.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => {
            const { Icon, iconCls } = fileTypeIcon(file);
            return (
              <li
                key={file.id}
                className="group relative overflow-hidden rounded-md border border-border border-l-[3px] border-l-primary bg-card transition-colors hover:bg-surface-muted"
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className={cn('h-4.5 w-4.5', iconCls)} />
                  </span>
                  <TruncatedText value={file.displayName || file.originalName} className="flex-1 text-[13px] font-semibold text-foreground" />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-1.5">
                  <span className="truncate text-[11px] text-muted-foreground">
                    {formatSize(file.sizeBytes)} · {formatDate(file.createdAt)}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
                    <button
                      type="button"
                      aria-label={`Xem file ${file.displayName || file.originalName}`}
                      title="Xem file"
                      onClick={() => setViewing(file)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Tải file ${file.displayName || file.originalName}`}
                      title="Tải file về máy"
                      onClick={() => void handleDownload(file)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label={`Xóa file ${file.displayName || file.originalName}`}
                        title="Xóa file"
                        onClick={() => setDeleting(file)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canUpload && (
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      )}

      {canUpload && (
        <FormDialog
          open={uploadOpen}
          onOpenChange={(open) => { if (!open) { setUploadOpen(false); setPendingFiles([]); } }}
          title={addLabel}
          description="Chọn file để tải lên và gắn vào nhóm này. Có thể chọn nhiều file cùng lúc."
          submitLabel="Tải lên"
          cancelLabel="Đóng"
          submitDisabled={uploading || pendingFiles.length === 0}
          onSubmit={handleUploadSubmit}
        >
          <FileUpload value={pendingFiles} onChange={setPendingFiles} uploading={uploading} uploadProgress={uploadProgress} />
        </FormDialog>
      )}

      <FilePreviewDialog file={viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Xóa file đính kèm"
        description={`File "${deleting?.displayName || deleting?.originalName || ''}" sẽ bị xóa khỏi hệ thống.`}
        confirmLabel="Xóa file"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
