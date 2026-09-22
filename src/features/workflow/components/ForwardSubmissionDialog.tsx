import { useEffect, useState, type FormEvent } from 'react';
import { FileCheck2, Paperclip } from 'lucide-react';
import { FormDialog, FileUpload, TruncatedText } from '@/components/core';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ForwardSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName?: string;
  groupName?: string;
  /** Cấp nhận hồ sơ; mặc định giữ nguyên luồng Chuyên viên → Lãnh đạo ban. */
  targetLabel?: string;
  /** Nhãn trường diễn giải theo ngữ cảnh cấp duyệt. */
  explanationLabel?: string;
  onConfirm: (data: { explanation: string; files: File[]; onProgress: (percent: number) => void }) => void | Promise<void>;
}

export function ForwardSubmissionDialog({ open, onOpenChange, localityName, groupName, targetLabel = 'Lãnh đạo ban', explanationLabel = 'Diễn giải hồ sơ từ chuyên viên', onConfirm }: ForwardSubmissionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [explanation, setExplanation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setExplanation('');
      setUploadProgress({});
    }
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await onConfirm({ explanation: explanation.trim(), files, onProgress: (percent) => setUploadProgress({ forwarding: percent }) });
      onOpenChange(false);
    } catch {
      // Lỗi đã được toast ở caller — giữ dialog mở
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xác nhận chuyển hồ sơ"
      description={`Chuyển hồ sơ đã thẩm định lên ${targetLabel}.`}
      onSubmit={submit}
      submitLabel={submitting ? 'Đang xử lý…' : 'Xác nhận'}
      submitDisabled={submitting}
      cancelLabel="Đóng"
    >
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileCheck2 className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Sau khi xác nhận, kết quả chấm điểm sẽ được chuyển lên {targetLabel} để phê duyệt. Bạn sẽ không thể chỉnh sửa điểm sau bước này.
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Địa phương</dt>
          <TruncatedText as="dd" value={localityName} className="mt-1 font-semibold text-foreground" />
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Nhóm tiêu chí</dt>
          <TruncatedText as="dd" value={groupName} className="mt-1 font-semibold text-foreground" />
        </div>
      </dl>
      <div className="space-y-2">
        <Label htmlFor="forwarding-explanation">{explanationLabel}</Label>
        <Textarea
          id="forwarding-explanation"
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          placeholder={`Ví dụ: Hồ sơ đã được đối chiếu, đủ điều kiện chuyển ${targetLabel} phê duyệt.`}
          rows={3}
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="forwarding-files" className="flex items-center gap-1.5">
          <Paperclip className="size-4 text-primary" /> Đính kèm tập tin
        </Label>
        <FileUpload
          value={files}
          onChange={setFiles}
          maxSizeMb={20}
          maxFiles={10}
          disabled={submitting}
          uploading={submitting && files.length > 0}
          uploadProgress={uploadProgress}
          className="[&>div:first-child]:py-4"
        />
      </div>
    </FormDialog>
  );
}
