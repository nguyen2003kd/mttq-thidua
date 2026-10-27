import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGetApiV1AuditLogsQueryKey } from '@/api/endpoints/audit-logs';
import { getGetApiV1PeriodsQueryKey } from '@/api/endpoints/periods';
import { dataQueryKey } from '@/api/mutator/query-keys';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  History,
  Search,
  X,
} from 'lucide-react';
import { AppDialog, Button, EmptyState, FilePreviewDialog, FilterDropdown, FilterSelect, PageHeader, PageLoading, PeriodSelect } from '@/components/core';
import { SortableTableHead } from '@/components/core/SortableTableHead';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useAuthStore } from '@/store/authStore';
import { usePeriodStore } from '@/store/periodStore';
import { periodsApi } from '@/features/admin/api/periodsApi';
import { vnWards } from '@/data/vn-wards';
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
  ScoringConfig: 'cấu hình điểm',
  User: 'tài khoản người dùng',
  UserAuth: 'thông tin xác thực',
  UserRole: 'gán vai trò người dùng',
  Role: 'vai trò người dùng',
  FileEntity: 'tệp tin',
  FileVariant: 'phiên bản tệp tin',
  PublicationBatch: 'đợt công bố',
  FinalDecision: 'quyết định cuối cùng',
  Period: 'kỳ thi đua',
  Cluster: 'cụm thi đua',
  ClusterWard: 'thành viên cụm thi đua',
  Department: 'ban',
};

const moduleLabels: Record<string, string> = {
  Emulation: 'Tiêu chí thi đua',
  Submission: 'Hồ sơ thi đua',
  Files: 'Tài liệu',
  ResultPublication: 'Công bố kết quả',
  System: 'Hệ thống',
  Entities: 'Kỳ thi đua',
  Periods: 'Kỳ thi đua',
  Identity: 'Tài khoản',
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
  MaxBonusPointPerPeriod: 'Điểm thưởng tối đa trong kỳ',
  MaxBonusPointPerCriteria: 'Điểm thưởng tối đa trên tiêu chí con',
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
  Explanation: 'Nội dung diễn giải',
  ReviewStatus: 'Trạng thái xem xét',
  CriteriaId: 'Tiêu chí',
  CriteriaGroupId: 'Nhóm tiêu chí',
  ScoringConfigId: 'Cấu hình điểm',
  UserId: 'Người dùng',
  RoleId: 'Vai trò',
  IsPrimary: 'Là vai trò chính',
  Action: 'Hành động',
  Reason: 'Lý do',
  Level: 'Cấp xử lý',
  ActionLevel: 'Cấp xử lý',
  StartYear: 'Năm bắt đầu',
  EndYear: 'Năm kết thúc',
  ActorName: 'Người thực hiện',
  ChangedData: 'Dữ liệu thay đổi',
  SubmissionResultIds: 'Kết quả tiêu chí',
  TotalFinalPoint: 'Tổng điểm chính thức',
  TotalProposedPoint: 'Tổng điểm đề xuất',
  OfficialPoint: 'Điểm chính thức',
  OfficialBonusPoint: 'Điểm thưởng chính thức',
  WardCode: 'Phường/xã',
};
const wardNameByCode = new Map(vnWards.map(({ code, name }) => [code, name]));

/** Dùng màu thương hiệu cho thao tác thông thường, màu cảnh báo cho sửa/xóa. */
const actionConfig: Record<string, { label: string; text: string; accent: string }> = {
  Created: { label: 'Tạo mới', text: 'text-primary', accent: 'border-l-primary' },
  Updated: { label: 'Cập nhật', text: 'text-info', accent: 'border-l-info' },
  Deleted: { label: 'Xóa', text: 'text-destructive', accent: 'border-l-destructive' },
  Published: { label: 'Công bố', text: 'text-primary', accent: 'border-l-primary' },
};

const defaultActionStyle = {
  label: '',
  text: 'text-foreground/70',
  accent: 'border-l-border',
};

/** Option lọc Hành động: mã CRUD + mã NHÓM nghiệp vụ — BE khớp chính xác hoặc hậu tố "_<mã>"
 *  (vd request_revision khớp cả scorer/reviewer/specialist_request_revision) → không lặp option cùng nhãn. */
const actionFilterOptions: Array<{ value: string; label: string }> = [
  { value: 'created', label: 'Thêm mới' },
  { value: 'updated', label: 'Cập nhật' },
  { value: 'deleted', label: 'Xóa' },
  { value: 'published', label: 'Công bố' },
  { value: 'submit', label: 'Nộp đề xuất' },
  { value: 'score', label: 'Chấm điểm' },
  { value: 'forward', label: 'Gửi duyệt' },
  { value: 'approve', label: 'Phê duyệt' },
  { value: 'request_revision', label: 'Yêu cầu sửa' },
  { value: 'add_criteria', label: 'Bổ sung tiêu chí' },
  { value: 'committee_finalize', label: 'Kết thúc duyệt' },
  { value: 'remind', label: 'Nhắc nhở' },
  { value: 'group_publish', label: 'Công bố nhóm tiêu chí' },
];

const actionFilterLabels: Record<string, string> = Object.fromEntries(
  actionFilterOptions.map(({ value, label }) => [value, label]),
);

