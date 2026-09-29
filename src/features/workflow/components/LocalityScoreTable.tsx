import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownToLine, FileText, MessageSquareText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DataTable, FilePreviewDialog, FileUpload, FormDialog, TruncatedText } from '@/components/core';
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
const MAX_FILES_PER_CRITERION = 10;

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
  scoreFieldsLocked?: boolean;
  editDisabledReason?: string;
  nowMs: number;
  draftValues?: Map<string, EvidenceFormValue>;
  selectedCriterionId?: string;
  /** Lý do chỉnh sửa theo từng tiêu chí được Chuyên viên yêu cầu. */
  specialistRevisionReasons?: ReadonlyMap<string, string>;
  /** Tệp của yêu cầu chỉnh sửa Chuyên viên mới nhất, gắn theo tiêu chí. */
  specialistRevisionFiles?: ReadonlyMap<string, SpecialistRevisionFile[]>;
  onPreviewRevisionFile?: (file: SpecialistRevisionFile) => void;
  /** Khi có danh sách này, chỉ các tiêu chí được yêu cầu mới cho phép chỉnh sửa. */
  editableCriteriaIds?: ReadonlySet<string> | null;
  onCompletionChange?: (criteriaId: string, complete: boolean) => void;
  uploading?: boolean;
  toolbar?: ReactNode;
  onSelect?: (entry: ScoreEntry, criterion: CriteriaItem) => void;
  onDeleteEvidence?: (id: string) => void;
  onPreviewEvidenceFile?: (file: Evidence) => void;
}

