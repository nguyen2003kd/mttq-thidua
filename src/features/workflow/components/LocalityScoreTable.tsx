import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownToLine, FileText, MessageSquareText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DataTable, FileUpload, FormDialog, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ColumnDef } from '@tanstack/react-table';
import { downloadFile } from '@/features/files/api/filesApi';
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
  nowMs: number;
  draftValues?: Map<string, EvidenceFormValue>;
  selectedCriterionId?: string;
  /** Lý do chỉnh sửa theo từng tiêu chí được Chuyên viên yêu cầu. */
  specialistRevisionReasons?: ReadonlyMap<string, string>;
  /** Khi có danh sách này, chỉ các tiêu chí được yêu cầu mới cho phép chỉnh sửa. */
  editableCriteriaIds?: ReadonlySet<string> | null;
  uploading?: boolean;
  toolbar?: ReactNode;
  onSelect?: (entry: ScoreEntry, criterion: CriteriaItem) => void;
  onDeleteEvidence?: (id: string) => void;
}

export interface LocalityScoreTableHandle {
  /** Gom giá trị đang nhập của tất cả dòng (không gọi API) — null = có dòng bị khóa bỏ qua. */
  collectAll: () => Map<string, EvidenceFormValue>;
  /** Reset file đã chọn sau khi lưu thành công. */
  markAllSaved: () => void;
  validateAll: () => boolean;
}

interface EditableRowHandle {
  collect: () => EvidenceFormValue | null;
  markSaved: () => void;
  validate: () => boolean;
}

interface EditableRowProps extends Omit<LocalityScoreTableProps, 'criteria' | 'record' | 'evidence' | 'localityId' | 'draftValues'> {
  criterion: CriteriaItem;
  entry?: ScoreEntry;
  files: Evidence[];
  draft?: EvidenceFormValue;
  state: ScoreRecord['state'];
  selected?: boolean;
  visibleColumnIds?: string[];
}

interface EvidenceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: File[];
  uploadedFiles: Evidence[];
  onConfirm: (files: File[]) => void;
  onDeleteUploaded?: (id: string) => void;
}