/** Nhãn + màu theo hành động nghiệp vụ (actionKind từ backend) — phân biệt thao tác của từng role.
 *  `verb` là dạng ngắn để ghép với cấp (vd "Lãnh đạo duyệt"); chỉ cần cho thao tác có actionLevel. */
const businessActionConfig: Record<string, { label: string; verb?: string; text: string; accent: string }> = {
  submit: { label: 'Nộp điểm', text: 'text-primary', accent: 'border-l-primary' },
  upload: { label: 'Tải lên', text: 'text-primary', accent: 'border-l-primary' },
  approve: { label: 'Phê duyệt', verb: 'duyệt', text: 'text-primary', accent: 'border-l-primary' },
  finalize: { label: 'Kết thúc duyệt', verb: 'phê duyệt', text: 'text-primary', accent: 'border-l-primary' },
  rescore: { label: 'Chấm lại', verb: 'chấm lại', text: 'text-info', accent: 'border-l-info' },
  review: { label: 'Thẩm định', verb: 'thẩm định', text: 'text-info', accent: 'border-l-info' },
  add_criteria: { label: 'Bổ sung tiêu chí', verb: 'bổ sung tiêu chí', text: 'text-info', accent: 'border-l-info' },
  publish: { label: 'Công bố', verb: 'công bố', text: 'text-primary', accent: 'border-l-primary' },
  update_score: { label: 'Cập nhật điểm', text: 'text-info', accent: 'border-l-info' },
  stage_transition: { label: 'Chuyển giai đoạn', verb: 'chuyển giai đoạn', text: 'text-info', accent: 'border-l-info' },
  request_revision: { label: 'Yêu cầu sửa', verb: 'yêu cầu sửa', text: 'text-warning', accent: 'border-l-warning' },
  delete_file: { label: 'Xóa tệp', text: 'text-destructive', accent: 'border-l-destructive' },
  // ── Log nghiệp vụ tường minh (action code từ ISystemLogWriter) ──
  local_submit: { label: 'Nộp đề xuất', text: 'text-primary', accent: 'border-l-primary' },
  scorer_score: { label: 'Chấm điểm', text: 'text-info', accent: 'border-l-info' },
  scorer_forward: { label: 'Gửi duyệt', text: 'text-primary', accent: 'border-l-primary' },
  reviewer_approve: { label: 'Phê duyệt', text: 'text-primary', accent: 'border-l-primary' },
  reviewer_score: { label: 'Điều chỉnh điểm', text: 'text-info', accent: 'border-l-info' },
  specialist_approve: { label: 'Duyệt hồ sơ', text: 'text-primary', accent: 'border-l-primary' },
  specialist_score: { label: 'Thẩm định điểm', text: 'text-info', accent: 'border-l-info' },
  scorer_request_revision: { label: 'Yêu cầu sửa', text: 'text-warning', accent: 'border-l-warning' },
  reviewer_request_revision: { label: 'Yêu cầu sửa', text: 'text-warning', accent: 'border-l-warning' },
  specialist_request_revision: { label: 'Yêu cầu sửa', text: 'text-warning', accent: 'border-l-warning' },
  scorer_add_criteria: { label: 'Bổ sung tiêu chí', text: 'text-info', accent: 'border-l-info' },
  reviewer_add_criteria: { label: 'Bổ sung tiêu chí', text: 'text-info', accent: 'border-l-info' },
  specialist_add_criteria: { label: 'Bổ sung tiêu chí', text: 'text-info', accent: 'border-l-info' },
  committee_finalize: { label: 'Kết thúc duyệt', text: 'text-primary', accent: 'border-l-primary' },
  remind: { label: 'Nhắc nhở', text: 'text-info', accent: 'border-l-info' },
  group_publish: { label: 'Công bố', text: 'text-primary', accent: 'border-l-primary' },
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
  StartYear: 2, EndYear: 3,
  CriteriaGroupId: 3, CriteriaId: 4,
  Point: 10, BonusPoint: 11, OfficialPoint: 12, OfficialBonusPoint: 13,
  MaxPoint: 14, MaxBonusPoint: 15, MaxBonusPointPerPeriod: 15, MaxBonusPointPerCriteria: 15, SnapshotMaxPoint: 14, SnapshotMaxBonusPoint: 15,
  TotalProposedPoint: 16, TotalFinalPoint: 17,
  Status: 20, ReviewStatus: 21, CurrentStage: 22, IsApplied: 23,
  Explanation: 30, Note: 31, OfficialReason: 32,
  Deadline: 40, SubmittedAt: 41,
  FileName: 50, OriginalName: 51, FileSize: 52, ContentType: 53,
};

