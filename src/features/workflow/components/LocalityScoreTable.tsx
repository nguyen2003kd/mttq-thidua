import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type FormEvent } from 'react';
import { MessageSquareText, Upload } from 'lucide-react';
import { Button, FileUpload, FormDialog } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import type { CriteriaItem, Evidence, ScoreEntry, ScoreRecord } from '@/types/domain';
import type { EvidenceFormValue } from './EvidenceModal';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function validateScore(value: string, maximum: number, label: string, required = false) {
  if (value.trim() === '') return required ? `Vui lòng nhập ${label.toLocaleLowerCase()}.` : '';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= maximum
    ? ''
    : `${label} phải từ 0 đến ${maximum}.`;
}

interface LocalityScoreTableProps {
  criteria: CriteriaItem[];
  record: ScoreRecord;
  evidence: Evidence[];
  localityId: string;
  editable: boolean;
  draftValues?: Map<string, EvidenceFormValue>;
  selectedCriterionId?: string;
  uploading?: boolean;
  onSave: (criterion: CriteriaItem, value: EvidenceFormValue) => boolean | Promise<boolean>;
  onSelect?: (entry: ScoreEntry, criterion: CriteriaItem) => void;
}

export interface LocalityScoreTableHandle {
  saveAll: () => Promise<boolean>;
  validateAll: () => boolean;
}

interface EditableRowHandle {
  save: () => Promise<boolean>;
  validate: () => boolean;
}

interface EditableRowProps extends Omit<LocalityScoreTableProps, 'criteria' | 'record' | 'evidence' | 'localityId' | 'draftValues'> {
  criterion: CriteriaItem;
  entry?: ScoreEntry;
  files: Evidence[];
  draft?: EvidenceFormValue;
  state: ScoreRecord['state'];
  selected?: boolean;
}

interface EvidenceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: File | null;
  onConfirm: (file: File) => void;
}

function EvidenceUploadDialog({ open, onOpenChange, title, description, value, onConfirm }: EvidenceUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedFile(value);
    setError('');
  }, [open, value]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Vui lòng chọn file bằng chứng.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File bằng chứng không được vượt quá 20MB.');
      return;
    }
    onConfirm(selectedFile);
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={title} description={description} onSubmit={submit} submitLabel="Xác nhận file" cancelLabel="Đóng" size="max-w-xl sm:max-w-xl">
      <FileUpload value={selectedFile ? [selectedFile] : []} onChange={(files) => { setSelectedFile(files[0] ?? null); setError(''); }} multiple={false} error={error} />
      <p className="text-xs text-muted-foreground">File sẽ được tải lên hệ thống khi bạn bấm “Lưu tất cả” ở cuối trang.</p>
    </FormDialog>
  );
}

interface ExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterionName: string;
  value: string;
  onConfirm: (value: string) => void;
}

function ExplanationDialog({ open, onOpenChange, criterionName, value, onConfirm }: ExplanationDialogProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setContent(value);
    setError('');
  }, [open, value]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      setError('Vui lòng nhập nội dung diễn giải.');
      return;
    }
    onConfirm(normalizedContent);
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Nhập nội dung diễn giải" description={criterionName} onSubmit={submit} submitLabel="Xác nhận" cancelLabel="Đóng" size="max-w-xl sm:max-w-xl">
      <div className="space-y-1.5">
        <Textarea value={content} onChange={(event) => { setContent(event.target.value); setError(''); }} rows={5} placeholder="Mô tả kết quả đạt được và căn cứ chấm điểm" autoFocus />
        {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
      </div>
      <p className="text-xs text-muted-foreground">Nội dung sẽ được lưu cùng điểm và file khi bạn bấm “Lưu tất cả” ở cuối trang.</p>
    </FormDialog>
  );
}

