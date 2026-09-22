import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Paperclip } from 'lucide-react';
import { FileUpload, FormDialog } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CriteriaItem, ScoreEntry } from '@/types/domain';

interface ReviewScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ScoreEntry;
  criterion?: CriteriaItem;
  /** Dùng cho các màn gọi API có kiểu kết quả khác ScoreEntry. */
  criterionName?: string;
  maxScoreOverride?: number;
  maxBonusOverride?: number;
  isSupplementary?: boolean;
  title?: string;
  referenceLabel?: string;
  referenceScore?: number;
  referenceBonusScore?: number;
  initialScore?: number;
  initialBonusScore?: number;
  initialReason?: string;
  enableAttachment?: boolean;
  initialAttachment?: File | null;
  onSave: (value: { score: number; bonusScore: number; reason?: string; attachment?: File | null }) => boolean;
}

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

export function ReviewScoreModal({
  open,
  onOpenChange,
  entry,
  criterion,
  criterionName,
  maxScoreOverride,
  maxBonusOverride,
  isSupplementary,
  title = 'Sửa điểm bản ghi tiêu chí',
  referenceLabel = 'Địa phương đề xuất',
  referenceScore,
  referenceBonusScore,
  initialScore,
  initialBonusScore,
  initialReason,
  enableAttachment = false,
  initialAttachment = null,
  onSave,
}: ReviewScoreModalProps) {
  const [score, setScore] = useState('');
  const [bonus, setBonus] = useState('0');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (!open) return;
    setScore(String(initialScore ?? entry?.value ?? entry?.proposedScore ?? 0));
    setBonus(String(initialBonusScore ?? 0));
    setReason(initialReason ?? '');
    setAttachment(initialAttachment);
    setError('');
    setAttachmentError('');
  }, [open, entry, initialScore, initialBonusScore, initialReason, initialAttachment]);

  const maxScore = maxScoreOverride ?? criterion?.maxScore ?? entry?.supplementaryMaxScore ?? entry?.value ?? 0;
  const maxBonus = maxBonusOverride ?? criterion?.bonusScore ?? 0;
  const baseScore = referenceScore ?? entry?.proposedScore ?? 0;
  const baseBonus = referenceBonusScore ?? entry?.proposedBonusScore ?? 0;
  const supplementary = isSupplementary ?? entry?.isSupplementary ?? false;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextScore = Number(score);
    const nextBonus = Number(bonus || 0);
    if (!Number.isFinite(nextScore) || nextScore < 0 || nextScore > maxScore) {
      setError(`Điểm chấm phải từ 0 đến ${maxScore}.`);
      return;
    }
    if (!Number.isFinite(nextBonus) || nextBonus < 0 || nextBonus > maxBonus) {
      setError(`Điểm thưởng phải từ 0 đến ${maxBonus}.`);
      return;
    }
    const differs = nextScore !== baseScore || nextBonus !== baseBonus;
    if ((differs || supplementary) && !reason.trim()) {
      setError(`Bắt buộc nhập lý do khi điểm chấm lệch với ${referenceLabel.toLocaleLowerCase('vi')}.`);
      return;
    }
    if (attachmentError) return;
    if (onSave({ score: nextScore, bonusScore: nextBonus, reason: reason.trim() || undefined, attachment })) {
      onOpenChange(false);
    } else {
      setError('Không thể lưu điểm. Vui lòng kiểm tra lại dữ liệu.');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={criterionName ?? entry?.criteriaName}
      onSubmit={submit}
      submitLabel="Lưu"
      cancelLabel="Đóng"
    >
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="text-muted-foreground">{referenceLabel}</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">Điểm: {baseScore}/{maxScore}<span className="mx-2 text-border">•</span>Điểm thưởng: {baseBonus}/{maxBonus}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="review-score">Điểm chấm <span className="text-destructive">*</span></Label>
          <Input id="review-score" type="number" min={0} max={maxScore} step="0.25" value={score} onChange={(event) => setScore(event.target.value)} />
          <p className="text-xs text-muted-foreground">Tối đa {maxScore} điểm</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-bonus">Điểm thưởng</Label>
          <Input id="review-bonus" type="number" min={0} max={maxBonus} step="0.25" value={bonus} onChange={(event) => setBonus(event.target.value)} disabled={maxBonus === 0} />
          <p className="text-xs text-muted-foreground">Tối đa {maxBonus} điểm</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-reason">Lý do {(Number(score) !== baseScore || Number(bonus) !== baseBonus || supplementary) && <span className="text-destructive">*</span>}</Label>
        <Textarea id="review-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập căn cứ điều chỉnh điểm" />
      </div>
      {enableAttachment && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Paperclip className="size-4 text-primary" />Tệp đính kèm <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label>
          <FileUpload
            value={attachment ? [attachment] : []}
            onChange={(files) => {
              const file = files[0] ?? null;
              setAttachment(file);
              setAttachmentError(file && file.size > MAX_ATTACHMENT_SIZE ? 'Tệp đính kèm không được vượt quá 20MB.' : '');
            }}
            multiple={false}
            maxSizeMb={20}
            error={attachmentError}
          />
        </div>
      )}
      {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="size-4 shrink-0" />{error}</p>}
    </FormDialog>
  );
}