// RevisionRound là counter nội bộ của SubmissionHistory (sequence toàn cục) — không có nghĩa với người xem.
// Type (Loại tiêu chí: thường/bổ sung) là dữ liệu cấu hình nội bộ — không cần hiển thị.
const noiseAuditFields = new Set(['Id', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy', 'SubmissionId', 'EntityId', 'RevisionRound', 'revisionRound', 'Type']);

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

// ── Log nghiệp vụ tường minh (BE ISystemLogWriter) ──────────────────────────
/** Payload chi tiết có cấu trúc — mỗi action code có layout riêng ở modal chi tiết. */
interface AuditPayloadPointChange { before?: number | null; after?: number | null }
interface AuditPayloadChange {
  criteriaId?: string;
  criteria?: string | null;
  point?: number | AuditPayloadPointChange;
  bonusPoint?: number | AuditPayloadPointChange;
  explanation?: string | null;
  reason?: string | null;
  deadline?: string | null;
  note?: string | null;
}
interface AuditPayloadFile { id?: string; name?: string | null; criteria?: string | null }
interface AuditLogPayload {
  summary?: string;
  actor?: { fullName?: string | null; organization?: string | null; level?: string | null };
  submissionId?: string;
  criteriaGroupId?: string;
  criteriaGroupName?: string | null;
  periodId?: string;
  stage?: { from?: string; to?: string | null };
  reason?: string | null;
  totalProposedPoint?: number | null;
  totalFinalPoint?: number | null;
  isResubmission?: boolean;
  changes?: AuditPayloadChange[] | AuditPayloadChange | null;
  files?: AuditPayloadFile[] | null;
}

/** Log nghiệp vụ mới: có payload + action là action code (không phải CRUD Created/Updated/Deleted/Published). */
function isBusinessLog(item: AuditLogItem) {
  return Boolean(item.payload) && !['Created', 'Updated', 'Deleted', 'Published'].includes(item.action);
}

function parseBusinessPayload(item: AuditLogItem): AuditLogPayload | null {
  const parsed = parseJsonRecord(item.payload);
  return parsed ? (parsed as AuditLogPayload) : null;
}

function payloadChanges(payload: AuditLogPayload): AuditPayloadChange[] {
  if (Array.isArray(payload.changes)) return payload.changes;
  return payload.changes ? [payload.changes] : [];
}

function formatPointPair(value: number | AuditPayloadPointChange | undefined) {
  const fmt = (v?: number | null) => (v == null ? '—' : v.toLocaleString('vi-VN'));
  if (value == null || typeof value === 'number') {
    const text = value == null ? '—' : fmt(value);
    return { before: text, after: text };
  }
  return { before: fmt(value.before), after: fmt(value.after) };
}
const submissionStageOrder = ['Draft', 'LocalSubmitted', 'ScorerSubmitted', 'ReviewerApproved', 'SpecialistApproved', 'LeaderApproved', 'CouncilApproved', 'CommitteeFinalized', 'RequiresRevision', 'ScorerRevisionRequested', 'ReviewerRevisionRequested'] as const;
const submissionStageLabels: Record<string, string> = {
  Draft: 'Nháp',
  LocalSubmitted: 'Đã nộp địa phương',
  ScorerSubmitted: 'Chờ Lãnh đạo ban',
  ReviewerApproved: 'Chờ Chuyên viên phụ trách thi đua khen thưởng',
  SpecialistApproved: 'Chuyên viên phụ trách thi đua khen thưởng đã duyệt',
  LeaderApproved: 'Lãnh đạo đã duyệt',
  CouncilApproved: 'Hội đồng đã duyệt',
  CommitteeFinalized: 'Ủy ban đã phê duyệt',
  RequiresRevision: 'Yêu cầu chỉnh sửa',
  ScorerRevisionRequested: 'Yêu cầu chỉnh sửa',
  ReviewerRevisionRequested: 'Yêu cầu chỉnh sửa',
};
const submissionStageLabelsByValue = submissionStageOrder.map((stage) => submissionStageLabels[stage]);

function normalizeStageDisplay(field: string, value: string | null) {
  const name = field.split('.').at(-1)?.toLowerCase();
  if (!value || (name !== 'currentstage' && name !== 'submissionstage')) return value;
  return submissionStageLabels[value] ?? (/^[A-Z][A-Za-z]+$/.test(value) ? 'Giai đoạn hồ sơ' : value);
}

function getReadableReference(values: Array<string | null>, fallback: string) {
  return values.find((value) => value?.trim() && !GUID_RE.test(value.trim()))?.trim() ?? fallback;
}

/** GUID trần không đọc được với người xem — trả null để caller fallback nhãn thân thiện.
 *  Hỗ trợ cả dạng "guid: Tên" (BE display kèm định danh): giữ phần tên, bỏ phần ID. */
function readableRef(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const withName = new RegExp(`^${GUID_RE.source}\\s*[:\\-]\\s*(.+)$`, 'i').exec(trimmed);
  const rest = (withName ? withName[1] : trimmed).trim();
  return GUID_RE.test(rest) ? null : rest;
}

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
      .map(([key, v]) => `${getFieldLabel(key) ?? key}: ${formatStructuredValue(v, key) ?? formatAuditValue(key, v)}`)
      .join(' · ');
  }
  return null;
}

/** Lookup nhãn tiếng Việt không phân biệt hoa-thường — BE trả key lẫn PascalCase lẫn camelCase. Trả null nếu không có nhãn. */
function getFieldLabel(key: string): string | null {
  return fieldLabels[key] ?? fieldLabels[key.charAt(0).toUpperCase() + key.slice(1)] ?? null;
}

function localizeAuditFieldValue(field: string, value: string | null) {
  if (!value) return value;
  if (field.toLowerCase() === 'action' && value === 'ResubmitAfterRevision')
    return 'Nộp lại sau chỉnh sửa';
  if (field.toLowerCase() === 'wardcode')
    return wardNameByCode.get(value.trim()) ?? value;
  return value;
}

