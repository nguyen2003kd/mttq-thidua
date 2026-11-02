import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1PeriodsQueryKey } from '@/api/endpoints/periods';
import { getGetApiV1AuditLogsQueryKey } from '@/api/endpoints/audit-logs';
import { dataQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FilterTextInput, FormDialog, ConfirmDialog } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import {
  comparePeriodStatus,
  periodsApi,
  getPeriodApiError,
  type PeriodApi,
  type PeriodStatusApi,
} from '../api/periodsApi';
import { scoringConfigsApi } from '../api/scoringConfigsApi';

const STATUS_LABELS: Record<PeriodStatusApi, string> = {
  Draft: 'Nháp',
  Active: 'Đang áp dụng',
  Closed: 'Đã kết thúc',
  Published: 'Đã công bố',
};

const STATUS_BADGE: Record<PeriodStatusApi, string> = {
  Draft: 'bg-primary/5 text-muted-foreground',
  Active: 'bg-success/15 text-success',
  Closed: 'bg-muted text-muted-foreground',
  Published: 'bg-primary/10 text-primary',
};

interface FormState {
  startYear: string;
  endYear: string;
  name: string;
  status: PeriodStatusApi;
  scoringConfigId: string;
  maxBonusPointPerPeriod: string;
  maxBonusPointPerCriteria: string;
}

const emptyForm: FormState = { startYear: '', endYear: '', name: '', status: 'Active', scoringConfigId: '', maxBonusPointPerPeriod: '5', maxBonusPointPerCriteria: '1' };