function EvidenceUploadDialog({ open, onOpenChange, title, description, value, uploadedFiles, onConfirm, onDeleteUploaded }: EvidenceUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedFiles(value);
    setError('');
  }, [open, value]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedFiles.length === 0 && uploadedFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một file minh chứng.');
      return;
    }
    if (selectedFiles.some((f) => f.size > MAX_FILE_SIZE)) {
      setError('Mỗi file minh chứng không được vượt quá 20MB.');
      return;
    }
    onConfirm(selectedFiles);
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={title} description={description} onSubmit={submit} submitLabel="Xác nhận file" cancelLabel="Đóng" size="max-w-xl sm:max-w-xl">
      <FileUpload value={selectedFiles} onChange={(files) => { setSelectedFiles(files); setError(''); }} multiple error={error} />
      <p className="text-xs text-muted-foreground">File sẽ được tải lên hệ thống khi bạn bấm “Lưu tất cả” ở cuối trang.</p>
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">File đã tải lên ({uploadedFiles.length})</p>
          {uploadedFiles.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <TruncatedText as="p" value={item.fileName} className="text-sm font-medium" />
                <p className="text-xs text-muted-foreground">{item.fileSize ? `${Math.ceil(item.fileSize / 1024)} KB` : 'Tệp minh chứng'} · {formatDate(item.uploadedAt)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Tải file về máy"
                onClick={() => { void downloadFile(item.id, item.fileName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.')); }}
              >
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
              {onDeleteUploaded && (
                <Button variant="ghost" size="icon-xs" title="Xóa tệp" className="text-destructive" onClick={() => onDeleteUploaded(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
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
  nowMs,
  uploading = false,
  onSelect,
  onDeleteEvidence,
  selected = false,
  visibleColumnIds,
  specialistRevisionReasons,
  editableCriteriaIds,
}, ref) {
  const [score, setScore] = useState('');
  const [bonusScore, setBonusScore] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [explanationError, setExplanationError] = useState('');
  const [evidenceError, setEvidenceError] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [bonusScoreError, setBonusScoreError] = useState('');
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [explanationDialogOpen, setExplanationDialogOpen] = useState(false);

  useEffect(() => {
    setScore(draft?.proposedScore.toString() ?? entry?.proposedScore?.toString() ?? '');
    setBonusScore(draft?.proposedBonusScore.toString() ?? entry?.proposedBonusScore?.toString() ?? '0');
    setExplanation(draft?.explanation ?? entry?.explanation ?? '');
    setSelectedFiles(draft?.files ?? []);
    setExplanationError('');
    setEvidenceError('');
    setScoreError('');
    setBonusScoreError('');
  }, [draft, entry?.explanation, entry?.proposedBonusScore, entry?.proposedScore]);

  const maxBonus = criterion.bonusScore ?? 0;
  const criterionDeadlineMs = criterion.deadline ? Date.parse(criterion.deadline) : Number.NaN;
  const criterionDeadlineExpired = Number.isFinite(criterionDeadlineMs) && criterionDeadlineMs <= nowMs;
  const revisionReason = specialistRevisionReasons?.get(criterion.id) ?? null;
  const revisionLocked = Boolean(editableCriteriaIds && !editableCriteriaIds.has(criterion.id));
  const locked = Boolean(entry?.locked || !editable || criterionDeadlineExpired || revisionLocked);
  const standardFiles = files.filter((item) => item.kind !== 'BONUS');
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

  const isSupplementary = criterion.type === 'Supplementary';
  const isColumnVisible = (columnId: string) => !visibleColumnIds || visibleColumnIds.includes(columnId);

  /** Không giữ giá trị vượt điểm tối đa trong state, tránh lưu nháp/nộp nhầm. */
  const updateScoreInput = (
    nextValue: string,
    maximum: number,
    label: string,
    setValue: (value: string) => void,
    setFieldError: (value: string) => void,
  ) => {
    if (nextValue === '') {
      setValue('');
      setFieldError('');
      return;
    }

    const numericValue = Number(nextValue);
    if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > maximum) {
      setFieldError(numericValue > maximum
        ? `${label} không được vượt quá ${maximum}.`
        : `${label} phải từ 0 đến ${maximum}.`);
      return;
    }

    setValue(nextValue);
    setFieldError('');
  };

  const validateRow = () => {
    if (locked) return true;
    if (isSupplementary) {
      setScoreError('');
      setBonusScoreError('');
      setExplanationError('');
      setEvidenceError('');
      if (!explanation.trim()) {
        setExplanationError('Vui lòng nhập nội dung diễn giải.');
        return false;
      }
      if (standardFiles.length === 0 && selectedFiles.length === 0) {
        setEvidenceError('Vui lòng chọn file minh chứng.');
        return false;
      }
      return true;
    }
    const nextScoreError = validateScore(score, criterion.maxScore, 'Điểm đề xuất', true);
    const nextBonusScoreError = validateScore(bonusScore, maxBonus, 'Điểm thưởng');
    setScoreError(nextScoreError);
    setBonusScoreError(nextBonusScoreError);
    setExplanationError('');
    setEvidenceError('');
    if (nextScoreError || nextBonusScoreError) {
      return false;
    }
    if (!explanation.trim()) {
      setExplanationError('Vui lòng nhập nội dung diễn giải.');
      return false;
    }
    if (standardFiles.length === 0 && selectedFiles.length === 0) {
      setEvidenceError('Vui lòng chọn file minh chứng.');
      return false;
    }
    if (selectedFiles.some((f) => f.size > MAX_FILE_SIZE)) {
      setEvidenceError('File không được vượt quá 20MB.');
      return false;
    }

    return true;
  };

  const collect = (): EvidenceFormValue | null => {
    if (locked) return null;
    return {
      proposedScore: isSupplementary ? 0 : Number(score || 0),
      proposedBonusScore: isSupplementary ? 0 : Number(bonusScore || 0),
      explanation: explanation.trim(),
      files: selectedFiles,
      bonusFiles: [],
    };
  };

  const markSaved = () => { if (!draft) setSelectedFiles([]); };

  useImperativeHandle(ref, () => ({ collect, markSaved, validate: validateRow }));

  return (
    <TableRow onClick={() => onSelect?.(rowEntry, criterion)} className={`${locked ? 'bg-muted/40' : 'hover:bg-surface-muted'} ${selected ? 'bg-primary/[0.06] hover:bg-primary/[0.08]' : ''} cursor-pointer`}>
      {isColumnVisible('name') && <TableCell className="align-top">
        <Tooltip>
          <TooltipTrigger render={<p className="line-clamp-2 whitespace-normal break-words text-left font-medium leading-5" />}>
            {criterion.name}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-normal break-words">{criterion.name}</TooltipContent>
        </Tooltip>
        {criterion.type === 'Supplementary' && <Badge className="mt-2 bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
        {revisionReason && <Badge className="mt-2 bg-warning/15 text-warning-foreground">Yêu cầu chỉnh sửa</Badge>}
      </TableCell>}
      {isColumnVisible('deadline') && <TableCell className="align-middle text-center text-sm text-muted-foreground">
        <Tooltip>
          <TooltipTrigger render={<span className="block truncate" />}>
            {criterion.deadline ? formatDate(criterion.deadline) : 'Chưa có hạn'}
          </TooltipTrigger>
          <TooltipContent>{criterion.deadline ? formatDate(criterion.deadline) : 'Chưa có hạn'}</TooltipContent>
        </Tooltip>
      </TableCell>}
      {isColumnVisible('proposedScore') && <TableCell className="align-top">
        {criterion.type === 'Supplementary' ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="relative">
            <Input aria-label={`Điểm đề xuất ${criterion.name}`} aria-invalid={Boolean(scoreError)} type="number" min={0} max={criterion.maxScore} step="0.25" value={score} disabled={locked || uploading} onChange={(event) => updateScoreInput(event.target.value, criterion.maxScore, 'Điểm đề xuất', setScore, setScoreError)} className="h-11 pr-12 text-right text-base font-semibold tabular-nums" />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center border-l pl-2 text-sm font-medium text-muted-foreground tabular-nums">/ {criterion.maxScore}</span>
          </div>
        )}
        {scoreError && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{scoreError}</p>}
      </TableCell>}
      {isColumnVisible('bonusScore') && <TableCell className="align-top">
        {criterion.type === 'Supplementary' ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="relative">
            <Input aria-label={`Điểm thưởng ${criterion.name}`} aria-invalid={Boolean(bonusScoreError)} type="number" min={0} max={maxBonus} step="0.25" value={bonusScore} disabled={locked || maxBonus === 0 || uploading} onChange={(event) => updateScoreInput(event.target.value, maxBonus, 'Điểm thưởng', setBonusScore, setBonusScoreError)} className="h-11 pr-12 text-right text-base font-semibold tabular-nums" />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center border-l pl-2 text-sm font-medium text-muted-foreground tabular-nums">/ {maxBonus}</span>
          </div>
        )}
        {bonusScoreError && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{bonusScoreError}</p>}
      </TableCell>}
      {isColumnVisible('explanation') && <TableCell className="align-middle">
        <Button type="button" variant="outline" className="w-full justify-center overflow-hidden" disabled={locked || uploading} onClick={(event) => { event.stopPropagation(); setExplanationDialogOpen(true); }}>
          <MessageSquareText className="size-4 shrink-0" />
          <TruncatedText value={explanation || 'Nhập nội dung diễn giải'} />
        </Button>
        {explanationError && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{explanationError}</p>}
        <EvidenceUploadDialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen} title="Nộp file minh chứng" description={criterion.name} value={selectedFiles} uploadedFiles={standardFiles} onConfirm={(nextFiles) => { setSelectedFiles(nextFiles); setEvidenceError(''); }} onDeleteUploaded={onDeleteEvidence} />
        <ExplanationDialog open={explanationDialogOpen} onOpenChange={setExplanationDialogOpen} criterionName={criterion.name} value={explanation} onConfirm={(value) => { setExplanation(value); setExplanationError(''); }} />
      </TableCell>}
      {isColumnVisible('evidence') && <TableCell className="align-middle">
        <div className="flex min-w-0 flex-col gap-2">
          <Button type="button" variant="outline" className="w-full justify-center overflow-hidden" disabled={locked || uploading} onClick={(event) => { event.stopPropagation(); setEvidenceDialogOpen(true); }}>
            <Upload className="size-4 shrink-0" />
            <TruncatedText value={standardFiles.length + selectedFiles.length > 0 ? 'Nộp thêm file' : 'Nộp file'} />
          </Button>
          {evidenceError && <p role="alert" className="text-xs font-medium text-destructive">{evidenceError}</p>}
        </div>
      </TableCell>}
      {isColumnVisible('specialistRevision') && <TableCell className="align-middle">
        <TruncatedText
          as="p"
          value={revisionReason || '—'}
          maxLines={4}
          className="whitespace-normal break-words text-sm leading-5 text-muted-foreground"
        />
      </TableCell>}
    </TableRow>
  );
});

export const LocalityScoreTable = forwardRef<LocalityScoreTableHandle, LocalityScoreTableProps>(function LocalityScoreTable({
  criteria,
  record,
  evidence,
  localityId,
  editable,
  nowMs,
  draftValues,
  selectedCriterionId,
  specialistRevisionReasons,
  editableCriteriaIds,
  uploading,
  toolbar,
  onSelect,
  onDeleteEvidence,
}, ref) {
  const rowRefs = useRef<Record<string, EditableRowHandle | null>>({});
  const columns = useMemo<ColumnDef<CriteriaItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nội dung tiêu chí',
      meta: { className: 'h-12 w-[250px] border-r border-white/30', disableTooltip: true },
    },
    {
      accessorKey: 'deadline',
      header: 'Hạn nộp',
      meta: { className: 'h-12 w-[130px] border-r border-white/30', disableTooltip: true },
    },
    {
      id: 'proposedScore',
      header: 'Điểm đề xuất ★',
      meta: { className: 'h-12 w-[130px] border-r border-white/30', align: 'center', disableTooltip: true },
    },
    {
      id: 'bonusScore',
      header: 'Điểm thưởng',
      meta: { className: 'h-12 w-[130px] border-r border-white/30', align: 'center', disableTooltip: true },
    },
    {
      id: 'explanation',
      header: 'Nội dung diễn giải ★',
      meta: { className: 'h-12 w-[280px] border-r border-white/30', disableTooltip: true },
    },
    {
      id: 'evidence',
      header: 'File minh chứng ★',
      meta: { className: 'h-12 w-[180px] border-r border-white/30', disableTooltip: true },
    },
    {
      id: 'specialistRevision',
      header: 'Nội dung chỉnh sửa Chuyên viên',
      meta: { className: 'h-12 w-[260px]', disableTooltip: true },
    },
  ], []);

  useImperativeHandle(ref, () => ({
    collectAll: () => {
      const map = new Map<string, EvidenceFormValue>();
      criteria.forEach((criterion) => {
        const value = rowRefs.current[criterion.id]?.collect();
        if (value) map.set(criterion.id, value);
      });
      return map;
    },
    markAllSaved: () => {
      criteria.forEach((criterion) => rowRefs.current[criterion.id]?.markSaved());
    },
    validateAll: () => criteria.every((criterion) => rowRefs.current[criterion.id]?.validate() ?? true),
  }));

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-primary bg-card px-4 py-3 shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
        <div>
          <h2 className="text-sm font-semibold">Nội dung tự đánh giá</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Nhập điểm trực tiếp; minh chứng và diễn giải được bổ sung qua từng nút trên dòng.</p>
        </div>
        <Badge variant="outline">{criteria.length} tiêu chí</Badge>
      </div>
      <DataTable
        columns={columns}
        data={criteria}
        pageSize={criteria.length || 10}
        showPagination={false}
        toolbar={toolbar}
        getRowId={(criterion) => criterion.id}
        selectedRowId={selectedCriterionId}
        className="-mt-px"
        tableWrapperClassName="!overflow-visible"
        tableClassName="min-w-[1360px] table-fixed [&_tbody_td]:border-r [&_tbody_td]:border-primary/15 [&_tbody_td:last-child]:border-r-0"
        renderRow={(row, { selected, visibleColumnIds }) => {
          const criterion = row.original;
          return (
            <EditableRow
              key={row.id}
              ref={(node) => { rowRefs.current[criterion.id] = node; }}
              criterion={criterion}
              entry={record.entries.find((item) => item.criteriaId === criterion.id)}
              files={evidence.filter((item) => item.localityId === localityId && item.criteriaId === criterion.id)}
              draft={draftValues?.get(criterion.id)}
              state={record.state}
              editable={editable}
              nowMs={nowMs}
              selected={selected}
              visibleColumnIds={visibleColumnIds}
              specialistRevisionReasons={specialistRevisionReasons}
              editableCriteriaIds={editableCriteriaIds}
              uploading={uploading}
              onSelect={onSelect}
              onDeleteEvidence={onDeleteEvidence}
            />
          );
        }}
      />
    </div>
  );
});
