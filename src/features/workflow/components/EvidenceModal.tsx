import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileText, Paperclip, Trash2 } from 'lucide-react';
import { FormDialog, Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CriteriaItem, Evidence, ScoreEntry } from '@/types/domain';

export interface EvidenceFormValue {
  proposedScore: number;
  proposedBonusScore: number;
  explanation: string;
  file: File | null;
  bonusFile: File | null;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface EvidenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterion?: CriteriaItem;
  entry?: ScoreEntry;
  evidence: Evidence[];
  readonly?: boolean;
  onSave?: (value: EvidenceFormValue) => boolean;
  onDeleteEvidence?: (id: string) => void;
}

export function EvidenceModal({
  open,
  onOpenChange,
  criterion,
  entry,
  evidence,
  readonly = false,
  onSave,
  onDeleteEvidence,
}: EvidenceModalProps) {
  const [score, setScore] = useState('');
  const [bonus, setBonus] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [bonusFile, setBonusFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setScore(entry?.proposedScore?.toString() ?? '');
    setBonus(entry?.proposedBonusScore?.toString() ?? '0');
    setExplanation(entry?.explanation ?? '');
    setFile(null);
    setBonusFile(null);
    setError('');
  }, [open, entry]);

  const maxScore = criterion?.maxScore ?? entry?.supplementaryMaxScore ?? 0;
  const maxBonus = criterion?.bonusScore ?? 0;
  const title = readonly ? 'Bằng chứng địa phương' : entry?.proposedScore === undefined ? 'Thêm mới bằng chứng' : 'Sửa bằng chứng';
  const description = criterion?.name ?? entry?.criteriaName ?? '';
  const hasEvidence = evidence.length > 0;

  const sortedEvidence = useMemo(
    () => [...evidence].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [evidence],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (readonly || !onSave) {
      onOpenChange(false);
      return;
    }
    const proposedScore = Number(score);
    const proposedBonusScore = Number(bonus || 0);
    if (!Number.isFinite(proposedScore) || proposedScore < 0 || proposedScore > maxScore) {
      setError(`Điểm đề xuất phải từ 0 đến ${maxScore}.`);
      return;
    }
    if (!Number.isFinite(proposedBonusScore) || proposedBonusScore < 0 || proposedBonusScore > maxBonus) {
      setError(`Điểm thưởng đề xuất phải từ 0 đến ${maxBonus}.`);
      return;
    }
    if (!explanation.trim()) {
      setError('Nội dung diễn giải là bắt buộc.');
      return;
    }
    if (!hasEvidence && !file) {
      setError('Vui lòng đính kèm ít nhất một file bằng chứng.');
      return;
    }
    if ((file && file.size > MAX_FILE_SIZE) || (bonusFile && bonusFile.size > MAX_FILE_SIZE)) {
      setError('Mỗi file bằng chứng không được vượt quá 20MB.');
      return;
    }
    if (onSave({ proposedScore, proposedBonusScore, explanation: explanation.trim(), file, bonusFile })) {
      onOpenChange(false);
    } else {
      setError('Không thể lưu. Tiêu chí có thể đã bị khóa hoặc hồ sơ không còn ở trạng thái được sửa.');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      onSubmit={handleSubmit}
      submitLabel={readonly ? 'Đóng' : 'Lưu'}
      cancelLabel="Đóng"
      size="max-w-2xl sm:max-w-2xl"
    >
      {!readonly && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="proposed-score">Điểm đề xuất <span className="text-destructive">*</span></Label>
            <Input id="proposed-score" type="number" min={0} max={maxScore} step="0.25" value={score} onChange={(event) => setScore(event.target.value)} />
            <p className="text-xs text-muted-foreground">Điểm tối đa: {maxScore} (không thể chỉnh sửa)</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proposed-bonus">Điểm thưởng đề xuất</Label>
            <Input id="proposed-bonus" type="number" min={0} max={maxBonus} step="0.25" value={bonus} onChange={(event) => setBonus(event.target.value)} disabled={maxBonus === 0} />
            <p className="text-xs text-muted-foreground">Điểm thưởng tối đa: {maxBonus}</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evidence-explanation">Diễn giải <span className="text-destructive">*</span></Label>
            <Textarea id="evidence-explanation" rows={3} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Mô tả kết quả đạt được và căn cứ chấm điểm" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evidence-file">File bằng chứng {!hasEvidence && <span className="text-destructive">*</span>}</Label>
            <Input id="evidence-file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Dung lượng tối đa 20MB.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bonus-evidence-file">Bằng chứng điểm thưởng</Label>
            <Input id="bonus-evidence-file" type="file" onChange={(event) => setBonusFile(event.target.files?.[0] ?? null)} disabled={maxBonus === 0} />
            <p className="text-xs text-muted-foreground">Không bắt buộc, dung lượng tối đa 20MB.</p>
          </div>
        </div>
      )}

      {readonly && entry?.explanation && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Diễn giải</p>
          <p className="mt-1 text-sm">{entry.explanation}</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Danh sách file ({sortedEvidence.length})</p>
        {sortedEvidence.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Chưa có file bằng chứng.</div>
        ) : (
          sortedEvidence.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">{item.fileSize ? `${Math.ceil(item.fileSize / 1024)} KB` : 'Tệp minh chứng'} · {item.kind === 'BONUS' ? 'Điểm thưởng' : item.kind === 'SUPPLEMENTARY' ? 'Tiêu chí bổ sung' : 'Bằng chứng chính'}</p>
              </div>
              <Button variant="ghost" size="icon-xs" title="Mở tệp"><Paperclip className="h-4 w-4" /></Button>
              {!readonly && onDeleteEvidence && (
                <Button variant="ghost" size="icon-xs" title="Xóa tệp" className="text-destructive" onClick={() => onDeleteEvidence(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-destructive">⚠ {error}</p>}
    </FormDialog>
  );
}
