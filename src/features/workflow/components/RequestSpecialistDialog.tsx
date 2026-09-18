import { useEffect, useState, type FormEvent } from 'react';
import { FilePlus2 } from 'lucide-react';
import { FileUpload, FormDialog } from '@/components/core';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RequestSpecialistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName?: string;
  /** Cấp đang gửi yêu cầu. Mặc định là Lãnh đạo ban. */
  requesterLabel?: string;
  /** Người nhận yêu cầu theo nguyên tắc B0. Mặc định là Chuyên viên. */
  recipientLabel?: string;
  /** Cho phép từng cấp diễn đạt đúng ngữ cảnh nghiệp vụ của mình. */
  description?: string;
  onConfirm: (value: { reason: string; file: File | null }) => void | Promise<void>;
}

/** Modal B0: yêu cầu từ các cấp duyệt luôn được gửi cho Chuyên viên xử lý. */
export function RequestSpecialistDialog({
  open,
  onOpenChange,
  localityName,
  requesterLabel = 'Lãnh đạo ban',
  recipientLabel = 'Chuyên viên',
  description,
  onConfirm,
}: RequestSpecialistDialogProps) {
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setFile(null);
    setError('');
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(`Vui lòng nhập lý do yêu cầu ${recipientLabel} bổ sung.`);
      return;
    }
    if (file && file.size > 20 * 1024 * 1024) {
      setError('Tập tin đính kèm không được vượt quá 20MB.');
      return;
    }
    await onConfirm({ reason: trimmed, file });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yêu cầu Chuyên viên bổ sung"
      description={description ?? (localityName
        ? `${requesterLabel} đề nghị ${recipientLabel} rà soát hồ sơ của ${localityName} trước khi trình lại.`
        : `${requesterLabel} đề nghị ${recipientLabel} rà soát và bổ sung hồ sơ.`)}
      onSubmit={submit}
      submitLabel="Gửi yêu cầu"
      cancelLabel="Đóng"
    >
      <div className="space-y-1.5">
        <Label htmlFor="specialist-request-reason">Lý do <span className="text-destructive">*</span></Label>
        <Textarea
          id="specialist-request-reason"
          rows={4}
          value={reason}
          onChange={(event) => { setReason(event.target.value); setError(''); }}
          placeholder="Nêu rõ nội dung Chuyên viên cần đối chiếu, bổ sung hoặc chỉnh sửa."
          aria-invalid={Boolean(error)}
        />
        {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><FilePlus2 className="size-4 text-primary" />File đính kèm</Label>
        <FileUpload value={file ? [file] : []} onChange={(files) => setFile(files[0] ?? null)} multiple={false} maxSizeMb={20} />
        <p className="text-xs text-muted-foreground">Không bắt buộc. Mỗi file tối đa 20MB.</p>
      </div>
    </FormDialog>
  );
}
