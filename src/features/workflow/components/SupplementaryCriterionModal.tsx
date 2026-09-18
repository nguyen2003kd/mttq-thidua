import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { FormDialog, FileUpload } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SupplementaryCriterionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: { name: string; score: number; reason: string; file: File }) => boolean;
  /** Lãnh đạo chỉ tạo yêu cầu bổ sung minh chứng, không cộng điểm vào nhóm. */
  showScore?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function SupplementaryCriterionModal({ open, onOpenChange, onSave, showScore = true }: SupplementaryCriterionModalProps) {
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setScore('');
    setReason('');
    setFile(null);
    setError('');
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextScore = showScore ? Number(score) : 0;
    if (!name.trim()) return setError('Nội dung tiêu chí bổ sung là bắt buộc.');
    if (showScore && (!Number.isFinite(nextScore) || nextScore < 0)) return setError('Điểm chấm phải là số không âm.');
    if (!reason.trim()) return setError('Lý do là bắt buộc.');
    if (!file) return setError('File đính kèm là bắt buộc.');
    if (file.size > MAX_FILE_SIZE) return setError('File đính kèm không được vượt quá 20MB.');
    if (onSave({ name: name.trim(), score: nextScore, reason: reason.trim(), file })) onOpenChange(false);
    else setError('Không thể thêm tiêu chí bổ sung ở trạng thái hiện tại.');
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Thêm tiêu chí bổ sung" description={showScore ? 'Tiêu chí bổ sung không có điểm tự đề xuất; người chấm cho điểm trực tiếp.' : 'Tiêu chí này chỉ yêu cầu bổ sung minh chứng, không làm thay đổi tổng điểm của nhóm.'} onSubmit={submit} submitLabel="Lưu" cancelLabel="Đóng">
      <div className="space-y-1.5">
        <Label htmlFor="supplementary-name">Nội dung tiêu chí <span className="text-destructive">*</span></Label>
        <Input id="supplementary-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nhập nội dung tiêu chí bổ sung" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="supplementary-reason">Lý do <span className="text-destructive">*</span></Label>
        <Textarea id="supplementary-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>File đính kèm <span className="text-destructive">*</span></Label>
        <FileUpload value={file ? [file] : []} onChange={(files) => setFile(files[0] ?? null)} multiple={false} />
      </div>
      {showScore && (
        <div className="space-y-1.5">
          <Label htmlFor="supplementary-score">Điểm chấm <span className="text-destructive">*</span></Label>
          <Input id="supplementary-score" type="number" min={0} step="0.25" value={score} onChange={(event) => setScore(event.target.value)} />
        </div>
      )}
      {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="size-4 shrink-0" />{error}</p>}
    </FormDialog>
  );
}
