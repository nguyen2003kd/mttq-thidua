import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, FileText, Trophy } from 'lucide-react';
import { Button, FileUpload } from '@/components/core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CriteriaTableAttachment, Locality, ScoreRecord } from '@/types/domain';

export interface PublishResultValue {
  attachments: CriteriaTableAttachment[];
  comment: string;
}

interface PublishResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locality?: Locality;
  record?: ScoreRecord;
  onPublish: (value: PublishResultValue) => void;
}

/**
 * COL.01.11 — Công bố là hành động cuối cùng nên tách rõ hai bước:
 * nhập thông tin kèm kết quả, sau đó xác nhận không thể hoàn tác.
 */
export function PublishResultModal({ open, onOpenChange, locality, record, onPublish }: PublishResultModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [error, setError] = useState('');

  const reset = () => {
    setFile(null);
    setComment('');
    setStep('details');
    setError('');
  };

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open]);

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const continueToConfirmation = (event: FormEvent) => {
    event.preventDefault();
    if (file && file.size > 20 * 1024 * 1024) {
      setError('Tập tin đính kèm không được vượt quá 20MB.');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const confirmPublish = (event: FormEvent) => {
    event.preventDefault();
    onPublish({
      attachments: file ? [{ id: `decision-${Date.now()}`, fileName: file.name, fileSize: file.size }] : [],
      comment: comment.trim(),
    });
    close();
  };

  const announcement = comment.trim() || 'Không có nhận xét kèm theo.';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0">
        {step === 'details' ? (
          <form onSubmit={continueToConfirmation} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 border-b bg-muted/25 px-6 py-5 pr-12">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle>Công bố kết quả</DialogTitle>
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-foreground">Bước 1/2</span>
              </div>
              <DialogDescription>
                Bổ sung nhận xét hoặc quyết định nếu có trước khi xác nhận công bố chính thức.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Địa phương</p>
                  <p className="mt-1 font-semibold">{locality?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tổng điểm chính thức</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-primary">{record?.totalScore ?? 0}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="publication-comment">Nhận xét đính kèm kết quả cho địa phương</Label>
                <Textarea
                  id="publication-comment"
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Ví dụ: Chúc mừng địa phương hoàn thành tốt các chỉ tiêu thi đua năm 2026."
                />
                <p className="text-xs text-muted-foreground">Không bắt buộc.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><FileText className="size-4 text-primary" />Đính kèm quyết định</Label>
                <FileUpload
                  value={file ? [file] : []}
                  onChange={(files) => { setFile(files[0] ?? null); setError(''); }}
                  multiple={false}
                  accept=".pdf,.doc,.docx"
                  maxSizeMb={20}
                  error={error || undefined}
                />
                <p className="text-xs text-muted-foreground">Không bắt buộc. Mỗi file tối đa 20MB.</p>
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-b-[8px] px-6 py-4">
              <Button type="button" variant="outline" onClick={close}>Đóng</Button>
              <Button type="submit" className="bg-accent text-foreground hover:bg-accent/90">
                Tiếp tục xác nhận
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={confirmPublish} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 border-b bg-muted/25 px-6 py-5 pr-12">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle>Xác nhận công bố kết quả</DialogTitle>
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-foreground">Bước 2/2</span>
              </div>
              <DialogDescription>Vui lòng kiểm tra lần cuối trước khi công bố.</DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="flex gap-3 rounded-lg border border-warning/45 bg-warning/10 p-4">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Thao tác này không thể hoàn tác</p>
                  <p className="text-sm text-muted-foreground">
                    Hồ sơ của {locality?.name ?? 'địa phương'} sẽ được công bố, chuyển sang chỉ xem và không thể sửa lại.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Địa phương</span><span className="font-semibold text-right">{locality?.name ?? '—'}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Tổng điểm công bố</span><span className="font-semibold tabular-nums text-primary">{record?.totalScore ?? 0}</span></div>
                <div className="space-y-1 border-t pt-3"><span className="text-muted-foreground">Nhận xét</span><p className="leading-5">{announcement}</p></div>
                <div className="flex items-center justify-between gap-4 border-t pt-3"><span className="text-muted-foreground">Quyết định đính kèm</span><span className="max-w-[60%] truncate font-medium text-right">{file?.name ?? 'Không đính kèm'}</span></div>
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-b-[8px] px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setStep('details')}>Quay lại</Button>
              <Button type="submit" className="bg-accent text-foreground hover:bg-accent/90" action="publish" state="CHO_DUYET_BTT">
                <Trophy className="size-4" />Xác nhận công bố
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
