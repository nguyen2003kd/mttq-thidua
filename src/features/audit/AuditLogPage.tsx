import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus2,
  FileText,
  History,
  Paperclip,
  Send,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import { Button, EmptyState, FilePreviewDialog, FilterSelect, PageHeader, PageLoading, TruncatedText } from '@/components/core';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import { criteriaGroupsApi } from '@/features/admin/api/criteriaGroupsApi';
import { downloadFile, getFilePreviewUrl } from '@/features/files/api/filesApi';
import { auditLogsApi, type AuditLogItem, type AuditLogQuery } from './api/auditLogsApi';

const PAGE_SIZE = 20;

const actionLabels: Record<string, string> = {
  Created: 'thêm mới',
  Updated: 'cập nhật',
  Deleted: 'xóa',
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
};

const moduleLabels: Record<string, string> = {
  Emulation: 'Tiêu chí thi đua',
  Submission: 'Hồ sơ thi đua',
  Files: 'Tài liệu',
  ResultPublication: 'Công bố kết quả',
};

function getActionLabel(action: string) {
  return actionLabels[action] ?? action.toLowerCase();
}

function getEntityLabel(entityName: string | null) {
  return entityName ? entityLabels[entityName] ?? entityName : 'dữ liệu hệ thống';
}

function isBusinessChange(item: AuditLogItem) {
  return item.module !== 'Identity'
    && item.module !== 'Notifications'
    && item.entityName !== 'CriteriaHistory'
    && item.entityName !== 'UserSession'
    && !item.requestPath?.includes('/auth/login')
    && ['Created', 'Updated', 'Deleted'].includes(item.action);
}

const fieldLabels: Record<string, string> = {
  Content: 'Nội dung',
  Name: 'Tên',
  Description: 'Mô tả',
  MaxPoint: 'Điểm tối đa',
  MaxBonusPoint: 'Điểm thưởng tối đa',
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
};

const noiseAuditFields = new Set(['Id', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy']);

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i;

function parseJsonRecord(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
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
  return String(value);
}

interface AuditGroup {
  key: string;
  traceId: string;
  actor: string;
  createdAt: string;
  requestPath: string | null;
  items: AuditLogItem[];
}

function groupAuditItems(items: AuditLogItem[]): AuditGroup[] {
  const groups: AuditGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && item.traceId && last.traceId === item.traceId) {
      last.items.push(item);
    } else {
      groups.push({
        key: item.traceId || item.id,
        traceId: item.traceId ?? '',
        actor: item.actor,
        createdAt: item.createdAt,
        requestPath: item.requestPath,
        items: [item],
      });
    }
  }
  return groups;
}

function getGroupTitle(path: string | null): string {
  const p = path ?? '';
  if (p.includes('/submissions/submit-points')) return 'Nộp điểm hồ sơ thi đua';
  if (p.includes('/files/upload-bulk')) return 'Tải lên minh chứng';
  if (p.includes('/submissions')) return 'Tạo hồ sơ thi đua';
  if (p.includes('/files')) return 'Thao tác tệp tin';
  return 'Thay đổi dữ liệu';
}

function getGroupIcon(path: string | null) {
  const p = path ?? '';
  if (p.includes('/submissions/submit-points')) return Send;
  if (p.includes('/files/upload')) return UploadCloud;
  if (p.includes('/submissions')) return FilePlus2;
  if (p.includes('/files')) return Paperclip;
  return History;
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
        label: fieldLabels[field] ?? field,
        before: formatAuditValue(field, change?.before),
        after: formatAuditValue(field, change?.after),
      };
    });
}

// Ưu tiên `changes` BE đã enrich (label + display tiếng Việt), fallback tự parse changedData.
function getDisplayChanges(item: AuditLogItem) {
  if (item.changes?.length) {
    return item.changes.map((change) => ({
      label: change.label ?? change.field,
      before: change.beforeDisplay ?? formatAuditValue(change.field, change.before),
      after: change.afterDisplay ?? formatAuditValue(change.field, change.after),
    }));
  }
  return getMeaningfulDiff(item);
}