function formatAuditValue(field: string, value: unknown) {
  if (value === null || value === undefined || value === '') return 'Chưa có';

  if (field.toLowerCase() === 'wardcode' && typeof value === 'number') {
    const code = String(value);
    return wardNameByCode.get(code) ?? code;
  }

  if (typeof value === 'string') {
    const localizedValue = localizeAuditFieldValue(field, value);
    if (localizedValue !== value) return localizedValue ?? value;
  }

  if (field === 'Status' && typeof value === 'number') {
    return ({ 0: 'Nháp', 1: 'Đã áp dụng', 2: 'Đã kết thúc' } as Record<number, string>)[value] ?? String(value);
  }

  if ((field === 'CurrentStage' || field === 'SubmissionStage') && typeof value === 'number') {
    return submissionStageLabelsByValue[value] ?? 'Giai đoạn hồ sơ';
  }

  if ((field === 'CurrentStage' || field === 'SubmissionStage') && typeof value === 'string') {
    return normalizeStageDisplay(field, value) ?? 'Giai đoạn hồ sơ';
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
function formatPointValue(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
}

/** Viết hoa chữ cái đầu — dòng phụ ("kỳ thi đua" → "Kỳ thi đua") cho chuyên nghiệp. */
function capitalizeFirst(text: string) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

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
        label: getFieldLabel(field) ?? field,
        before: normDisplay(readableRef(formatAuditValue(field, change?.before))) ?? 'Chưa có',
        after: normDisplay(readableRef(formatAuditValue(field, change?.after))) ?? 'Chưa có',
      };
    });
}

// Ưu tiên `changes` BE đã enrich (label + display tiếng Việt), fallback tự parse changedData.
// Log phê duyệt (ApprovalHistory): ẩn các field kỹ thuật thừa (Action/ChangedData/StageLevel/UserId/UserName) —
// thông tin hữu ích đã có ở tiêu đề + khối ngữ cảnh; chỉ giữ Lý do.
const approvalSnapshotNoiseFields = new Set(['Action', 'ChangedData', 'StageLevel', 'UserId', 'UserName']);
function getDisplayChanges(item: AuditLogItem) {
  const hideApprovalNoise = item.entityName === 'ApprovalHistory';
  const rows = item.changes?.length
    ? item.changes
        .filter((change) => !noiseAuditFields.has(change.field)
          && !(hideApprovalNoise && approvalSnapshotNoiseFields.has(change.field))
          // Dòng ngữ cảnh Tiêu chí/Nhóm tiêu chí đã hiển thị ở khối ngữ cảnh phía trên →
          // ẩn khỏi bảng diff khi không phải thay đổi thật (Created: chưa có → tên; Updated: cùng tên).
          && !((change.field === 'CriteriaId' || change.field === 'CriteriaGroupId')
            && (change.beforeDisplay == null || change.beforeDisplay === change.afterDisplay)))
        .map((change) => ({
          field: change.field,
          label: getFieldLabel(change.field) ?? change.label ?? change.field,
          before: normDisplay(readableRef(localizeAuditFieldValue(change.field, normalizeStageDisplay(change.field, normalizeIsoDisplay(formatStructuredValue(change.beforeDisplay, change.field) ?? change.beforeDisplay) ?? formatAuditValue(change.field, change.before))))) ?? 'Chưa có',
          after: normDisplay(readableRef(localizeAuditFieldValue(change.field, normalizeStageDisplay(change.field, normalizeIsoDisplay(formatStructuredValue(change.afterDisplay, change.field) ?? change.afterDisplay) ?? formatAuditValue(change.field, change.after))))) ?? 'Chưa có',
        }))
        // Bỏ field không đổi (context như CriteriaGroupId X→X), field null→null,
        // và các dòng hiển thị ở khối ngữ cảnh riêng của log cấu hình điểm (Tên + Levels).
        .filter((field) => field.field !== 'Levels'
          && !(item.entityName === 'ScoringConfig' && field.field === 'Name')
          && field.before !== field.after)
    : getMeaningfulDiff(item);
  return rows.sort((a, b) => (fieldPriority[a.field] ?? 100) - (fieldPriority[b.field] ?? 100));
}

/** BE display đôi khi trả chuỗi ISO thô ("2026-10-20T02:30:35+00:00") → format dd/mm/yyyy hh:mm cho dễ đọc. */
function normalizeIsoDisplay(value: string | null): string | null {
  if (!value) return value;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value.trim()) ? formatDateTime(value) : value;
}

/** Nhãn actor: ghép vai trò + tên — "Địa phương Long Bình", "Chuyên viên cấp 2 Nguyễn Văn A"…
 *  Tài khoản test thường đặt FullName trùng nhãn vai trò → đã có cấp rồi thì không ghép nữa (tránh lặp). */
