import { useEffect, useState } from 'react';
import { File as FileIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './Button';
import { downloadFile, getFilePreviewUrl, type FileItemApi } from '@/features/files/api/filesApi';

export interface FilePreviewDialogProps {
  /** File cần xem — null = đóng */
  file: FileItemApi | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal xem file (dùng Dialog core): ảnh hiển thị trực tiếp, PDF nhúng iframe,
 * loại khác hiển thị thông tin + nút tải xuống. Presigned URL fetch mới mỗi lần mở (hạn 1h).
 */
export function FilePreviewDialog({ file, onOpenChange }: FilePreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setUrl(null);
    getFilePreviewUrl(file.id)
      .then(setUrl)
      .catch((error) => {
        if (!cancelled) {
          console.warn('Không lấy được đường dẫn xem file:', error);
          onOpenChange(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onOpenChange ổn định theo caller
  }, [file]);

  const isImage = !!file?.mimeType.startsWith('image/');
  const officeExt = (file?.extension ?? '').toLowerCase().replace('.', '');
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(officeExt);

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle className="truncate">{file?.displayName || file?.originalName}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-[240px] items-center justify-center bg-surface-muted p-4">
          {!file || !url ? (
            <div className="flex w-full flex-col items-center gap-2 py-10">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Đang mở file…</p>
            </div>
          ) : isImage ? (
            <img src={url} alt={file.displayName || file.originalName} className="max-h-[70dvh] w-auto max-w-full rounded-md object-contain" />
          ) : file.mimeType === 'application/pdf' || (file.extension ?? '').toLowerCase() === '.pdf' ? (
            <iframe src={url} title={file.displayName || file.originalName} className="h-[70vh] w-full rounded-md border-0 bg-white" />
          ) : isOfficeDoc ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              title={file.displayName || file.originalName}
              className="h-[70vh] w-full rounded-md border-0 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileIcon className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Không xem trước được định dạng này. Hãy tải file về máy.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-muted/50 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button
            type="button"
            disabled={!file}
            onClick={() => { if (file) void downloadFile(file.id, file.displayName || file.originalName); }}
          >
            Tải xuống
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