function getActorLabel(actor: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(actor) ? 'Người dùng hệ thống' : actor || 'Hệ thống tự động';
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
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2.5 py-2 hover:bg-muted/30">
      <span className="flex min-w-0 items-center gap-2 text-sm">
        {showOld && (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
              {oldFile?.url ?? beforeThumb
                ? <img src={oldFile?.url ?? beforeThumb ?? ''} alt={beforeFileName ?? ''} className="size-8 rounded-md object-cover opacity-50" />
                : <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground line-through">{beforeFileName ?? '—'}</span>
            <span className="shrink-0 text-xs text-muted-foreground">→</span>
          </>
        )}
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
          {newFile?.url ?? thumb
            ? <img src={newFile?.url ?? thumb ?? ''} alt={fileName} className="size-8 rounded-md object-cover" />
            : <Paperclip className="size-3.5 text-primary/70" />}
        </span>
        <span className="truncate font-medium text-foreground">{fileName}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-muted-foreground">
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

interface AuditNameMaps {
  criteriaNames: Map<string, string>;
  groupNames: Map<string, string>;
}

function AuditRow({ item, names }: { item: AuditLogItem; names: AuditNameMaps }) {
  const after = parseJsonRecord(item.afterData) ?? parseJsonRecord(item.beforeData) ?? {};
  const before = parseJsonRecord(item.beforeData) ?? {};
  const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : '—');
  const changeMap = new Map((item.changes ?? []).map((change) => [change.field, change]));
  const display = (field: string) => changeMap.get(field)?.afterDisplay ?? null;
  const rawAfter = (...keys: string[]) => {
    for (const key of keys) {
      if (typeof after[key] === 'number') return after[key] as number;
    }
    return null;
  };

  if (item.entityName === 'SubmissionResult') {
    const criteriaName = display('criteriaId') ?? display('CriteriaId') ?? display('Criteria')
      ?? names.criteriaNames.get(String(after.criteriaId ?? after.CriteriaId ?? ''))
      ?? 'Kết quả tiêu chí';
    const pointRaw = rawAfter('point', 'Point');
    const point = display('point') ?? display('Point') ?? (pointRaw !== null ? num(pointRaw) : '—');
    const maxPointRaw = rawAfter('snapshotMaxPoint', 'SnapshotMaxPoint');
    const maxPoint = display('snapshotMaxPoint') ?? display('SnapshotMaxPoint') ?? (maxPointRaw !== null ? num(maxPointRaw) : '—');
    const bonus = display('bonusPoint') ?? display('BonusPoint') ?? (rawAfter('bonusPoint', 'BonusPoint') !== null ? num(rawAfter('bonusPoint', 'BonusPoint')) : null);
    const maxBonusRaw = rawAfter('snapshotMaxBonusPoint', 'SnapshotMaxBonusPoint');
    const maxBonus = maxBonusRaw !== null && maxBonusRaw > 0
      ? display('snapshotMaxBonusPoint') ?? display('SnapshotMaxBonusPoint') ?? num(maxBonusRaw)
      : null;
    const beforePoint = changeMap.get('point')?.beforeDisplay ?? changeMap.get('Point')?.beforeDisplay
      ?? (typeof before.point === 'number' ? num(before.point) : typeof before.Point === 'number' ? num(before.Point) : null);
    const beforeBonus = changeMap.get('bonusPoint')?.beforeDisplay ?? changeMap.get('BonusPoint')?.beforeDisplay
      ?? (typeof before.bonusPoint === 'number' ? num(before.bonusPoint) : typeof before.BonusPoint === 'number' ? num(before.BonusPoint) : null);
    const pointText = beforePoint !== null
      ? (beforePoint !== point ? `${beforePoint} → ${point}` : point)
      : (item.action === 'Created' ? `— → ${point}` : point);
    const bonusText = bonus
      ? (beforeBonus !== null
        ? (beforeBonus !== bonus ? `${beforeBonus} → +${bonus}` : `+${bonus}`)
        : `— → +${bonus}`)
      : null;
    return (
      <div className="flex items-center justify-between gap-x-3 gap-y-1 px-2.5 py-2 transition-colors hover:bg-muted/30">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <FileText className="size-3.5 shrink-0 text-primary/70" />
          <TruncatedText value={criteriaName} className="font-medium text-foreground" />
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">Điểm: {pointText}/{maxPoint}</span>
          {maxBonus && bonusText && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">Thưởng: {bonusText}/{maxBonus}</span>
          )}
        </span>
      </div>
    );
  }

  if (item.entityName === 'FileEntity') {
    return <AuditFileRow item={item} />;
  }

  const diff = getDisplayChanges(item);
  const groupName = item.entityName === 'Submission'
    ? display('criteriaGroupId') ?? display('CriteriaGroupId')
      ?? names.groupNames.get(String(after.criteriaGroupId ?? after.CriteriaGroupId ?? ''))
    : undefined;

  if (item.entityName === 'Submission') {
    return (
      <div className="overflow-hidden rounded-md ring-1 ring-primary/25">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-primary px-2.5 py-1.5 text-sm font-semibold text-white">
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0"><span className="capitalize">{getActionLabel(item.action)}</span> hồ sơ thi đua</span>
            {groupName && (
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-white/85" title={groupName}>
                <FileText className="size-3.5 shrink-0" />
                <span className="truncate">Nhóm tiêu chí: {groupName}</span>
              </span>
            )}
          </span>
          {item.action === 'Created' && (
            <span className="shrink-0 text-xs tabular-nums text-white/90">Tổng điểm đề xuất: {num(after.TotalProposedPoint)}</span>
          )}
        </div>
        {diff.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2.5 py-1.5">
            {diff.map((field) => (
              <span key={field.label} className="inline-flex items-center gap-1.5 rounded bg-background px-1.5 py-0.5 text-xs tabular-nums ring-1 ring-border">
                <span className="text-muted-foreground">{field.label}:</span>
                <span className="text-muted-foreground line-through">{field.before}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-primary">{field.after}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md px-2.5 py-1.5 hover:bg-muted/30">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-foreground">
          <span className="capitalize">{getActionLabel(item.action)}</span> {getEntityLabel(item.entityName)}
        </span>
      </div>
      {diff.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {diff.map((field) => (
            <span key={field.label} className="inline-flex items-center gap-1.5 rounded bg-background px-1.5 py-0.5 text-xs tabular-nums ring-1 ring-border">
              <span className="text-muted-foreground">{field.label}:</span>
              <span className="text-muted-foreground line-through">{field.before}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-primary">{field.after}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditGroupRow({ group, names }: { group: AuditGroup; names: AuditNameMaps }) {
  const [open, setOpen] = useState(false);
  const Icon = getGroupIcon(group.requestPath);
  const summary = group.items.find((item) => item.summary)?.summary;
  const submissions = group.items.filter((item) => item.entityName === 'Submission');
  const results = group.items.filter((item) => item.entityName === 'SubmissionResult');
  const files = group.items.filter((item) => item.entityName === 'FileEntity');
  const others = group.items.filter((item) => !['Submission', 'SubmissionResult', 'FileEntity'].includes(item.entityName ?? ''));

  return (
    <>
      <tr className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => setOpen((value) => !value)}>
        <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-muted-foreground">{formatDateTime(group.createdAt)}</td>
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{summary ?? getGroupTitle(group.requestPath)}</p>
              <p className="text-xs text-muted-foreground">{getActorLabel(group.actor)}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {moduleLabels[group.items[0].module] ?? group.items[0].module}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {group.items.length} thay đổi
            <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </td>
      </tr>
      {open && (
        <tr className="bg-muted/20">
          <td colSpan={4} className="px-4 py-3">
            <div className="space-y-3">
              {submissions.length > 0 && (
                <section>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Hồ sơ</p>
                  <div className="space-y-1.5">
                    {submissions.map((item) => <AuditRow key={item.id} item={item} names={names} />)}
                  </div>
                </section>
              )}
              {results.length > 0 && (
                <section>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Điểm theo tiêu chí</p>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                    {results.map((item) => <AuditRow key={item.id} item={item} names={names} />)}
                  </div>
                </section>
              )}
              {files.length > 0 && (
                <section>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Bằng chứng</p>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                    {files.map((item) => <AuditRow key={item.id} item={item} names={names} />)}
                  </div>
                </section>
              )}
              {others.length > 0 && (
                <section>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Thay đổi khác</p>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                    {others.map((item) => <AuditRow key={item.id} item={item} names={names} />)}
                  </div>
                </section>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLogPage() {
  const user = useAuthStore((s) => s.user);
  const isLocal = user?.role === 'LOCAL';
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [entityName, setEntityName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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

  // Resolve tên tiêu chí / nhóm tiêu chí (BE chưa luôn trả afterDisplay cho GUID).
  const groupsMetaQuery = useQuery({
    queryKey: ['audit-criteria-groups'],
    queryFn: () => criteriaGroupsApi.list({ page: 1, pageSize: 100 }),
    staleTime: 5 * 60_000,
  });
  const criteriaGroupItems = groupsMetaQuery.data?.items ?? [];
  const criteriaListQueries = useQueries({
    queries: criteriaGroupItems.map((group) => ({
      queryKey: ['audit-criteria', group.id],
      queryFn: () => criteriaGroupsApi.listCriteria(group.id, { page: 1, pageSize: 200 }),
      staleTime: 5 * 60_000,
    })),
  });
  const criteriaDataStamp = criteriaListQueries.map((q) => q.dataUpdatedAt).join(',');
  const nameMaps = useMemo(() => {
    const criteriaNames = new Map<string, string>();
    for (const q of criteriaListQueries) {
      for (const c of q.data?.items ?? []) criteriaNames.set(c.id, c.content);
    }
    const groupNames = new Map(criteriaGroupItems.map((group) => [group.id, group.name]));
    return { criteriaNames, groupNames };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteriaDataStamp, criteriaGroupItems]);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setModule(''); setAction(''); setEntityName(''); setSearchInput(''); setFrom(''); setTo(''); resetPage();
  };

  if (logsQuery.isPending) return <PageLoading label="Đang tải lịch sử thay đổi…" />;
  if (logsQuery.isError) return <EmptyState variant="error" title="Không tải được lịch sử thay đổi" description={logsQuery.error instanceof Error ? logsQuery.error.message : 'Vui lòng thử lại sau.'} />;
  if (!result) return <EmptyState title="Chưa có dữ liệu lịch sử" />;
  const visibleItems = result.items.filter(isBusinessChange);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isLocal ? 'Lịch sử thao tác' : LABELS.AUDIT_TIMELINE_TITLE}
        description={
          isLocal
            ? 'Lịch sử các thay đổi do tài khoản của bạn thực hiện: nộp/sửa hồ sơ, cập nhật điểm, tải tệp…'
            : 'Theo dõi các thay đổi dữ liệu trong hệ thống theo cách dễ đọc và dễ tra cứu.'
        }
      />

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Phân hệ" value={module} onChange={(value) => { setModule(value); resetPage(); }} allLabel="Tất cả phân hệ" options={Object.entries(moduleLabels).map(([value, label]) => ({ value, label }))} />
          <FilterSelect label="Hành động" value={action} onChange={(value) => { setAction(value); resetPage(); }} allLabel="Tất cả hành động" options={Object.entries(actionLabels).map(([value, label]) => ({ value, label: label.charAt(0).toUpperCase() + label.slice(1) }))} />
          <div className="relative min-w-[240px] flex-1">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Tìm theo thao tác hoặc đối tượng…" value={searchInput} onChange={(event) => { setSearchInput(event.target.value); resetPage(); }} />
          </div>
          <Button type="button" variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>
          <span className="text-xs text-muted-foreground">{result.total} thay đổi</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-9 w-[150px]" type="date" aria-label="Từ ngày" value={from} onChange={(event) => { setFrom(event.target.value); resetPage(); }} />
          <span className="text-xs text-muted-foreground">đến</span>
          <Input className="h-9 w-[150px]" type="date" aria-label="Đến ngày" value={to} onChange={(event) => { setTo(event.target.value); resetPage(); }} />
          <FilterSelect label="Đối tượng" value={entityName} onChange={(value) => { setEntityName(value); resetPage(); }} allLabel="Tất cả đối tượng" options={Object.entries(entityLabels).map(([value, label]) => ({ value, label: label.charAt(0).toUpperCase() + label.slice(1) }))} />
        </div>
      </section>

      {visibleItems.length === 0 ? (
        <EmptyState icon={<History className="size-8" />} title="Chưa có thay đổi phù hợp" description="Thử thay đổi điều kiện lọc hoặc khoảng thời gian." />
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Thời gian</th>
                  <th className="px-4 py-2.5 font-medium">Thao tác</th>
                  <th className="px-4 py-2.5 font-medium">Phân hệ</th>
                  <th className="px-4 py-2.5 text-right font-medium">Thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupAuditItems(visibleItems).map((group) => <AuditGroupRow key={group.key} group={group} names={nameMaps} />)}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm"><span className="text-muted-foreground">Trang {result.page}/{Math.max(result.totalPages, 1)}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="size-4" />Trước</Button><Button type="button" variant="outline" size="sm" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>
        </section>
      )}
    </div>
  );
}
