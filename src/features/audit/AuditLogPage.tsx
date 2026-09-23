import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  History,
  Search,
  X,
} from 'lucide-react';
import { AppDialog, Button, EmptyState, FilePreviewDialog, FilterDropdown, FilterSelect, PageHeader, PageLoading } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import { downloadFile, getFilePreviewUrl } from '@/features/files/api/filesApi';
import { auditLogsApi, type AuditLogItem, type AuditLogQuery } from './api/auditLogsApi';

const PAGE_SIZE = 20;

const actionLabels: Record<string, string> = {
  Created: 'thêm mới',
  Updated: 'cập nhật',
  Deleted: 'xóa',
  Published: 'công bố',
};

const entityLabels: Record<string, string> = {
  CriteriaGroup: 'nhóm tiêu chí',
  Criteria: 'tiêu chí',
  Submission: 'hồ sơ thi đua',
  SubmissionResult: 'kết quả tiêu chí',
  SubmissionHistory: 'lịch sử hồ sơ',
  ApprovalHistory: 'lịch sử phê duyệt',
  EmulationClassification: 'xếp loại thi đua',
  User: 'tài khoản người dùng',
  UserAuth: 'thông tin xác thực',
  Role: 'vai trò người dùng',
  FileEntity: 'tệp tin',
  FileVariant: 'phiên bản tệp tin',
  PublicationBatch: 'đợt công bố',
  FinalDecision: 'quyết định cuối cùng',
};

const moduleLabels: Record<string, string> = {
  Emulation: 'Tiêu chí thi đua',
  Submission: 'Hồ sơ thi đua',
  Files: 'Tài liệu',
  ResultPublication: 'Công bố kết quả',
  System: 'Hệ thống',
};

function getActionLabel(action: string) {
  return actionLabels[action] ?? action.toLowerCase();
}

function getEntityLabel(entityName: string | null) {
  return entityName ? entityLabels[entityName] ?? entityName : 'dữ liệu hệ thống';
}

const fieldLabels: Record<string, string> = {
  Content: 'Nội dung',
  Name: 'Tên',
  Description: 'Mô tả',
  MaxPoint: 'Điểm tối đa',
  MaxBonusPoint: 'Điểm thưởng tối đa',
  SnapshotMaxPoint: 'Điểm tối đa',
  SnapshotMaxBonusPoint: 'Điểm thưởng tối đa',
  OfficialReason: 'Lý do chính thức',
  Deadline: 'Hạn nộp',
  Status: 'Trạng thái',
  Type: 'Loại',
  Note: 'Ghi chú',
  IsApplied: 'Trạng thái áp dụng',
  Point: 'Điểm',
  BonusPoint: 'Điểm thưởng',
  CurrentStage: 'Giai đoạn hồ sơ',
  SubmittedAt: 'Thời điểm nộp',
  FileName: 'Tên tệp',
  OriginalName: 'Tên tệp gốc',
  FileSize: 'Dung lượng',
  ContentType: 'Loại tệp',
  Explanation: 'Giải thích',
  ReviewStatus: 'Trạng thái xem xét',
  CriteriaId: 'Tiêu chí',
  CriteriaGroupId: 'Nhóm tiêu chí',
  Action: 'Hành động',
  Reason: 'Lý do',
  Level: 'Cấp xử lý',
  ActionLevel: 'Cấp xử lý',
  ActorName: 'Người thực hiện',
  ChangedData: 'Dữ liệu thay đổi',
  SubmissionResultIds: 'Kết quả tiêu chí',
  TotalFinalPoint: 'Tổng điểm chính thức',
  TotalProposedPoint: 'Tổng điểm đề xuất',
  OfficialPoint: 'Điểm chính thức',
  OfficialBonusPoint: 'Điểm thưởng chính thức',
};

/** Màu chữ theo loại hành động: xanh lá=tạo, vàng=sửa, đỏ=xóa — chỉ tô chữ, không badge. */
const actionConfig: Record<string, { label: string; text: string; accent: string }> = {
  Created: { label: 'Tạo mới', text: 'text-emerald-700', accent: 'border-l-emerald-500' },
  Updated: { label: 'Cập nhật', text: 'text-amber-600', accent: 'border-l-amber-500' },
  Deleted: { label: 'Xóa', text: 'text-rose-600', accent: 'border-l-rose-500' },
  Published: { label: 'Công bố', text: 'text-sky-700', accent: 'border-l-sky-500' },
};