function getActorLabel(item: { actor: string; actionLevel?: string | null; actorLevel?: string | null }) {
  const actor = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(item.actor) ? 'Người dùng hệ thống' : item.actor || 'Hệ thống tự động';
  const level = item.actorLevel ?? item.actionLevel;
  if (level && actor.trim().toLowerCase().startsWith(level.trim().toLowerCase())) return actor;
  return level ? `${level} ${actor}` : actor;
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

/** Dòng minh chứng trong payload log nghiệp vụ — bấm để xem trước. Tên file/tiêu chí dài → cắt "…" không vỡ layout. */
function PayloadFileRow({ file }: { file: AuditPayloadFile }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const name = file.name ?? 'Tệp đính kèm';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <FileText className="size-4 shrink-0 text-primary/70" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground" title={name}>{name}</span>
          {file.criteria && (
            <span className="block truncate text-xs text-muted-foreground" title={file.criteria}>{file.criteria}</span>
          )}
        </span>
      </span>
      {file.id && (
        <>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="size-3.5" />Xem
          </button>
          <FilePreviewDialog
            file={previewOpen ? { id: file.id, displayName: name, originalName: name } : null}
            onOpenChange={setPreviewOpen}
          />
        </>
      )}
    </div>
  );
}

/** Chi tiết log nghiệp vụ tường minh — render theo action code: lý do, bảng điểm, minh chứng. */
function BusinessAuditDetail({ item, payload }: { item: AuditLogItem; payload: AuditLogPayload }) {
  const code = item.actionKind ?? item.action;
  const changes = payloadChanges(payload);
  const isSubmit = code === 'local_submit';
  const isScore = code.endsWith('_score');
  const isRevision = code.endsWith('_request_revision');
  const isAddCriteria = code.endsWith('_add_criteria');
  const isApprove = ['reviewer_approve', 'specialist_approve', 'leader_approve', 'council_approve', 'scorer_forward', 'approve'].includes(code);
  const total = payload.totalFinalPoint ?? payload.totalProposedPoint;
  const totalLabel = payload.totalFinalPoint != null ? 'Tổng điểm chính thức' : 'Tổng điểm đề xuất';

  return (
    <div className="space-y-4">
      {payload.criteriaGroupName && (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Nhóm tiêu chí: </span>
          <span className="font-semibold text-foreground">"{payload.criteriaGroupName}"</span>
        </p>
      )}
      {payload.reason && !isScore && (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Lý do: </span>
          <span className="text-foreground">{payload.reason}</span>
        </p>
      )}

      {isSubmit && changes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Điểm đã đề xuất</p>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-foreground/70">Tiêu chí</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Điểm tự chấm</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Điểm thưởng</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-foreground/70">Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {changes.map((change, index) => (
                  <tr key={change.criteriaId ?? index} className="align-top">
                    <td className="px-3 py-2.5 font-medium text-foreground">{change.criteria ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatPointPair(change.point).after}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatPointPair(change.bonusPoint).after}</td>
                    <td className="px-3 py-2.5 text-foreground/80"><span className="line-clamp-2" title={change.explanation ?? ''}>{change.explanation || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isScore || isApprove) && changes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">{isScore ? 'Điểm điều chỉnh' : 'Điểm chấm'}</p>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-foreground/70">Tiêu chí</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Điểm đề xuất</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Điểm thưởng đề xuất</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Điểm chấm</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Điểm thưởng chấm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {changes.map((change, index) => {
                  const point = formatPointPair(change.point);
                  const bonus = formatPointPair(change.bonusPoint);
                  const pointChanged = point.before !== point.after;
                  const bonusChanged = bonus.before !== bonus.after;
                  return (
                    <tr key={change.criteriaId ?? index} className="align-top">
                      <td className="px-3 py-2.5 font-medium text-foreground">{change.criteria ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{point.before}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{bonus.before}</td>
                      <td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${pointChanged ? 'text-primary' : 'text-foreground'}`}>{point.after}</td>
                      <td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${bonusChanged ? 'text-primary' : 'text-foreground'}`}>{bonus.after}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isRevision && changes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Tiêu chí bị yêu cầu chỉnh sửa</p>
          <ul className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            {changes.map((change, index) => (
              <li key={change.criteriaId ?? index} className="text-foreground">• {change.criteria ?? '—'}</li>
            ))}
          </ul>
        </div>
      )}

      {isAddCriteria && changes[0] && (
        <div className="space-y-1 rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p><span className="text-muted-foreground">Nội dung: </span><span className="font-semibold text-foreground">{changes[0].criteria ?? '—'}</span></p>
          {changes[0].deadline && <p><span className="text-muted-foreground">Hạn nộp: </span><span className="text-foreground">{formatDateTime(changes[0].deadline)}</span></p>}
          {changes[0].note && <p><span className="text-muted-foreground">Ghi chú: </span><span className="text-foreground">{changes[0].note}</span></p>}
        </div>
      )}

      {total != null && (
        <p className="text-sm">
          <span className="text-muted-foreground">{totalLabel}: </span>
          <span className="text-base font-bold tabular-nums text-primary">{total.toLocaleString('vi-VN')}</span>
        </p>
      )}

      {(code === 'group_publish' || code.endsWith('_request_revision') || code.endsWith('_add_criteria')) && (item.files?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Tệp đính kèm</p>
          <div className="space-y-2">
            {item.files!.map((file) => (
              <PayloadFileRow key={file.id} file={{ id: file.id, name: file.displayName ?? file.originalName }} />
            ))}
          </div>
        </div>
      )}

      {code !== 'group_publish' && payload.files && payload.files.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Minh chứng đính kèm</p>
          <div className="space-y-2">
            {payload.files.map((file, index) => (
              <PayloadFileRow key={file.id ?? index} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Bảng chi tiết: Trường | Giá trị cũ | Giá trị mới. Tạo mới → bỏ cột "Giá trị cũ" (luôn "—"),
 *  Xóa → bỏ cột "Giá trị mới". Giá trị render dạng chip có viền cho gọn, ô trống hiển thị "—" mờ. */
function DiffTable({ diff, mode }: { diff: DiffField[]; mode: 'created' | 'deleted' | 'updated' }) {
  const showBefore = mode !== 'created';
  const showAfter = mode !== 'deleted';
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="w-[200px] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Trường</th>
            {showBefore && (
              <th className="w-[38%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Giá trị cũ</th>
            )}
            {showAfter && (
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Giá trị mới</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {diff.map((field) => {
            const hasBefore = field.before !== 'Chưa có';
            const hasAfter = field.after !== 'Chưa có';
            return (
              <tr key={field.label} className="align-top">
                <td className="px-3 py-2.5 font-semibold text-foreground">{field.label}</td>
                {showBefore && (
                  <td className="px-3 py-2.5">
                    {hasBefore ? (
                      <span className="inline-block max-w-full break-words rounded-md bg-destructive/10 px-2 py-0.5 font-medium text-destructive ring-1 ring-inset ring-destructive/30">
                        {field.before}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}
                {showAfter && (
                  <td className="px-3 py-2.5">
                    {hasAfter ? (
                      <span className="inline-block max-w-full break-words rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary ring-1 ring-inset ring-primary/30">
                        {field.after}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}
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
  // Log cấu hình điểm: Tên (chip) + bảng mức xếp loại — không phải diff.
  const isScoringConfigLog = item.entityName === 'ScoringConfig';
  const levelsRow = item.changes?.find((change) => change.field === 'Levels');
  const configNameRow = item.changes?.find((change) => change.field === 'Name');
  const configLevels = Array.isArray(levelsRow?.after)
    ? (levelsRow!.after as Array<{ name: string; minPoint: number; maxPoint: number; includeMin: boolean; includeMax: boolean }>)
    : [];
  if (isScoringConfigLog && diff.length === 0 && configLevels.length === 0) {
    return <p className="text-sm text-muted-foreground">Không có thay đổi giá trị — thao tác chỉ ghi nhận thời điểm lưu.</p>;
  }
  const title = item.actionKind === 'request_revision' ? 'Nội dung yêu cầu chỉnh sửa'
    : item.action === 'Created' ? 'Dữ liệu đã tạo'
    : item.action === 'Deleted' ? 'Dữ liệu đã xóa'
    : 'Chi tiết thay đổi';
  const mode = item.action === 'Created' ? 'created' : item.action === 'Deleted' ? 'deleted' : 'updated';
  return (
    <div>
      {isScoringConfigLog && configNameRow?.afterDisplay && (
        <p className="mb-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Tên cấu hình: </span>
          <span className="ml-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">{configNameRow.afterDisplay}</span>
        </p>
      )}
      {isScoringConfigLog && configLevels.length > 0 && (
        <div className="mb-2.5">
          <p className="mb-2 text-sm font-semibold text-foreground">Mức xếp loại</p>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-foreground/70">Mức xếp loại</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-foreground/70">Khoảng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {configLevels.map((level, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2.5"><Badge className="bg-primary/10 text-primary">{level.name}</Badge></td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                      {formatPointValue(level.minPoint)} {level.includeMin ? '≤' : '<'} điểm {level.includeMax ? '≤' : '<'} {formatPointValue(level.maxPoint)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mb-2.5 text-sm font-semibold text-foreground">{title}</p>
      {diff.length > 0 && <DiffTable diff={diff} mode={mode} />}
    </div>
  );
}

/** Dòng ngữ cảnh trong modal chi tiết: nhóm tiêu chí + tiêu chí con liên quan (resolve tên từ changes BE). */
function AuditContextLine({ item }: { item: AuditLogItem }) {
  const changeMap = new Map((item.changes ?? []).map((change) => [change.field, change]));
  const contextDisplay = (field: string) => readableRef(normDisplay(changeMap.get(field)?.afterDisplay ?? null));
  const groupName = contextDisplay('CriteriaGroupId');
  const criteriaName = contextDisplay('CriteriaId');
  if (!groupName && !criteriaName) return null;

  return (
    <div className="space-y-1 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
      {groupName && (
        <p className="min-w-0">
          <span className="text-muted-foreground">Nhóm tiêu chí: </span>
          <span className="font-semibold text-foreground">{groupName}</span>
        </p>
      )}
      {criteriaName && (
        <p className="min-w-0">
          <span className="text-muted-foreground">Tiêu chí con: </span>
          <span className="font-semibold text-foreground">{criteriaName}</span>
        </p>
      )}
    </div>
  );
}

/** Modal chi tiết một bản ghi audit — dùng AppDialog, body gồm meta + diff/file. Giữ item cũ khi đóng để animation mượt. */
function AuditDetailDialog({ item, onOpenChange }: { item: AuditLogItem | null; onOpenChange: (open: boolean) => void }) {
  const lastItem = useRef<AuditLogItem | null>(null);
  if (item) lastItem.current = item;
  const current = item ?? lastItem.current;
  if (!current) return null;
  const { time, date } = formatTimeParts(current.createdAt);
  const cfg = getActionDisplay(current);
  const diff = getDisplayChanges(current);
  const businessPayload = isBusinessLog(current) ? parseBusinessPayload(current) : null;
  const title = current.summary ?? `${getActionLabel(current.action)} ${getEntityLabel(current.entityName)}`;
  return (
    <AppDialog
      open={item !== null}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={getActorLabel(current)}
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
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Người thực hiện</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">{current.actorFullName ?? current.actor}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Thời gian</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">{time} · {date}</dd>
          </div>
        </dl>
        {/* Log nghiệp vụ tự hiển thị ngữ cảnh trong BusinessAuditDetail (từ payload) → chặn AuditContextLine để không lặp. */}
        {!businessPayload && <AuditContextLine item={current} />}
        {businessPayload
          ? <BusinessAuditDetail item={current} payload={businessPayload} />
          : <AuditDetail item={current} diff={diff} />}
      </div>
    </AppDialog>
  );
}

function AuditItemRow({ item, onOpen }: { item: AuditLogItem; onOpen: (item: AuditLogItem) => void }) {
  const after = parseJsonRecord(item.afterData) ?? parseJsonRecord(item.beforeData) ?? {};
  const changeMap = new Map((item.changes ?? []).map((change) => [change.field, change]));
  const display = (field: string) => readableRef(normDisplay(changeMap.get(field)?.afterDisplay ?? null));
  const isFile = item.entityName === 'FileEntity';
  const { time, date } = formatTimeParts(item.createdAt);
  const cfg = getActionDisplay(item);
  const businessPayload = isBusinessLog(item) ? parseBusinessPayload(item) : null;

  let subtitle = getEntityLabel(item.entityName);
  if (businessPayload) {
    const stageLine = businessPayload.stage?.from || businessPayload.stage?.to
      ? `${submissionStageLabels[businessPayload.stage.from ?? ''] ?? businessPayload.stage.from ?? '—'} → ${submissionStageLabels[businessPayload.stage.to ?? ''] ?? businessPayload.stage.to ?? '—'}`
      : null;
    subtitle = businessPayload.criteriaGroupName ?? stageLine ?? subtitle;
  } else if (item.entityName === 'SubmissionResult') {
    subtitle = getReadableReference([display('criteriaId'), display('CriteriaId'), display('Criteria')], subtitle);
  } else if (item.entityName === 'Submission') {
    subtitle = getReadableReference([display('criteriaGroupId'), display('CriteriaGroupId')], subtitle);
  } else if (isFile) {
    const newFile = item.files?.[0];
    subtitle = newFile?.displayName ?? newFile?.originalName
      ?? String(after.OriginalName ?? after.DisplayName ?? subtitle);
  }

  const title = item.summary ?? `${getActionLabel(item.action)} ${getEntityLabel(item.entityName)}`;

  return (
    <TableRow className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => onOpen(item)}>
      <TableCell className="border-r border-border/60 py-3.5">
        <div className="leading-snug">
          <div className="text-[15px] font-semibold tabular-nums text-foreground">{time}</div>
          <div className="text-[13px] tabular-nums text-foreground/70">{date}</div>
        </div>
      </TableCell>
      <TableCell className="min-w-0 border-r border-border/60 py-3.5 whitespace-normal">
        <div className="min-w-0">
          <p className="line-clamp-2 break-words text-[15px] font-semibold text-foreground">{title}</p>
          <p className="truncate text-[13px] text-foreground/70">{capitalizeFirst(subtitle)}</p>
        </div>
      </TableCell>
      <TableCell className="overflow-hidden border-r border-border/60 py-3.5 text-center">
        <span className={`block truncate text-sm font-semibold ${cfg.text}`} title={cfg.label || item.action}>
          {cfg.label || item.action}
        </span>
      </TableCell>
      <TableCell className="overflow-hidden border-r border-border/60 py-3.5 text-center">
        <span className="block truncate text-sm text-foreground" title={moduleLabels[item.module] ?? item.module}>
          {moduleLabels[item.module] ?? item.module}
        </span>
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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const {
    filters: { module, action, entityName, searchInput, from, to, periodFilter },
    setters: {
      module: setModule,
      action: setAction,
      entityName: setEntityName,
      searchInput: setSearchInput,
      periodFilter: setPeriodFilter,
    },
    setFilters: setQueryFilters,
  } = useQueryFilters({ module: '', action: '', entityName: '', searchInput: '', from: '', to: '', periodFilter: '' });
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const search = useDebounce(searchInput, 350);
  const selectedPeriodId = usePeriodStore((state) => state.selectedPeriodId);
  const effectivePeriodFilter = periodFilter || selectedPeriodId || '';
  const periodsQuery = useQuery({ queryKey: dataQueryKey(getGetApiV1PeriodsQueryKey(), 'options'), queryFn: periodsApi.listAll });
  const periods = periodsQuery.data ?? [];
  const selectedPeriod = periods.find((period) => period.id === effectivePeriodFilter);

  const query = useMemo<AuditLogQuery>(() => ({
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder,
    // Lọc theo kỳ thi đua: BE giải mã chuỗi entity thuộc kỳ (chính xác hơn lọc theo khoảng năm).
    ...(effectivePeriodFilter ? { periodId: effectivePeriodFilter } : {}),
    ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(entityName ? { entityName } : {}),
    ...(search ? { search } : {}),
  }), [page, from, to, module, action, entityName, search, effectivePeriodFilter, sortOrder]);

  const logsQuery = useQuery({ queryKey: dataQueryKey(getGetApiV1AuditLogsQueryKey(), query), queryFn: () => auditLogsApi.list(query) });
  const result = logsQuery.data;

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setQueryFilters({ module: '', action: '', entityName: '', searchInput: '', from: '', to: '', periodFilter: '' });
    usePeriodStore.getState().setSelectedPeriod(null);
    resetPage();
  };

  const handleDateRangeChange = (value: string) => {
    const [nextFrom = '', nextTo = ''] = value.split('|');
    setQueryFilters({ from: nextFrom, to: nextTo });
    resetPage();
  };

  const handlePeriodChange = (value: string) => {
    setPeriodFilter(value);
    usePeriodStore.getState().setSelectedPeriod(value || null);
    resetPage();
  };

  const activeFilters = [
    ...(module ? [{ label: 'Phân hệ', value: moduleLabels[module] ?? module, onClear: () => { setModule(''); resetPage(); } }] : []),
    ...(action ? [{ label: 'Hành động', value: actionFilterLabels[action] ?? businessActionConfig[action]?.label ?? getActionLabel(action), onClear: () => { setAction(''); resetPage(); } }] : []),
    ...(entityName ? [{ label: 'Đối tượng', value: entityLabels[entityName] ?? entityName, onClear: () => { setEntityName(''); resetPage(); } }] : []),
    ...(selectedPeriod ? [{ label: 'Kỳ thi đua', value: selectedPeriod.name, onClear: () => handlePeriodChange('') }] : []),
    ...(from || to ? [{ label: 'Khoảng ngày', value: `${from || '…'} → ${to || '…'}`, onClear: () => { setQueryFilters({ from: '', to: '' }); resetPage(); } }] : []),
  ];

  if (logsQuery.isPending) return <PageLoading label="Đang tải lịch sử thay đổi…" />;
  if (logsQuery.isError) return <EmptyState variant="error" title="Không tải được lịch sử thay đổi" description={logsQuery.error instanceof Error ? logsQuery.error.message : 'Vui lòng thử lại sau.'} />;
  if (!result) return <EmptyState title="Chưa có dữ liệu lịch sử" />;
  const visibleItems = result.items;

  const periodSelector = (
    <PeriodSelect
      value={effectivePeriodFilter}
      onChange={handlePeriodChange}
      allLabel="Tất cả kỳ thi đua"
      options={periods.map((period) => ({ value: period.id, label: period.name }))}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={<div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto">{actions}{periodSelector}</div>} />

      {/* Không dùng overflow-hidden ở section: panel của Bộ lọc (absolute) bị cắt tại mép section
          khi bảng ngắn. Bo góc xử lý bằng rounded-t/b ở thanh filter và footer (pattern chung của DataTable). */}
      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 rounded-t-[calc(var(--radius)_-_1px)] border-b border-border bg-background/95 px-4 py-3">
          <div className="relative w-full max-w-[300px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(event) => { setSearchInput(event.target.value); resetPage(); }}
              placeholder="Tìm theo người thực hiện, thao tác hoặc nội dung…"
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
            {/* Chỉ các module thực tế xuất hiện trong danh sách log — BE đã loại Identity/Notifications,
                Entities/Periods/System là dữ liệu cũ hoặc không dùng → bỏ khỏi option tránh trùng "Kỳ thi đua". */}
            <FilterSelect label="Phân hệ" value={module} onChange={(value) => { setModule(value); resetPage(); }} allLabel="Tất cả phân hệ" options={['Emulation', 'Submission', 'Files', 'ResultPublication'].map((value) => ({ value, label: moduleLabels[value] ?? value }))} />
            <FilterSelect label="Hành động" value={action} onChange={(value) => { setAction(value); resetPage(); }} allLabel="Tất cả hành động" options={actionFilterOptions} />
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
            {/* table-fixed: cột Thao tác lấy phần width còn lại → title/subtitle dài cắt "…" không lệch layout */}
            <Table className="min-w-[640px] table-fixed">
            <TableHeader>
              <TableRow className="border-b border-primary/70 bg-primary hover:bg-primary">
                <SortableTableHead
                  column="createdAt"
                  label="Thời gian"
                  ariaLabel="Thời gian"
                  sort={{ column: 'createdAt', direction: sortOrder }}
                  onSort={() => setSortOrder((current) => current === 'desc' ? 'asc' : 'desc')}
                  className="w-[14%] border-r border-white/15 bg-primary text-sm font-semibold text-primary-foreground"
                />
                <TableHead className="border-r border-white/15 text-sm font-semibold text-primary-foreground">Thao tác</TableHead>
                <TableHead className="w-[130px] border-r border-white/15 text-center text-sm font-semibold text-primary-foreground">Hành động</TableHead>
                <TableHead className="w-[150px] border-r border-white/15 text-center text-sm font-semibold text-primary-foreground">Phân hệ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((item) => <AuditItemRow key={item.id} item={item} onOpen={setSelected} />)}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-b-[calc(var(--radius)_-_1px)] border-t border-border/40 bg-muted/20 px-4 py-1">
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
