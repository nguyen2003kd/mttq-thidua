import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1PeriodsQueryKey } from '@/api/endpoints/periods';
import { getGetApiV1AuditLogsQueryKey } from '@/api/endpoints/audit-logs';
import { dataQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DataTable, EmptyState, FormDialog, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { getPeriodApiError, periodsApi, type PeriodApi, type PeriodPayload, type PeriodStatusApi } from '../api/periodsApi';

const PERIOD_STATUS_LABELS: Record<PeriodStatusApi, string> = {
  Draft: 'Nháp',
  Active: 'Đang áp dụng',
  Closed: 'Đã kết thúc',
};

const PERIOD_STATUS_STYLES: Record<PeriodStatusApi, string> = {
  Draft: 'bg-primary/5 text-muted-foreground',
  Active: 'bg-success/15 text-success',
  Closed: 'bg-muted text-muted-foreground',
};

interface PeriodFormState {
  startYear: string;
  endYear: string;
  name: string;
  status: PeriodStatusApi;
}

const emptyPeriodForm: PeriodFormState = {
  startYear: '',
  endYear: '',
  name: '',
  status: 'Active',
};

export default function CriteriaPeriodSelectionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodApi | null>(null);
  const [form, setForm] = useState<PeriodFormState>(emptyPeriodForm);
  const periodsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1PeriodsQueryKey(), 'options'),
    queryFn: periodsApi.listAll,
  });
  const periods = periodsQuery.data ?? [];

  const invalidatePeriods = () => invalidateQueryResources(queryClient, [
    getGetApiV1PeriodsQueryKey(),
    getGetApiV1AuditLogsQueryKey(),
  ]);

  const buildPayload = (): PeriodPayload | null => {
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
    return { startYear, endYear, name: form.name.trim() || null, status: form.status };
  };

  const createMutation = useMutation({
    mutationFn: (payload: PeriodPayload) => periodsApi.create(payload),
    onSuccess: async () => {
      toast.success('Đã tạo kỳ thi đua');
      setCreateOpen(false);
      await invalidatePeriods();
    },
    onError: (error) => toast.error(getPeriodApiError(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PeriodPayload }) => periodsApi.update(id, payload),
    onSuccess: async () => {
      toast.success('Đã cập nhật kỳ thi đua');
      setEditOpen(false);
      setSelectedPeriod(null);
      await invalidatePeriods();
    },
    onError: (error) => toast.error(getPeriodApiError(error)),
  });

  const openEdit = useCallback((period: PeriodApi) => {
    setSelectedPeriod(period);
    setForm({
      startYear: String(period.startYear),
      endYear: String(period.endYear),
      name: period.name ?? '',
      status: period.status,
    });
    setEditOpen(true);
  }, []);

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (payload) createMutation.mutate(payload);
  };

  const handleEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPeriod) return;
    const payload = buildPayload();
    if (payload) updateMutation.mutate({ id: selectedPeriod.id, payload });
  };

  const periodForm = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="period-start-year">Năm bắt đầu <span className="text-destructive">*</span></Label>
          <Input id="period-start-year" type="number" value={form.startYear} onChange={(event) => setForm((current) => ({ ...current, startYear: event.target.value }))} placeholder="VD: 2025" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="period-end-year">Năm kết thúc <span className="text-destructive">*</span></Label>
          <Input id="period-end-year" type="number" value={form.endYear} onChange={(event) => setForm((current) => ({ ...current, endYear: event.target.value }))} placeholder="VD: 2026" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="period-name">Tên kỳ <span className="text-xs font-normal text-muted-foreground">Để trống sẽ tự đặt theo năm, VD: 2025-2026</span></Label>
        <Input id="period-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="VD: 2025-2026" maxLength={20} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="period-status">Trạng thái</Label>
        <Select
          value={form.status}
          onValueChange={(value) => setForm((current) => ({ ...current, status: (value ?? current.status) as PeriodStatusApi }))}
          itemToStringLabel={(status) => PERIOD_STATUS_LABELS[status as PeriodStatusApi] ?? 'Trạng thái kỳ thi đua'}
        >
          <SelectTrigger id="period-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {editOpen && <SelectItem value="Draft">Nháp</SelectItem>}
            <SelectItem value="Active">Đang áp dụng</SelectItem>
            <SelectItem value="Closed">Đã kết thúc</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const columns = useMemo<ColumnDef<PeriodApi>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tên kỳ',
      meta: { className: 'font-medium', list: { width: 'minmax(180px, 1fr)' } },
    },
    {
      accessorKey: 'startYear',
      header: 'Năm bắt đầu',
      meta: { align: 'center', list: { width: '132px' } },
    },
    {
      accessorKey: 'endYear',
      header: 'Năm kết thúc',
      meta: { align: 'center', list: { width: '132px' } },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge className={PERIOD_STATUS_STYLES[row.original.status]}>
          {PERIOD_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: { align: 'center', list: { width: '160px' } },
    },
  ], []);

  if (periodsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quản lý tiêu chí" description="Chọn kỳ thi đua để xem các nhóm tiêu chí thuộc kỳ đó." />
        <EmptyState title="Không tải được danh sách kỳ thi đua" description="Vui lòng thử tải lại trang." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý tiêu chí" description="Chọn một kỳ thi đua để xem các nhóm tiêu chí thuộc kỳ đó." />
      <DataTable
        data={periods}
        columns={columns}
        loading={periodsQuery.isLoading}
        variant="list"
        pageSize={10}
        searchable
        searchPlaceholder="Tìm theo tên kỳ thi đua..."
        getRowId={(period) => period.id}
        selectedRowId={selectedPeriod?.id}
        onRowClick={setSelectedPeriod}
        onRowDoubleClick={(period) => navigate(`${ROUTES.SPECIALIST_CRITERIA}?periodFilter=${encodeURIComponent(period.id)}`)}
        toolbar={(
          <div className="flex items-center gap-2">
            {selectedPeriod && (
              <Button variant="edit" size="sm" onClick={() => openEdit(selectedPeriod)}>
                <Pencil className="h-4 w-4" /> Chỉnh sửa kỳ
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSelectedPeriod(null);
                setForm(emptyPeriodForm);
                setCreateOpen(true);
              }}
              action="create"
            >
              <Plus className="h-4 w-4" /> Thêm kỳ thi đua
            </Button>
          </div>
        )}
        emptyState={{ title: 'Chưa có kỳ thi đua', description: 'Tạo kỳ thi đua trước khi quản lý tiêu chí.' }}
        stickyTitle="Danh sách kỳ thi đua"
        stickyDescription="Chọn một kỳ để xem nhóm tiêu chí"
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
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedPeriod(null);
        }}
        title={`Chỉnh sửa kỳ: ${selectedPeriod?.name ?? ''}`}
        onSubmit={handleEdit}
        submitLabel="Lưu thay đổi"
        submitAction="edit"
        submitDisabled={updateMutation.isPending}
      >
        {periodForm}
      </FormDialog>
    </div>
  );
}