const defaultActionStyle = {
  label: '',
  text: 'text-foreground/70',
  accent: 'border-l-border',
};

/** Nhãn + màu theo hành động nghiệp vụ (actionKind từ backend) — phân biệt thao tác của từng role.
 *  `verb` là dạng ngắn để ghép với cấp (vd "Lãnh đạo duyệt"); chỉ cần cho thao tác có actionLevel. */
const businessActionConfig: Record<string, { label: string; verb?: string; text: string; accent: string }> = {
  submit: { label: 'Nộp điểm', text: 'text-emerald-700', accent: 'border-l-emerald-500' },
  upload: { label: 'Tải lên', text: 'text-emerald-700', accent: 'border-l-emerald-500' },
  approve: { label: 'Phê duyệt', verb: 'duyệt', text: 'text-emerald-700', accent: 'border-l-emerald-500' },
  finalize: { label: 'Kết thúc duyệt', verb: 'phê duyệt', text: 'text-emerald-700', accent: 'border-l-emerald-500' },
  rescore: { label: 'Chấm lại', verb: 'chấm lại', text: 'text-sky-700', accent: 'border-l-sky-500' },
  review: { label: 'Thẩm định', verb: 'thẩm định', text: 'text-sky-700', accent: 'border-l-sky-500' },
  add_criteria: { label: 'Bổ sung tiêu chí', verb: 'bổ sung tiêu chí', text: 'text-sky-700', accent: 'border-l-sky-500' },
  publish: { label: 'Công bố', verb: 'công bố', text: 'text-sky-700', accent: 'border-l-sky-500' },
  update_score: { label: 'Cập nhật điểm', text: 'text-amber-600', accent: 'border-l-amber-500' },
  stage_transition: { label: 'Chuyển giai đoạn', text: 'text-amber-600', accent: 'border-l-amber-500' },
  request_revision: { label: 'Yêu cầu sửa', verb: 'yêu cầu sửa', text: 'text-rose-600', accent: 'border-l-rose-500' },
  delete_file: { label: 'Xóa tệp', text: 'text-rose-600', accent: 'border-l-rose-500' },
};

/** Ưu tiên nhãn/màu theo hành động nghiệp vụ (actionKind); ghép cấp (actionLevel) → "Lãnh đạo duyệt"; fallback CRUD. */
function getActionDisplay(item: Pick<AuditLogItem, 'action' | 'actionKind' | 'actionLevel'>) {
  const business = item.actionKind ? businessActionConfig[item.actionKind] : undefined;
  if (business) {
    const label = item.actionLevel && business.verb ? `${item.actionLevel} ${business.verb}` : business.label;
    return { ...business, label };
  }
  return actionConfig[item.action] ?? defaultActionStyle;
}

/** Thứ tự ưu tiên hiển thị field trong bảng chi tiết: định danh → điểm → trạng thái → ghi chú → tệp. */
const fieldPriority: Record<string, number> = {
  Name: 0, Content: 1, Description: 2,
  CriteriaGroupId: 3, CriteriaId: 4,
  Point: 10, BonusPoint: 11, OfficialPoint: 12, OfficialBonusPoint: 13,
  MaxPoint: 14, MaxBonusPoint: 15, SnapshotMaxPoint: 14, SnapshotMaxBonusPoint: 15,
  TotalProposedPoint: 16, TotalFinalPoint: 17,
  Status: 20, ReviewStatus: 21, CurrentStage: 22, IsApplied: 23,
  Explanation: 30, Note: 31, OfficialReason: 32,
  Deadline: 40, SubmittedAt: 41,
  FileName: 50, OriginalName: 51, FileSize: 52, ContentType: 53,
};