export default function PeriodManagementPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { filters: { periodSearch: search }, setters: { periodSearch: setSearch } } = useQueryFilters({ periodSearch: '' });
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PeriodApi | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const periodsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1PeriodsQueryKey(), { search: debouncedSearch, page: 1, pageSize: 100, sortBy: 'updatedAt', sortOrder: 'desc' }),
    queryFn: () => periodsApi.list({ search: debouncedSearch || undefined, page: 1, pageSize: 100, sortBy: 'updatedAt', sortOrder: 'desc' }),
  });

  const periods = periodsQuery.data?.items ?? [];

  // Danh sách cấu hình điểm cho select bắt buộc trong form kỳ.
  const scoringConfigsQuery = useQuery({
    queryKey: ['scoring-configs', 'options'],
    queryFn: scoringConfigsApi.listAll,
  });
  const scoringConfigs = scoringConfigsQuery.data ?? [];

  const invalidate = () => invalidateQueryResources(queryClient, [getGetApiV1PeriodsQueryKey(), getGetApiV1AuditLogsQueryKey()]);

  const buildPayload = (excludeId?: string): { startYear: number; endYear: number; name: string | null; status: PeriodStatusApi; scoringConfigId: string; maxBonusPointPerPeriod: number; maxBonusPointPerCriteria: number } | null => {
    const startYear = Number(form.startYear);
    const endYear = Number(form.endYear);
    if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear < 1900 || endYear > 2200) {
      toast.error('Năm bắt đầu/kết thúc không hợp lệ.');
      return null;
    }
    if (endYear < startYear) {
      toast.error('Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.');
      return null;
    }
    if (!form.scoringConfigId) {
      toast.error('Vui lòng chọn cấu hình điểm cho kỳ thi đua.');
      return null;
    }
    const maxBonusPointPerPeriod = Number(form.maxBonusPointPerPeriod);
    const maxBonusPointPerCriteria = Number(form.maxBonusPointPerCriteria);
    if (!Number.isFinite(maxBonusPointPerPeriod) || maxBonusPointPerPeriod <= 0 || !Number.isFinite(maxBonusPointPerCriteria) || maxBonusPointPerCriteria <= 0) {
      toast.error('Điểm thưởng tối đa trong kỳ và trên tiêu chí con phải lớn hơn 0.');
      return null;
    }
    // Tên trống -> tự sinh theo năm (BE cũng vậy); check trùng trên tên đã resolve
    const name = form.name.trim();
    const resolvedName = name || `${startYear}-${endYear}`;
    if (periods.some((p) => p.id !== excludeId && p.name.trim().toLowerCase() === resolvedName.toLowerCase())) {
      toast.error('Tên kỳ thi đua đã tồn tại, vui lòng chọn tên khác.');
      return null;
    }
    return { startYear, endYear, name: name || null, status: form.status, scoringConfigId: form.scoringConfigId, maxBonusPointPerPeriod, maxBonusPointPerCriteria };
  };

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload> & object) => periodsApi.create(payload),
    onSuccess: async () => {
      toast.success('Đã tạo kỳ thi đua');
      setCreateOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(getPeriodApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnType<typeof buildPayload> & object }) =>
      periodsApi.update(id, payload),
    onSuccess: async (updated) => {
      toast.success('Đã cập nhật kỳ thi đua');
      setSelected(updated);
      setEditOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(getPeriodApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => periodsApi.remove(id),
    onSuccess: async () => {
      toast.success('Đã xóa kỳ thi đua');
      setDeleteOpen(false);
      setSelected(null);
      await invalidate();
    },
    onError: (e) => toast.error(getPeriodApiError(e)),
  });

  const columns = useMemo<ColumnDef<PeriodApi>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tên kỳ',
      meta: { className: 'font-medium', list: { width: 'minmax(160px, 1fr)' } },
    },
    {
      accessorKey: 'startYear',
      header: 'Năm bắt đầu',
      enableSorting: true,
      sortDescFirst: false,
      meta: { align: 'center', sortable: true, list: { width: '160px' } },
    },
    {
      accessorKey: 'endYear',
      header: 'Năm kết thúc',
      enableSorting: true,
      sortDescFirst: false,
      meta: { align: 'center', sortable: true, list: { width: '160px' } },
    },
    {
      accessorKey: 'scoringConfigName',
      header: 'Cấu hình điểm',
      cell: ({ row }) => row.original.scoringConfigName || '—',
      meta: { list: { width: 'minmax(140px, 1fr)' } },
    },
    {
      id: 'bonusLimits',
      header: 'Điểm thưởng',
      cell: ({ row }) => `${row.original.maxBonusPointPerPeriod}/kỳ · ${row.original.maxBonusPointPerCriteria}/tiêu chí`,
      meta: { align: 'center', list: { width: '190px' } },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      enableSorting: true,
      sortDescFirst: false,
      sortingFn: (rowA, rowB) => comparePeriodStatus(rowA.original.status, rowB.original.status),
      cell: ({ row }) => (
        <Badge className={STATUS_BADGE[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge>
      ),
      meta: { sortable: true, list: { width: '150px' } },
    },
  ], []);

  const openEdit = (period: PeriodApi) => {
    setSelected(period);
    setForm({
      startYear: String(period.startYear),
      endYear: String(period.endYear),
      name: period.name,
      status: period.status,
      scoringConfigId: period.scoringConfigId ?? '',
      maxBonusPointPerPeriod: String(period.maxBonusPointPerPeriod ?? 5),
      maxBonusPointPerCriteria: String(period.maxBonusPointPerCriteria ?? 1),
    });
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (payload) createMutation.mutate(payload);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const payload = buildPayload(selected?.id);
    if (payload) updateMutation.mutate({ id: selected.id, payload });
  };

  // Cấu hình điểm thưởng chỉ chỉnh được khi kỳ còn Nháp — khớp ràng buộc của BE.
  const bonusLimitsLocked = editOpen && selected?.status !== 'Draft';

  const periodForm = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-start">Năm bắt đầu <span className="text-destructive">*</span></Label>
          <Input id="p-start" type="number" value={form.startYear} onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value }))} placeholder="VD: 2025" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-end">Năm kết thúc <span className="text-destructive">*</span></Label>
          <Input id="p-end" type="number" value={form.endYear} onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value }))} placeholder="VD: 2026" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Tên kỳ <span className="text-xs font-normal text-muted-foreground">Để trống sẽ tự đặt theo năm, VD: 2025-2026</span></Label>
        <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Thi đua 2025-2026" maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-status">Trạng thái</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((f) => ({ ...f, status: (v ?? f.status) as PeriodStatusApi }))}
          itemToStringLabel={(status) => STATUS_LABELS[status as PeriodStatusApi] ?? 'Trạng thái kỳ thi đua'}
        >
          <SelectTrigger id="p-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Đang áp dụng</SelectItem>
            <SelectItem value="Closed">Đã kết thúc</SelectItem>
            {editOpen && <SelectItem value="Published">Đã công bố</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-scoring-config">Cấu hình điểm <span className="text-destructive">*</span></Label>
        <Select
          value={form.scoringConfigId}
          onValueChange={(v) => setForm((f) => ({ ...f, scoringConfigId: v ?? '' }))}
          itemToStringLabel={(id) => scoringConfigs.find((config) => config.id === id)?.name ?? 'Cấu hình điểm'}
        >
          <SelectTrigger id="p-scoring-config"><SelectValue placeholder="Chọn cấu hình điểm" /></SelectTrigger>
          <SelectContent>
            {scoringConfigs.map((config) => (
              <SelectItem key={config.id} value={config.id}>{config.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Kỳ sẽ xếp loại kết quả theo các mức điểm của cấu hình này.</p>
      </div>
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-bonus-period">Điểm thưởng tối đa trong kỳ <span className="text-destructive">*</span></Label>
          <Input
            id="p-bonus-period"
            type="number"
            min="0"
            step="0.5"
            value={form.maxBonusPointPerPeriod}
            disabled={bonusLimitsLocked}
            onChange={(e) => setForm((f) => ({ ...f, maxBonusPointPerPeriod: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-bonus-criteria">Điểm thưởng tối đa trên tiêu chí con <span className="text-destructive">*</span></Label>
          <Input
            id="p-bonus-criteria"
            type="number"
            min="0"
            step="0.5"
            value={form.maxBonusPointPerCriteria}
            disabled={bonusLimitsLocked}
            onChange={(e) => setForm((f) => ({ ...f, maxBonusPointPerCriteria: e.target.value }))}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {bonusLimitsLocked
          ? 'Cấu hình điểm thưởng chỉ chỉnh được khi kỳ thi đua còn ở trạng thái Nháp.'
          : 'Giới hạn tổng điểm thưởng một địa phương nhận được trong kỳ và điểm thưởng tối đa trên mỗi tiêu chí con.'}
      </p>
    </>
  );

  return (
    <div>
      {!embedded && <PageHeader
        title="Quản lý Kỳ thi đua"
        description="Khai báo các kỳ thi đua. Mỗi nhóm tiêu chí thuộc một kỳ — khi công bố kết quả sẽ chọn theo kỳ."
        className="pb-3 border-b-0"
      />}

      <DataTable
        data={periods}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        selectedRowId={selected?.id}
        loading={periodsQuery.isLoading}
        pageSize={10}
        onRowClick={setSelected}
        onRowDoubleClick={openEdit}
        filters={
          <FilterTextInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm tên kỳ…"
            className="h-9 w-64"
          />
        }
        onClearFilters={() => setSearch('')}
        emptyState={search.trim()
          ? { title: 'Không tìm thấy kỳ thi đua', description: 'Thử từ khóa khác.' }
          : { title: 'Chưa có kỳ thi đua', description: 'Tạo kỳ đầu tiên để gắn nhóm tiêu chí.' }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            {selected && !editOpen && !deleteOpen && !createOpen && (
              <>
                <Button variant="edit" size="sm" onClick={() => openEdit(selected)}>
                  Chỉnh sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selected.status !== 'Draft'}
                  disabledReason={selected.status !== 'Draft' ? 'Chỉ có thể xóa kỳ thi đua ở trạng thái Nháp.' : undefined}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </Button>
              </>
            )}
            <Button size="sm" className="h-9!" onClick={() => { setSelected(null); setForm(emptyForm); setCreateOpen(true); }} action="create">
              <Plus className="h-4 w-4 ml-2" /> Thêm kỳ
            </Button>
          </div>
        }
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Thêm kỳ thi đua"
        onSubmit={handleCreate}
        submitLabel="Tạo kỳ"
        submitAction="create"
        submitDisabled={createMutation.isPending}
      >
        {periodForm}
      </FormDialog>

      <FormDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setSelected(null); }}
        title={`Chỉnh sửa kỳ: ${selected?.name ?? ''}`}
        onSubmit={handleEdit}
        submitLabel="Lưu thay đổi"
        submitAction="edit"
        submitDisabled={updateMutation.isPending}
      >
        {periodForm}
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa kỳ thi đua?"
        description={`Xóa kỳ ${selected?.name ?? ''}? Kỳ ở trạng thái Nháp sẽ bị xóa vĩnh viễn cùng các nhóm tiêu chí nháp bên trong (nếu có).`}
        confirmLabel="Xóa kỳ"
        variant="destructive"
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
      />

    </div>
  );
}
