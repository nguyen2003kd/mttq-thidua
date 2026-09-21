import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Database,
  History,
  UserRound,
} from 'lucide-react';
import { Button, EmptyState, FilterSelect, PageHeader, PageLoading } from '@/components/core';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
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
  Files: 'Tệp tin',
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
};

const hiddenAuditFields = new Set(['Id', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy']);

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

  if ((field === 'Deadline' || field.endsWith('At')) && typeof value === 'string') {
    return formatDateTime(value);
  }

  if (typeof value === 'number') return value.toLocaleString('vi-VN');
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
}

function getChangedFields(item: AuditLogItem) {
  if (item.action !== 'Updated') return [];

  const changedData = parseJsonRecord(item.changedData);
  if (!changedData) return [];

  return Object.entries(changedData)
    .filter(([field]) => !hiddenAuditFields.has(field))
    .map(([field, value]) => {
      const change = value as { before?: unknown; after?: unknown };
      return {
        label: fieldLabels[field] ?? field,
        before: formatAuditValue(field, change?.before),
        after: formatAuditValue(field, change?.after),
      };
    });
}

function getActorLabel(actor: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(actor) ? 'Người dùng hệ thống' : actor || 'Hệ thống tự động';
}

function AuditItem({ item }: { item: AuditLogItem }) {
  const action = getActionLabel(item.action);
  const entity = getEntityLabel(item.entityName);
  const module = moduleLabels[item.module] ?? item.module;
  const changedFields = getChangedFields(item);

  return (
    <article className="p-4 transition-colors hover:bg-muted/20 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-base leading-6 text-foreground">
              {!item.success && <CircleX className="mr-2 inline-block size-4 align-[-2px] text-destructive" />}
              <span className="font-semibold">{getActorLabel(item.actor)}</span>{' '}đã{' '}
              <span className="font-semibold">{action}</span>{' '}
              <span className="font-semibold">{entity}</span>
            </p>
            {!item.success && (
              <span className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                Thất bại
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5">
              <Database className="size-3.5 shrink-0" />
              <span>{module}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5">
              <Clock3 className="size-3.5 shrink-0" />
              <span>{formatDateTime(item.createdAt)}</span>
            </span>
          </div>
        </div>

        {changedFields.length > 0 && (
          <div className="rounded-lg border bg-muted/10 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nội dung thay đổi</p>
            <div className="space-y-3">
              {changedFields.map((field) => (
                <div key={field.label} className="rounded-md border bg-background/70 p-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">{field.label}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="min-w-0 rounded-md bg-muted/30 p-2.5">
                      <p className="text-xs text-muted-foreground">Giá trị cũ</p>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{field.before}</p>
                    </div>
                    <div className="min-w-0 rounded-md bg-primary/5 p-2.5">
                      <p className="text-xs text-muted-foreground">Giá trị mới</p>
                      <p className="mt-1 break-words text-sm font-medium text-foreground">{field.after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function AuditLogPage() {
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
      <PageHeader title={LABELS.AUDIT_TIMELINE_TITLE} description="Theo dõi các thay đổi dữ liệu trong hệ thống theo cách dễ đọc và dễ tra cứu." />

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
          <div className="divide-y">
            {visibleItems.map((item) => <AuditItem key={item.id} item={item} />)}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm"><span className="text-muted-foreground">Trang {result.page}/{Math.max(result.totalPages, 1)}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="size-4" />Trước</Button><Button type="button" variant="outline" size="sm" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>
        </section>
      )}
    </div>
  );
}