export interface SpecialistRevisionFile {
  id: string;
  originalName: string;
  displayName: string | null;
  url: string | null;
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

function ScorePlaceholder({ label }: { label: string }) {
  return (
    <div aria-label={`${label}: không áp dụng`} className="mx-auto flex h-11 w-[108px] shrink-0 items-center justify-center rounded-lg border border-input bg-muted/30 text-base font-semibold tabular-nums text-muted-foreground">
      —
    </div>
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
      <p className="text-xs text-muted-foreground">Nội dung sẽ được lưu cùng điểm và file khi bạn bấm “Lưu nháp” ở cuối trang.</p>
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
  editDisabledReason,
  nowMs,
  uploading = false,
  onSelect,
  onDeleteEvidence,
  selected = false,
  visibleColumnIds,
  scoreFieldsLocked = false,
  specialistRevisionReasons,
  specialistRevisionFiles,
  onPreviewRevisionFile,
  onPreviewEvidenceFile,
  editableCriteriaIds,
  onCompletionChange,
}, ref) {
  const [score, setScore] = useState('');
  const [bonusScore, setBonusScore] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [dialogFiles, setDialogFiles] = useState<File[]>([]);
  const [explanationError, setExplanationError] = useState('');
  const [evidenceError, setEvidenceError] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [bonusScoreError, setBonusScoreError] = useState('');
  const [explanationDialogOpen, setExplanationDialogOpen] = useState(false);

  useEffect(() => {
    const proposedScore = scoreFieldsLocked
      ? entry?.proposedScore ?? entry?.value
      : draft?.proposedScore ?? entry?.proposedScore;
    const proposedBonusScore = scoreFieldsLocked
      ? entry?.proposedBonusScore
      : draft?.proposedBonusScore ?? entry?.proposedBonusScore;
    setScore(proposedScore?.toString() ?? '');
    setBonusScore(proposedBonusScore?.toString() ?? '0');
    setExplanation(draft?.explanation ?? entry?.explanation ?? '');
    setSelectedFiles(draft?.files ?? []);
    setExplanationError('');
    setEvidenceError('');
    setScoreError('');
    setBonusScoreError('');
  }, [draft, entry?.explanation, entry?.proposedBonusScore, entry?.proposedScore, entry?.value, scoreFieldsLocked]);

  const maxBonus = criterion.bonusScore ?? 0;
  const criterionDeadlineMs = criterion.deadline ? Date.parse(criterion.deadline) : Number.NaN;
  const criterionDeadlineExpired = Number.isFinite(criterionDeadlineMs) && criterionDeadlineMs <= nowMs;
  const revisionReason = specialistRevisionReasons?.get(criterion.id) ?? null;
  const revisionFiles = specialistRevisionFiles?.get(criterion.id) ?? [];
  const revisionLocked = Boolean(editableCriteriaIds && !editableCriteriaIds.has(criterion.id));
  const locked = Boolean(entry?.locked || !editable || criterionDeadlineExpired || revisionLocked);
  const standardFiles = files.filter((item) => item.kind !== 'BONUS');
  const availableEvidenceSlots = Math.max(0, MAX_FILES_PER_CRITERION - standardFiles.length);
  const evidenceFileError = dialogFiles.some((file) => file.size > MAX_FILE_SIZE)
    ? 'Mỗi file minh chứng không được vượt quá 20MB.'
    : dialogFiles.length > availableEvidenceSlots
      ? `Tiêu chí chỉ được đính kèm tối đa ${MAX_FILES_PER_CRITERION} file.`
      : '';
  const evidenceDisabledReason = uploading
    ? 'Đang lưu dữ liệu, vui lòng đợi.'
    : !editable
      ? editDisabledReason ?? 'Hồ sơ hiện không cho phép chỉnh sửa.'
      : criterionDeadlineExpired
        ? 'Tiêu chí đã quá hạn nộp, không thể thêm file minh chứng.'
        : revisionLocked
          ? 'Tiêu chí này không nằm trong yêu cầu chỉnh sửa của Chuyên viên.'
          : entry?.locked
            ? 'Tiêu chí này đã bị khóa, không thể thêm file minh chứng.'
            : standardFiles.length + selectedFiles.length >= MAX_FILES_PER_CRITERION
              ? `Đã chọn tối đa ${MAX_FILES_PER_CRITERION} file minh chứng cho tiêu chí này.`
              : undefined;
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
  const rowComplete = locked || (
    (isSupplementary || (!validateScore(score, criterion.maxScore, 'Điểm đề xuất', true)
      && !validateScore(bonusScore, maxBonus, 'Điểm thưởng')))
    && Boolean(explanation.trim())
    && standardFiles.length + selectedFiles.length > 0
    && standardFiles.length + selectedFiles.length <= MAX_FILES_PER_CRITERION
    && !selectedFiles.some((file) => file.size > MAX_FILE_SIZE)
  );

  useEffect(() => {
    onCompletionChange?.(criterion.id, rowComplete);
  }, [criterion.id, onCompletionChange, rowComplete]);

  const openEvidenceDialog = () => {
    setDialogFiles(selectedFiles);
    setEvidenceDialogOpen(true);
  };
  const confirmEvidenceFiles = (event: FormEvent) => {
    event.preventDefault();
    if (evidenceFileError) return;
    setSelectedFiles(dialogFiles);
    setEvidenceError('');
    setEvidenceDialogOpen(false);
  };

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
    if (standardFiles.length + selectedFiles.length > MAX_FILES_PER_CRITERION) {
      setEvidenceError(`Tiêu chí chỉ được đính kèm tối đa ${MAX_FILES_PER_CRITERION} file.`);
      return false;
    }
    if (selectedFiles.some((file) => file.size > MAX_FILE_SIZE)) {
      setEvidenceError('File không được vượt quá 20MB.');
      return false;
    }
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
        setEvidenceError('Vui lòng nộp ít nhất một file minh chứng.');
        return false;
      }
      return true;
    }
    const nextScoreError = scoreFieldsLocked ? '' : validateScore(score, criterion.maxScore, 'Điểm đề xuất', true);
    const nextBonusScoreError = scoreFieldsLocked ? '' : validateScore(bonusScore, maxBonus, 'Điểm thưởng');
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
      setEvidenceError('Vui lòng nộp ít nhất một file minh chứng.');
      return false;
    }
    return true;
  };

  const collect = (): EvidenceFormValue | null => {
    if (locked) return null;
    const proposedScore = scoreFieldsLocked ? entry?.proposedScore ?? entry?.value ?? 0 : Number(score || 0);
    const proposedBonusScore = scoreFieldsLocked ? entry?.proposedBonusScore ?? 0 : Number(bonusScore || 0);
    return {
      proposedScore: isSupplementary ? 0 : proposedScore,
      proposedBonusScore: isSupplementary ? 0 : proposedBonusScore,
      explanation: explanation.trim(),
      files: selectedFiles,
      bonusFiles: [],
    };
  };

  const markSaved = () => { if (!draft) setSelectedFiles([]); };

  useImperativeHandle(ref, () => ({ collect, markSaved, validate: validateRow }));

  return (
    <TableRow onClick={() => onSelect?.(rowEntry, criterion)} className={`${locked ? 'bg-muted/40' : 'hover:bg-surface-muted'} ${selected ? 'bg-primary/[0.06] hover:bg-primary/[0.08]' : ''} cursor-pointer`}>
      {isColumnVisible('name') && <TableCell className="align-middle">
        <Tooltip>
          <TooltipTrigger render={<p className="line-clamp-5 whitespace-normal break-words text-left font-medium leading-5" />}>
            {criterion.name}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-normal break-words">{criterion.name}</TooltipContent>
        </Tooltip>
        {criterion.type === 'Supplementary' && <Badge className="mt-2 bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
        {(revisionReason || revisionFiles.length > 0) && <Badge className="mt-2 bg-warning/15 text-warning-foreground">Yêu cầu chỉnh sửa</Badge>}
      </TableCell>}
      {isColumnVisible('deadline') && <TableCell className="align-middle text-center text-sm text-muted-foreground">
        <Tooltip>
          <TooltipTrigger render={<span className="block truncate" />}>
            {criterion.deadline ? formatDate(criterion.deadline) : 'Chưa có hạn'}
          </TooltipTrigger>
          <TooltipContent>{criterion.deadline ? formatDate(criterion.deadline) : 'Chưa có hạn'}</TooltipContent>
        </Tooltip>
      </TableCell>}
      {isColumnVisible('proposedScore') && <TableCell className="align-middle">
        {criterion.type === 'Supplementary' ? (
          <ScorePlaceholder label="Điểm đề xuất" />
        ) : (
          <div className="relative mx-auto w-full max-w-[108px]">
            <Input aria-label={`Điểm đề xuất ${criterion.name}`} aria-invalid={Boolean(scoreError)} type="number" min={0} max={criterion.maxScore} step="0.25" value={score} disabled={locked || scoreFieldsLocked || uploading} onChange={(event) => updateScoreInput(event.target.value, criterion.maxScore, 'Điểm đề xuất', setScore, setScoreError)} className="h-11 pr-14 text-center text-base font-semibold tabular-nums" />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center whitespace-nowrap border-l pl-2 text-sm font-medium text-muted-foreground tabular-nums">/ {criterion.maxScore}</span>
          </div>
        )}
        {scoreError && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{scoreError}</p>}
      </TableCell>}
      {isColumnVisible('bonusScore') && <TableCell className="align-middle">
        {criterion.type === 'Supplementary' ? (
          <ScorePlaceholder label="Điểm thưởng" />
        ) : (
          <div className="relative mx-auto w-full max-w-[108px]">
            <Input aria-label={`Điểm thưởng ${criterion.name}`} aria-invalid={Boolean(bonusScoreError)} type="number" min={0} max={maxBonus} step="0.25" value={bonusScore} disabled={locked || scoreFieldsLocked || maxBonus === 0 || uploading} onChange={(event) => updateScoreInput(event.target.value, maxBonus, 'Điểm thưởng', setBonusScore, setBonusScoreError)} className="h-11 pr-14 text-center text-base font-semibold tabular-nums" />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center whitespace-nowrap border-l pl-2 text-sm font-medium text-muted-foreground tabular-nums">/ {maxBonus}</span>
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
        <ExplanationDialog open={explanationDialogOpen} onOpenChange={setExplanationDialogOpen} criterionName={criterion.name} value={explanation} onConfirm={(value) => { setExplanation(value); setExplanationError(''); }} />
      </TableCell>}
      {isColumnVisible('evidence') && <TableCell className="align-middle overflow-hidden">
        <div className="min-w-0 max-w-full space-y-2">
          {evidenceError && <p role="alert" className="text-xs font-medium text-destructive">{evidenceError}</p>}
          {selectedFiles.length > 0 && (
            <ul className="min-w-0 space-y-1.5">
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-md border border-primary/25 bg-primary/5 px-2 py-1.5">
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <TruncatedText as="span" value={file.name} className="block text-xs font-medium" />
                    <span className="block text-[11px] font-medium text-primary">{Math.ceil(file.size / 1024)} KB · Chờ lưu</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 text-destructive"
                    disabled={locked || uploading}
                    title="Bỏ file đã chọn"
                    aria-label={`Bỏ file ${file.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                      setEvidenceError('');
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {/* <p className="whitespace-normal break-words text-xs text-muted-foreground">File sẽ được tải lên khi bạn bấm “Lưu nháp”.</p> */}
          {standardFiles.length > 0 && (
            <ul className="min-w-0 space-y-1.5">
              {standardFiles.map((item) => (
                <li key={item.id} className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-md border border-border bg-card px-2 py-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={`Xem file ${item.fileName}`}
                    aria-label={`Xem file ${item.fileName}`}
                    onClick={(event) => { event.stopPropagation(); onPreviewEvidenceFile?.(item); }}
                  >
                    <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <TruncatedText as="span" value={item.fileName} className="block text-xs font-medium hover:text-primary hover:underline" />
                      <span className="block text-[11px] text-muted-foreground">{item.fileSize ? `${Math.ceil(item.fileSize / 1024)} KB` : 'Tệp minh chứng'} · {formatDate(item.uploadedAt)}</span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0"
                    title="Tải file về máy"
                    aria-label={`Tải file ${item.fileName} về máy`}
                    onClick={(event) => { event.stopPropagation(); void downloadFile(item.id, item.fileName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.')); }}
                  >
                    <ArrowDownToLine className="size-4" />
                  </Button>
                  {onDeleteEvidence && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-destructive"
                      disabled={locked || uploading}
                      title="Xóa minh chứng"
                      aria-label={`Xóa minh chứng ${item.fileName}`}
                      onClick={(event) => { event.stopPropagation(); onDeleteEvidence(item.id); }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {/* Hồ sơ đã khóa (đã nộp/đang duyệt/quá hạn) → ẩn nút thay vì hiện disabled. */}
          {(!locked || uploading) && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center border-dashed border-primary bg-primary/5 font-semibold text-primary hover:bg-primary/10"
              disabled={Boolean(evidenceDisabledReason)}
              disabledReason={evidenceDisabledReason}
              title="Nộp file minh chứng"
              aria-label={`Nộp file minh chứng cho ${criterion.name}`}
              onClick={(event) => { event.stopPropagation(); openEvidenceDialog(); }}
            >
              <Upload className="size-4" />
              Nộp file
            </Button>
          )}
          <FormDialog
            open={evidenceDialogOpen}
            onOpenChange={(open) => {
              setEvidenceDialogOpen(open);
              if (open) setDialogFiles(selectedFiles);
            }}
            title="Điều kiện nộp file minh chứng"
            description={criterion.name}
            onSubmit={confirmEvidenceFiles}
            submitLabel="Xác nhận file"
            cancelLabel="Hủy"
            submitDisabled={uploading || Boolean(evidenceFileError)}
            size="max-w-2xl sm:max-w-2xl"
          >
            <div className="rounded-md border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">Vui lòng kiểm tra các điều kiện sau:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Mỗi file tối đa 20MB.</li>
                <li>Tối đa {MAX_FILES_PER_CRITERION} file cho một tiêu chí; đã nộp {standardFiles.length}, đang chọn {dialogFiles.length} file.</li>
                <li>Cần có ít nhất một file minh chứng trước khi gửi hồ sơ.</li>
              </ul>
            </div>
            <FileUpload
              value={dialogFiles}
              onChange={setDialogFiles}
              multiple
              maxSizeMb={20}
              maxFiles={availableEvidenceSlots}
              disabled={uploading || availableEvidenceSlots === 0}
              uploading={uploading}
              error={evidenceFileError || undefined}
            />
            <p className="text-xs text-muted-foreground">File mới sẽ được tải lên khi bạn bấm “Lưu nháp”. Sau đó, bấm “Gửi yêu cầu” để nộp hồ sơ.</p>
          </FormDialog>
        </div>
      </TableCell>}
      {isColumnVisible('specialistRevision') && <TableCell className="align-middle">
        <div className="space-y-1.5">
          <TruncatedText
            as="p"
            value={revisionReason || '—'}
            maxLines={4}
            className="whitespace-normal break-words text-sm leading-5 text-muted-foreground"
          />
          {revisionFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {revisionFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={(event) => { event.stopPropagation(); onPreviewRevisionFile?.(file); }}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-primary hover:bg-muted"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{file.displayName || file.originalName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
  scoreFieldsLocked = false,
  editDisabledReason,
  nowMs,
  draftValues,
  selectedCriterionId,
  specialistRevisionReasons,
  specialistRevisionFiles,
  onPreviewRevisionFile,
  editableCriteriaIds,
  onCompletionChange,
  uploading,
  toolbar,
  onSelect,
  onDeleteEvidence,
}, ref) {
  const rowRefs = useRef<Record<string, EditableRowHandle | null>>({});
  const [previewFile, setPreviewFile] = useState<{ id: string; originalName: string } | null>(null);
  const columns = useMemo<ColumnDef<CriteriaItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nội dung tiêu chí',
      size: 250,
      meta: { className: 'h-12 w-[250px] border-r border-white/30', disableTooltip: true },
    },
    {
      accessorKey: 'deadline',
      header: 'Hạn nộp',
      size: 130,
      meta: { className: 'h-12 w-[130px] border-r border-white/30', disableTooltip: true },
    },
    {
      id: 'proposedScore',
      header: 'Điểm đề xuất ★',
      size: 130,
      meta: { className: 'h-12 w-[130px] border-r border-white/30', align: 'center', disableTooltip: true },
    },
    {
      id: 'bonusScore',
      header: 'Điểm thưởng',
      size: 130,
      meta: { className: 'h-12 w-[130px] border-r border-white/30', align: 'center', disableTooltip: true },
    },
    {
      id: 'explanation',
      header: 'Nội dung diễn giải ★',
      size: 280,
      meta: { className: 'h-12 w-[280px] border-r border-white/30', disableTooltip: true },
    },
    {
      id: 'evidence',
      header: 'File minh chứng ★',
      size: 320,
      meta: { className: 'h-12 w-[320px] min-w-[320px] border-r border-white/30', disableTooltip: true },
    },
    {
      id: 'specialistRevision',
      header: 'Nội dung chỉnh sửa',
      size: 260,
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
          <p className="mt-0.5 text-xs text-muted-foreground">{scoreFieldsLocked ? 'Đang xử lý yêu cầu chỉnh sửa: điểm đề xuất và điểm thưởng được giữ nguyên; bạn vẫn có thể cập nhật minh chứng và diễn giải.' : 'Nhập điểm trực tiếp; minh chứng và diễn giải được bổ sung qua từng nút trên dòng.'}</p>
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
        detachedStickyHeader
        tableWrapperClassName="overflow-x-auto"
        tableClassName="min-w-[1500px] table-fixed [&_tbody_td]:border-r [&_tbody_td]:border-primary/15 [&_tbody_td:last-child]:border-r-0"
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
              scoreFieldsLocked={scoreFieldsLocked}
              editDisabledReason={editDisabledReason}
              nowMs={nowMs}
              selected={selected}
              visibleColumnIds={visibleColumnIds}
              specialistRevisionReasons={specialistRevisionReasons}
              specialistRevisionFiles={specialistRevisionFiles}
              onPreviewRevisionFile={onPreviewRevisionFile}
              editableCriteriaIds={editableCriteriaIds}
              onCompletionChange={onCompletionChange}
              uploading={uploading}
              onSelect={onSelect}
              onDeleteEvidence={onDeleteEvidence}
              onPreviewEvidenceFile={(file) => setPreviewFile({ id: file.id, originalName: file.fileName })}
            />
          );
        }}
      />
      <FilePreviewDialog file={previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} />
    </div>
  );
});