const EditableRow = forwardRef<EditableRowHandle, EditableRowProps>(function EditableRow({
  criterion,
  entry,
  files,
  draft,
  state,
  editable,
  uploading = false,
  onSave,
  onSelect,
  selected = false,
}, ref) {
  const [score, setScore] = useState('');
  const [bonusScore, setBonusScore] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [bonusFile, setBonusFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [bonusScoreError, setBonusScoreError] = useState('');
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [bonusEvidenceDialogOpen, setBonusEvidenceDialogOpen] = useState(false);
  const [explanationDialogOpen, setExplanationDialogOpen] = useState(false);

  useEffect(() => {
    setScore(draft?.proposedScore.toString() ?? entry?.proposedScore?.toString() ?? '');
    setBonusScore(draft?.proposedBonusScore.toString() ?? entry?.proposedBonusScore?.toString() ?? '0');
    setExplanation(draft?.explanation ?? entry?.explanation ?? '');
    setFile(draft?.file ?? null);
    setBonusFile(draft?.bonusFile ?? null);
    setError('');
    setScoreError('');
    setBonusScoreError('');
  }, [draft, entry?.explanation, entry?.proposedBonusScore, entry?.proposedScore]);

  const maxBonus = criterion.bonusScore ?? 0;
  const locked = Boolean(entry?.locked || !editable);
  const standardFiles = files.filter((item) => item.kind !== 'BONUS');
  const bonusFiles = files.filter((item) => item.kind === 'BONUS');
  const rowEntry: ScoreEntry = entry ?? {
    id: `empty-${criterion.id}`,
    criteriaId: criterion.id,
    criteriaName: criterion.name,
    value: 0,
    state,
    scoredBy: '',
    scoredAt: '',
    evidenceCount: files.length,
  };

  const validateRow = () => {
    if (locked) return true;
    const nextScoreError = validateScore(score, criterion.maxScore, 'Điểm đề xuất', true);
    const nextBonusScoreError = validateScore(bonusScore, maxBonus, 'Điểm thưởng');
    setScoreError(nextScoreError);
    setBonusScoreError(nextBonusScoreError);
    setError('');
    if (nextScoreError || nextBonusScoreError) {
      return false;
    }
    if (!explanation.trim()) {
      setError('Vui lòng nhập nội dung diễn giải.');
      return false;
    }
    if (standardFiles.length === 0 && !file) {
      setError('Vui lòng chọn file bằng chứng.');
      return false;
    }
    if ((file && file.size > MAX_FILE_SIZE) || (bonusFile && bonusFile.size > MAX_FILE_SIZE)) {
      setError('Mỗi file không được vượt quá 20MB.');
      return false;
    }

    return true;
  };

  const saveRow = async (): Promise<boolean> => {
    if (locked) return true;
    const proposedScore = Number(score || 0);
    const proposedBonusScore = Number(bonusScore || 0);

    setSaving(true);
    setError('');
    setScoreError('');
    setBonusScoreError('');
    try {
      const saved = await onSave(criterion, {
        proposedScore,
        proposedBonusScore,
        explanation: explanation.trim(),
        file,
        bonusFile,
      });
      if (!saved) {
        setError('Không thể lưu tiêu chí. Vui lòng thử lại.');
        return false;
      }
      if (!draft) {
        setFile(null);
        setBonusFile(null);
      }
      return true;
    } catch {
      setError('Không thể lưu điểm hoặc tải file. Vui lòng thử lại.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ save: saveRow, validate: validateRow }));

  return (
    <TableRow onClick={() => onSelect?.(rowEntry, criterion)} className={`${locked ? 'bg-muted/40' : 'hover:bg-surface-muted'} ${selected ? 'bg-primary/[0.06] hover:bg-primary/[0.08]' : ''} cursor-pointer`}>
      <TableCell className="align-top">
        <p className="whitespace-normal break-words font-medium leading-5">{criterion.name}</p>
        {entry?.revisionRequest && <Badge className="mt-2 bg-warning/15 text-warning-foreground">Yêu cầu chỉnh sửa</Badge>}
      </TableCell>
      <TableCell className="align-top text-sm text-muted-foreground">
        {criterion.deadline ? formatDate(criterion.deadline) : 'Chưa có hạn'}
      </TableCell>
      <TableCell className="align-top">
        <div className="relative">
          <Input aria-label={`Điểm đề xuất ${criterion.name}`} aria-invalid={Boolean(scoreError)} type="number" min={0} max={criterion.maxScore} step="0.25" value={score} disabled={locked || saving} onChange={(event) => { setScore(event.target.value); setScoreError(''); }} className="h-11 pr-12 text-right text-base font-semibold tabular-nums" />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center border-l pl-2 text-sm font-medium text-muted-foreground tabular-nums">/ {criterion.maxScore}</span>
        </div>
        {scoreError && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{scoreError}</p>}
      </TableCell>
      <TableCell className="align-top">
        <div className="relative">
          <Input aria-label={`Điểm thưởng ${criterion.name}`} aria-invalid={Boolean(bonusScoreError)} type="number" min={0} max={maxBonus} step="0.25" value={bonusScore} disabled={locked || maxBonus === 0 || saving} onChange={(event) => { setBonusScore(event.target.value); setBonusScoreError(''); }} className="h-11 pr-12 text-right text-base font-semibold tabular-nums" />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center border-l pl-2 text-sm font-medium text-muted-foreground tabular-nums">/ {maxBonus}</span>
        </div>
        {bonusScoreError && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{bonusScoreError}</p>}
      </TableCell>
      <TableCell className="align-top">
        <div className="flex min-w-0 flex-col gap-2">
          <Button type="button" variant="outline" className="w-full justify-start overflow-hidden" disabled={locked || saving || uploading} onClick={(event) => { event.stopPropagation(); setEvidenceDialogOpen(true); }}>
            <Upload className="size-4 shrink-0" />
            <span className="truncate">{file?.name ?? (standardFiles.length > 0 ? 'Nộp thêm file' : 'Nộp file')}</span>
          </Button>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="flex min-w-0 flex-col gap-2">
          <Button type="button" variant="outline" className="w-full justify-start overflow-hidden" disabled={locked || maxBonus === 0 || saving || uploading} onClick={(event) => { event.stopPropagation(); setBonusEvidenceDialogOpen(true); }}>
            <Upload className="size-4 shrink-0" />
            <span className="truncate">{bonusFile?.name ?? (bonusFiles.length > 0 ? 'Nộp thêm file' : 'Nộp file')}</span>
          </Button>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <Button type="button" variant="outline" className="w-full justify-start overflow-hidden" disabled={locked || saving || uploading} onClick={(event) => { event.stopPropagation(); setExplanationDialogOpen(true); }}>
          <MessageSquareText className="size-4 shrink-0" />
          <span className="truncate">{explanation || 'Nhập nội dung diễn giải'}</span>
        </Button>
        {entry?.revisionRequest && <p className="mt-2 rounded border border-warning/40 bg-warning/10 p-2 text-xs"><strong>Phản hồi:</strong> {entry.revisionRequest}</p>}
        {error && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{error}</p>}
        <EvidenceUploadDialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen} title="Nộp file bằng chứng" description={criterion.name} value={file} onConfirm={setFile} />
        <EvidenceUploadDialog open={bonusEvidenceDialogOpen} onOpenChange={setBonusEvidenceDialogOpen} title="Nộp bằng chứng điểm thưởng" description={criterion.name} value={bonusFile} onConfirm={setBonusFile} />
        <ExplanationDialog open={explanationDialogOpen} onOpenChange={setExplanationDialogOpen} criterionName={criterion.name} value={explanation} onConfirm={setExplanation} />
      </TableCell>
    </TableRow>
  );
});

export const LocalityScoreTable = forwardRef<LocalityScoreTableHandle, LocalityScoreTableProps>(function LocalityScoreTable({
  criteria,
  record,
  evidence,
  localityId,
  editable,
  draftValues,
  selectedCriterionId,
  uploading,
  onSave,
  onSelect,
}, ref) {
  const rowRefs = useRef<Record<string, EditableRowHandle | null>>({});

  useImperativeHandle(ref, () => ({
    saveAll: async () => {
      let allSaved = true;
      for (const criterion of criteria) {
        const saved = await rowRefs.current[criterion.id]?.save();
        if (saved === false) allSaved = false;
      }
      return allSaved;
    },
    validateAll: () => criteria.every((criterion) => rowRefs.current[criterion.id]?.validate() ?? true),
  }));

  return (
    <div className="overflow-hidden rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Nội dung tự đánh giá</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Nhập điểm trực tiếp; bằng chứng và diễn giải được bổ sung qua từng nút trên dòng.</p>
        </div>
        <Badge variant="outline">{criteria.length} tiêu chí</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[1320px] table-fixed [&_tbody_td]:border-r [&_tbody_td]:border-primary/15 [&_tbody_td:last-child]:border-r-0">
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="h-12 w-[250px] border-r border-white/30 bg-primary text-primary-foreground">Nội dung tiêu chí</TableHead>
              <TableHead className="h-12 w-[130px] border-r border-white/30 bg-primary text-primary-foreground">Hạn nộp</TableHead>
              <TableHead className="h-12 w-[130px] border-r border-white/30 bg-primary text-right text-primary-foreground">Điểm đề xuất ★</TableHead>
              <TableHead className="h-12 w-[130px] border-r border-white/30 bg-primary text-right text-primary-foreground">Điểm thưởng</TableHead>
              <TableHead className="h-12 w-[180px] border-r border-white/30 bg-primary text-primary-foreground">File bằng chứng ★</TableHead>
              <TableHead className="h-12 w-[190px] border-r border-white/30 bg-primary text-primary-foreground">Bằng chứng điểm thưởng</TableHead>
              <TableHead className="h-12 w-[280px] bg-primary text-primary-foreground">Nội dung diễn giải ★</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map((criterion) => (
              <EditableRow
                key={criterion.id}
                ref={(node) => { rowRefs.current[criterion.id] = node; }}
                criterion={criterion}
                entry={record.entries.find((item) => item.criteriaId === criterion.id)}
                files={evidence.filter((item) => item.localityId === localityId && item.criteriaId === criterion.id)}
                draft={draftValues?.get(criterion.id)}
                state={record.state}
                editable={editable}
                selected={selectedCriterionId === criterion.id}
                uploading={uploading}
                onSave={onSave}
                onSelect={onSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