// RevisionRound là counter nội bộ của SubmissionHistory (sequence toàn cục) — không có nghĩa với người xem.
const noiseAuditFields = new Set(['Id', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy', 'SubmissionId', 'EntityId', 'RevisionRound', 'revisionRound']);

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i;

function parseJsonRecord(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Danh từ cho mảng ID theo tên key — render "N kết quả tiêu chí" thay vì liệt kê GUID. */
const idListNouns: Record<string, string> = {
  submissionresultids: 'kết quả tiêu chí',
  submissionids: 'hồ sơ',
  criteriaids: 'tiêu chí',
  criteriagroupids: 'nhóm tiêu chí',
  fileids: 'tệp tin',
  userids: 'người dùng',
};

/** Giá trị JSON (object/array hoặc chuỗi JSON) → text đọc được. Trả null nếu không phải JSON cấu trúc. */
function formatStructuredValue(value: unknown, keyHint?: string): string | null {
  let parsed = value;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return 'Không có';
    if (parsed.every((v) => typeof v === 'string' && GUID_RE.test(v))) {
      const noun = (keyHint && idListNouns[keyHint.toLowerCase()]) ?? 'mục';
      return `${parsed.length} ${noun}`;
    }
    return parsed.map((v) => formatStructuredValue(v) ?? String(v)).join(', ');
  }
  if (parsed && typeof parsed === 'object') {
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 0) return 'Không có';
    return entries
      .map(([key, v]) => `${fieldLabels[key] ?? key}: ${formatStructuredValue(v, key) ?? formatAuditValue(key, v)}`)
      .join(' · ');
  }
  return null;
}

function formatAuditValue(field: string, value: unknown) {
  if (value === null || value === undefined || value === '') return 'Chưa có';

  if (field === 'Status' && typeof value === 'number') {
    return ({ 0: 'Nháp', 1: 'Đã áp dụng' } as Record<number, string>)[value] ?? String(value);
  }

  if (field === 'CurrentStage' && typeof value === 'number') {
    return ({ 0: 'Nháp', 1: 'Đã nộp' } as Record<number, string>)[value] ?? String(value);
  }

  if (field === 'FileSize' && typeof value === 'number') {
    return value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.round(value / 1024)} KB`;
  }

  if ((field === 'Deadline' || field.endsWith('At')) && typeof value === 'string') {
    return formatDateTime(value);
  }

  if (typeof value === 'number') return value.toLocaleString('vi-VN');
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  const structured = formatStructuredValue(value, field);
  if (structured !== null) return structured;
  return String(value);
}

/** BE display đôi khi trả số thập phân dạng chuỗi ("10.00") — normalize về dạng gọn. */
function normDisplay(value: string | null) {
  return value !== null && /^-?\d+\.\d+$/.test(value) ? Number(value).toLocaleString('vi-VN') : value;
}

function getMeaningfulDiff(item: AuditLogItem) {
  if (item.action !== 'Updated') return [];
  const changedData = parseJsonRecord(item.changedData);
  if (!changedData) return [];
  return Object.entries(changedData)
    .filter(([field]) => !noiseAuditFields.has(field))
    .map(([field, value]) => {
      const change = value as { before?: unknown; after?: unknown };
      return {
        field,
        label: fieldLabels[field] ?? field,
        before: normDisplay(formatAuditValue(field, change?.before)) ?? 'Chưa có',
        after: normDisplay(formatAuditValue(field, change?.after)) ?? 'Chưa có',
      };
    });
}

// Ưu tiên `changes` BE đã enrich (label + display tiếng Việt), fallback tự parse changedData.
function getDisplayChanges(item: AuditLogItem) {
  const rows = item.changes?.length
    ? item.changes
        .filter((change) => !noiseAuditFields.has(change.field))
        .map((change) => ({
          field: change.field,
          label: fieldLabels[change.field] ?? change.label ?? change.field,
          before: normDisplay(formatStructuredValue(change.beforeDisplay, change.field) ?? change.beforeDisplay ?? formatAuditValue(change.field, change.before)) ?? 'Chưa có',
          after: normDisplay(formatStructuredValue(change.afterDisplay, change.field) ?? change.afterDisplay ?? formatAuditValue(change.field, change.after)) ?? 'Chưa có',
        }))
        // Bỏ field không đổi (context như CriteriaGroupId X→X) và field null→null.
        .filter((field) => field.before !== field.after)
    : getMeaningfulDiff(item);
  return rows.sort((a, b) => (fieldPriority[a.field] ?? 100) - (fieldPriority[b.field] ?? 100));
}

function getActorLabel(actor: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(actor) ? 'Người dùng hệ thống' : actor || 'Hệ thống tự động';
}

/** Tách giờ / ngày để hiển thị 2 dòng, dễ quét hơn chuỗi dài. */
function formatTimeParts(value: string) {
  const d = new Date(value);
  return {
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
}

/** Dòng log FileEntity: render file cũ → mới (URL presigned sẵn từ BE), fallback fetch theo id. */
function AuditFileRow({ item }: { item: AuditLogItem }) {
  const after = parseJsonRecord(item.afterData) ?? parseJsonRecord(item.beforeData) ?? {};
  const before = parseJsonRecord(item.beforeData) ?? {};
  const newFile = item.files?.[0];
  const oldFile = item.beforeFiles?.[0];
  const fileName = newFile?.displayName ?? newFile?.originalName
    ?? String(after.OriginalName ?? after.DisplayName ?? 'Tệp tin');
  const beforeFileName = oldFile?.displayName ?? oldFile?.originalName
    ?? (typeof before.OriginalName === 'string' ? before.OriginalName : null);
  const isImage = Boolean(newFile?.mimeType?.startsWith('image/')) || IMAGE_EXT_RE.test(fileName);
  const fileId = newFile?.id ?? item.entityId ?? '';
  const beforeFileId = oldFile?.id
    ?? (typeof before.Id === 'string' && before.Id !== fileId ? before.Id : '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [beforeThumb, setBeforeThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage || !fileId || newFile?.url) return;
    let cancelled = false;
    getFilePreviewUrl(fileId)
      .then((url) => { if (!cancelled) setThumb(url); })
      .catch(() => { /* giữ icon fallback */ });
    return () => { cancelled = true; };
  }, [fileId, isImage, newFile?.url]);

  useEffect(() => {
    if (!isImage || !beforeFileId || oldFile?.url) return;
    let cancelled = false;
    getFilePreviewUrl(beforeFileId)
      .then((url) => { if (!cancelled) setBeforeThumb(url); })
      .catch(() => { /* giữ icon fallback */ });
    return () => { cancelled = true; };
  }, [beforeFileId, isImage, oldFile?.url]);

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      await downloadFile(fileId, fileName);
    } catch { /* bỏ qua lỗi tải */ }
  };

  const showOld = Boolean(oldFile ?? beforeFileId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-3.5 py-3 shadow-sm">
      <span className="flex min-w-0 items-center gap-2 text-sm">
        {showOld && (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
              {isImage && (oldFile?.url ?? beforeThumb)
                ? <img src={oldFile?.url ?? beforeThumb ?? ''} alt={beforeFileName ?? ''} className="size-8 rounded-md object-cover opacity-50" />
                : <FileText className="size-3.5 shrink-0 text-muted-foreground" />}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground line-through">{beforeFileName ?? '—'}</span>
            <span className="shrink-0 text-xs text-muted-foreground">→</span>
          </>
        )}
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
          {isImage && (newFile?.url ?? thumb)
            ? <img src={newFile?.url ?? thumb ?? ''} alt={fileName} className="size-8 rounded-md object-cover" />
            : <FileText className="size-3.5 text-primary/70" />}
        </span>
        <span className="truncate font-medium text-foreground">{fileName}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-foreground/70">
        {formatAuditValue('FileSize', newFile?.sizeBytes ?? after.SizeBytes)}
        {fileId && (
          <>
            <button
              type="button"
              onClick={() => { setPreviewFileId(fileId); setPreviewOpen(true); }}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <FileText className="size-3.5" />Xem
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Download className="size-3.5" />Tải xuống
            </button>
          </>
        )}
        {beforeFileId && (
          <button
            type="button"
            onClick={() => { setPreviewFileId(beforeFileId); setPreviewOpen(true); }}
            className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-primary hover:underline"
          >
            Bản cũ
          </button>
        )}
      </span>
      <FilePreviewDialog
        file={previewOpen && previewFileId ? { id: previewFileId, displayName: fileName, originalName: fileName } : null}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

interface DiffField {
  field: string;
  label: string;
  before: string;
  after: string;
}

/** Bảng chi tiết: luôn 3 cột Trường | Giá trị cũ | Giá trị mới. Giá trị render dạng chip có viền cho gọn, ô trống hiển thị "—" mờ. */
function DiffTable({ diff }: { diff: DiffField[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="w-[200px] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Trường</th>
            <th className="w-[38%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Giá trị cũ</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Giá trị mới</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {diff.map((field) => {
            const hasBefore = field.before !== 'Chưa có';
            const hasAfter = field.after !== 'Chưa có';
            return (
              <tr key={field.label} className="align-top">
                <td className="px-3 py-2.5 font-semibold text-foreground">{field.label}</td>
                <td className="px-3 py-2.5">
                  {hasBefore ? (
                    <span className="inline-block max-w-full break-words rounded-md bg-rose-100 px-2 py-0.5 font-medium text-rose-800 ring-1 ring-inset ring-rose-300">
                      {field.before}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {hasAfter ? (
                    <span className="inline-block max-w-full break-words rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300">
                      {field.after}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Nội dung chi tiết trong modal: file → preview, còn lại → bảng diff (có tiêu đề nhỏ theo hành động). */
function AuditDetail({ item, diff }: { item: AuditLogItem; diff: DiffField[] }) {
  if (item.entityName === 'FileEntity') {
    return (
      <div>
        <p className="mb-2.5 text-sm font-semibold text-foreground">Tệp đính kèm</p>
        <AuditFileRow item={item} />
      </div>
    );
  }
  if (diff.length === 0) {
    return <p className="text-sm text-muted-foreground">Không có thay đổi giá trị — thao tác chỉ ghi nhận thời điểm lưu.</p>;
  }
  const title = item.actionKind === 'request_revision' ? 'Nội dung yêu cầu chỉnh sửa'
    : item.action === 'Created' ? 'Dữ liệu đã tạo'
    : item.action === 'Deleted' ? 'Dữ liệu đã xóa'
    : 'Chi tiết thay đổi';
  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold text-foreground">{title}</p>
      <DiffTable diff={diff} />
    </div>
  );
}

/** Modal chi tiết một bản ghi audit — dùng AppDialog (header đỏ), body gồm meta + diff/file. Giữ item cũ khi đóng để animation mượt. */
function AuditDetailDialog({ item, onOpenChange }: { item: AuditLogItem | null; onOpenChange: (open: boolean) => void }) {
  const lastItem = useRef<AuditLogItem | null>(null);
  if (item) lastItem.current = item;
  const current = item ?? lastItem.current;
  if (!current) return null;
  const { time, date } = formatTimeParts(current.createdAt);
  const cfg = getActionDisplay(current);
  const diff = getDisplayChanges(current);
  const title = current.summary ?? `${getActionLabel(current.action)} ${getEntityLabel(current.entityName)}`;
  return (
    <AppDialog
      open={item !== null}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={getActorLabel(current.actor)}
      size="max-w-4xl sm:max-w-4xl"
      height="h-[80vh] max-h-[80vh]"
    >
      <div className="space-y-5">
        {/* Lưới thông tin có nhãn — tránh trùng lặp, dễ quét */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:grid-cols-4">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Hành động</dt>
            <dd className={`mt-0.5 truncate text-sm font-bold ${cfg.text}`}>{cfg.label || current.action}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Phân hệ</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">{moduleLabels[current.module] ?? current.module}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Đối tượng</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">{getEntityLabel(current.entityName)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Thời gian</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">{time} · {date}</dd>
          </div>
        </dl>
        <AuditDetail item={current} diff={diff} />
      </div>
    </AppDialog>
  );
}

function AuditItemRow({ item, onOpen }: { item: AuditLogItem; onOpen: (item: AuditLogItem) => void }) {
  const after = parseJsonRecord(item.afterData) ?? parseJsonRecord(item.beforeData) ?? {};
  const changeMap = new Map((item.changes ?? []).map((change) => [change.field, change]));
  const display = (field: string) => normDisplay(changeMap.get(field)?.afterDisplay ?? null);
  const isFile = item.entityName === 'FileEntity';
  const { time, date } = formatTimeParts(item.createdAt);
  const cfg = getActionDisplay(item);

  let subtitle = getEntityLabel(item.entityName);
  if (item.entityName === 'SubmissionResult') {
    subtitle = display('criteriaId') ?? display('CriteriaId') ?? display('Criteria') ?? subtitle;
  } else if (item.entityName === 'Submission') {
    subtitle = display('criteriaGroupId') ?? display('CriteriaGroupId') ?? subtitle;
  } else if (isFile) {
    const newFile = item.files?.[0];
    subtitle = newFile?.displayName ?? newFile?.originalName
      ?? String(after.OriginalName ?? after.DisplayName ?? subtitle);
  }

  const title = item.summary ?? `${getActionLabel(item.action)} ${getEntityLabel(item.entityName)}`;

  return (
    <TableRow className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => onOpen(item)}>
      <TableCell className="border-r border-border/60 py-3">
        <div className="leading-tight">
          <div className="text-sm font-semibold tabular-nums text-foreground">{time}</div>
          <div className="text-xs tabular-nums text-foreground/60">{date}</div>
        </div>
      </TableCell>
      <TableCell className="border-r border-border/60 py-3 whitespace-normal">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-foreground/60">{subtitle} · {getActorLabel(item.actor)}</p>
        </div>
      </TableCell>
      <TableCell className="border-r border-border/60 py-3">
        <span className={`whitespace-nowrap text-xs font-semibold ${cfg.text}`}>
          {cfg.label || item.action}
        </span>
      </TableCell>
      <TableCell className="border-r border-border/60 py-3">
        <span className="whitespace-nowrap text-xs text-foreground/70">
          {moduleLabels[item.module] ?? item.module}
        </span>
      </TableCell>
      <TableCell className="py-3 text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
}

/** Filter khoảng ngày theo contract của FilterDropdown (value dạng 'from|to'). */
function DateRangeFilter({ label, value, onChange }: { label?: string; value: string; onChange: (value: string) => void }) {
  const [from = '', to = ''] = value.split('|');
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-center gap-1.5">
        <Input type="date" aria-label="Từ ngày" className="h-9 min-w-0 flex-1" value={from} onChange={(event) => onChange(`${event.target.value}|${to}`)} />
        <span className="shrink-0 text-xs text-muted-foreground">đến</span>
        <Input type="date" aria-label="Đến ngày" className="h-9 min-w-0 flex-1" value={to} onChange={(event) => onChange(`${from}|${event.target.value}`)} />
      </div>
    </div>
  );
}

/** Nội dung trang lịch sử audit: filter + bảng + modal chi tiết. Backend tự scope — role thường chỉ thấy log của mình, ADMIN thấy tất cả. Dùng lại cho trang lịch sử của từng role. */
export function AuditLogView({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [entityName, setEntityName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const search = useDebounce(searchInput, 350);

  const query = useMemo<AuditLogQuery>(() => ({
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(entityName ? { entityName } : {}),
    ...(search ? { search } : {}),
  }), [page, from, to, module, action, entityName, search]);

  const logsQuery = useQuery({ queryKey: ['audit-logs', query], queryFn: () => auditLogsApi.list(query) });
  const result = logsQuery.data;

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setModule(''); setAction(''); setEntityName(''); setSearchInput(''); setFrom(''); setTo(''); resetPage();
  };

  const handleDateRangeChange = (value: string) => {
    const [nextFrom = '', nextTo = ''] = value.split('|');
    setFrom(nextFrom);
    setTo(nextTo);
    resetPage();
  };

  const activeFilters = [
    ...(module ? [{ label: 'Phân hệ', value: moduleLabels[module] ?? module, onClear: () => { setModule(''); resetPage(); } }] : []),
    ...(action ? [{ label: 'Hành động', value: actionLabels[action] ? actionLabels[action].charAt(0).toUpperCase() + actionLabels[action].slice(1) : action, onClear: () => { setAction(''); resetPage(); } }] : []),
    ...(entityName ? [{ label: 'Đối tượng', value: entityLabels[entityName] ?? entityName, onClear: () => { setEntityName(''); resetPage(); } }] : []),
    ...(from || to ? [{ label: 'Khoảng ngày', value: `${from || '…'} → ${to || '…'}`, onClear: () => { setFrom(''); setTo(''); resetPage(); } }] : []),
  ];

  if (logsQuery.isPending) return <PageLoading label="Đang tải lịch sử thay đổi…" />;
  if (logsQuery.isError) return <EmptyState variant="error" title="Không tải được lịch sử thay đổi" description={logsQuery.error instanceof Error ? logsQuery.error.message : 'Vui lòng thử lại sau.'} />;
  if (!result) return <EmptyState title="Chưa có dữ liệu lịch sử" />;
  const visibleItems = result.items;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-3">
          <div className="relative w-full max-w-[300px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(event) => { setSearchInput(event.target.value); resetPage(); }}
              placeholder="Tìm theo thao tác hoặc đối tượng…"
              className="!h-9 rounded-lg border-border/60 bg-card pl-9 pr-8 !py-0 !text-[13px] leading-9 focus-visible:border-ring"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); resetPage(); }}
                aria-label="Xóa tìm kiếm"
                className="absolute right-1.5 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <FilterDropdown activeCount={activeFilters.length} activeFilters={activeFilters} onClear={clearFilters}>
            <FilterSelect label="Phân hệ" value={module} onChange={(value) => { setModule(value); resetPage(); }} allLabel="Tất cả phân hệ" options={Object.entries(moduleLabels).map(([value, label]) => ({ value, label }))} />
            <FilterSelect label="Hành động" value={action} onChange={(value) => { setAction(value); resetPage(); }} allLabel="Tất cả hành động" options={Object.entries(actionLabels).map(([value, label]) => ({ value, label: label.charAt(0).toUpperCase() + label.slice(1) }))} />
            <FilterSelect label="Đối tượng" value={entityName} onChange={(value) => { setEntityName(value); resetPage(); }} allLabel="Tất cả đối tượng" options={Object.entries(entityLabels).map(([value, label]) => ({ value, label: label.charAt(0).toUpperCase() + label.slice(1) }))} />
            <DateRangeFilter label="Khoảng ngày" value={`${from}|${to}`} onChange={handleDateRangeChange} />
          </FilterDropdown>
          <span className="ml-auto text-xs text-muted-foreground">{result.total} thay đổi</span>
        </div>

        {visibleItems.length === 0 ? (
          <div className="bg-card p-10">
            <EmptyState icon={<History className="size-8" />} title="Chưa có thay đổi phù hợp" description="Thử thay đổi điều kiện lọc hoặc khoảng thời gian." />
          </div>
        ) : (
          <>
            <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-b border-primary/70 bg-primary hover:bg-primary">
                <TableHead className="w-[120px] border-r border-white/15 text-xs font-bold uppercase tracking-wide text-primary-foreground">Thời gian</TableHead>
                <TableHead className="border-r border-white/15 text-xs font-bold uppercase tracking-wide text-primary-foreground">Thao tác</TableHead>
                <TableHead className="w-[110px] border-r border-white/15 text-xs font-bold uppercase tracking-wide text-primary-foreground">Hành động</TableHead>
                <TableHead className="w-[140px] border-r border-white/15 text-xs font-bold uppercase tracking-wide text-primary-foreground">Phân hệ</TableHead>
                <TableHead className="w-[64px] text-right text-xs font-bold uppercase tracking-wide text-primary-foreground">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((item) => <AuditItemRow key={item.id} item={item} onOpen={setSelected} />)}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-border/40 bg-muted/20 px-4 py-1">
            <div className="text-xs text-muted-foreground">
              Hiển thị {result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, result.total)} / {result.total}
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="icon-sm" className="size-8" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Trang trước"><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="outline" size="icon-sm" className="size-8" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Trang sau"><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          </>
        )}
      </section>

      <AuditDetailDialog item={selected} onOpenChange={(open) => { if (!open) setSelected(null); }} />
    </div>
  );
}

/** Trang lịch sử audit chung (/thi-dua/lich-su-thay-doi). ADMIN thấy toàn hệ thống, role thường chỉ thấy log của mình. */
export default function AuditLogPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  return (
    <AuditLogView
      title={isAdmin ? LABELS.AUDIT_TIMELINE_TITLE : 'Lịch sử thao tác'}
      description={
        isAdmin
          ? 'Theo dõi các thay đổi dữ liệu trong hệ thống theo cách dễ đọc và dễ tra cứu.'
          : 'Lịch sử các thay đổi do tài khoản của bạn thực hiện trong hệ thống.'
      }
    />
  );
}
