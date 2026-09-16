import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowDownToLine, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog, Button, FileUpload, TruncatedText } from '@/components/core';
import { downloadFile } from '@/features/files/api/filesApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CriteriaItem, Evidence, ScoreEntry } from '@/types/domain';

export interface EvidenceFormValue {
  proposedScore: number;
  proposedBonusScore: number;
  explanation: string;
  files: File[];
  bonusFiles: File[];
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface EvidenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterion?: CriteriaItem;
  entry?: ScoreEntry;
  evidence: Evidence[];
  readonly?: boolean;
  onSave?: (value: EvidenceFormValue) => boolean | Promise<boolean>;
  onDeleteEvidence?: (id: string) => void;
  uploading?: boolean;
  uploadProgress?: Record<string, number>;
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
  uploading = false,
  uploadProgress,
}: EvidenceModalProps) {
  const [score, setScore] = useState('');
  const [bonus, setBonus] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [bonusFiles, setBonusFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScore(entry?.proposedScore?.toString() ?? '');
    setBonus(entry?.proposedBonusScore?.toString() ?? '0');
    setExplanation(entry?.explanation ?? '');
    setFiles([]);
    setBonusFiles([]);
    setError('');
    setSaving(false);
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

  const handleSubmit = async (event: FormEvent) => {
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
    if (!hasEvidence && files.length === 0) {
      setError('Vui lòng đính kèm ít nhất một file bằng chứng.');
      return;
    }
    if ([...files, ...bonusFiles].some((f) => f.size > MAX_FILE_SIZE)) {
      setError('Mỗi file bằng chứng không được vượt quá 20MB.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (await onSave({ proposedScore, proposedBonusScore, explanation: explanation.trim(), files, bonusFiles })) {
        onOpenChange(false);
      } else {
        setError('Không thể lưu. Tiêu chí có thể đã bị khóa hoặc hồ sơ không còn ở trạng thái được sửa.');
      }
    } catch {
      setError('Không thể lưu bằng chứng. Vui lòng kiểm tra file và thử lại.');
    } finally {
      setSaving(false);
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
      submitDisabled={saving || uploading}
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
            <Label>File bằng chứng {!hasEvidence && <span className="text-destructive">*</span>}</Label>
            <FileUpload value={files} onChange={setFiles} multiple disabled={saving} uploading={uploading} uploadProgress={uploadProgress} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bằng chứng điểm thưởng</Label>
            <FileUpload value={bonusFiles} onChange={setBonusFiles} multiple disabled={maxBonus === 0 || saving} uploading={uploading} uploadProgress={uploadProgress} />
            <p className="text-xs text-muted-foreground">Không bắt buộc.</p>
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
                <TruncatedText as="p" value={item.fileName} className="text-sm font-medium" />
                <p className="text-xs text-muted-foreground">{item.fileSize ? `${Math.ceil(item.fileSize / 1024)} KB` : 'Tệp minh chứng'} · {item.kind === 'BONUS' ? 'Điểm thưởng' : item.kind === 'SUPPLEMENTARY' ? 'Tiêu chí bổ sung' : 'Bằng chứng chính'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Tải file về máy"
                onClick={() => { void downloadFile(item.id, item.fileName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.')); }}
              >
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
              {!readonly && onDeleteEvidence && (
                <Button variant="ghost" size="icon-xs" title="Xóa tệp" className="text-destructive" onClick={() => onDeleteEvidence(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="size-4 shrink-0" />{error}</p>}
    </FormDialog>
  );
}
