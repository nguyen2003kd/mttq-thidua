import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FormDialog, ConfirmDialog } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  periodsApi,
  getPeriodApiError,
  type PeriodApi,
  type PeriodStatusApi,
} from '../api/periodsApi';

const STATUS_LABELS: Record<PeriodStatusApi, string> = {
  Draft: 'Nháp',
  Active: 'Đang áp dụng',
  Closed: 'Đã kết thúc',
};

const STATUS_BADGE: Record<PeriodStatusApi, string> = {
  Draft: 'bg-primary/5 text-muted-foreground',
  Active: 'bg-success/15 text-success',
  Closed: 'bg-muted text-muted-foreground',
};

interface FormState {
  startYear: string;
  endYear: string;
  name: string;
  status: PeriodStatusApi;
}

const emptyForm: FormState = { startYear: '', endYear: '', name: '', status: 'Draft' };

export default function PeriodManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PeriodApi | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const periodsQuery = useQuery({
    queryKey: ['admin-periods'],
    queryFn: () => periodsApi.listAll(),
  });

  const periods = useMemo(() => {
    const items = periodsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((p) => p.name.toLowerCase().includes(term));
  }, [periodsQuery.data, search]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
  };

  const buildPayload = (): { startYear: number; endYear: number; name: string | null; status: PeriodStatusApi } | null => {
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
    mutationFn: (payload: ReturnType<typeof buildPayload> & object) => periodsApi.create(payload),
    onSuccess: () => {
      toast.success('Đã tạo kỳ thi đua');
      setCreateOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getPeriodApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnType<typeof buildPayload> & object }) =>
      periodsApi.update(id, payload),
    onSuccess: (updated) => {
      toast.success('Đã cập nhật kỳ thi đua');
      setSelected(updated);
      setEditOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getPeriodApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => periodsApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa kỳ thi đua');
      setDeleteOpen(false);
      setSelected(null);
      invalidate();
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
      meta: { align: 'center', list: { width: '110px' } },
    },
    {
      accessorKey: 'endYear',
      header: 'Năm kết thúc',
      meta: { align: 'center', list: { width: '110px' } },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge className={STATUS_BADGE[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge>
      ),
      meta: { list: { width: '130px' } },
    },
  ], []);

  const openEdit = (period: PeriodApi) => {
    setSelected(period);
    setForm({
      startYear: String(period.startYear),
      endYear: String(period.endYear),
      name: period.name,
      status: period.status,
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
    const payload = buildPayload();
    if (payload) updateMutation.mutate({ id: selected.id, payload });
  };

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
        <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: 2025-2026" maxLength={20} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-status">Trạng thái</Label>
        <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: (v ?? 'Draft') as PeriodStatusApi }))}>
          <SelectTrigger id="p-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Draft">Nháp</SelectItem>
            <SelectItem value="Active">Đang áp dụng</SelectItem>
            <SelectItem value="Closed">Đã kết thúc</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <div>
      <PageHeader
        title="Quản lý Kỳ thi đua"
        description="Khai báo các kỳ thi đua. Mỗi nhóm tiêu chí thuộc một kỳ — khi công bố kết quả sẽ chọn theo kỳ."
        className="pb-3 border-b-0"
      />

      <DataTable
        data={periods}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        loading={periodsQuery.isLoading}
        pageSize={10}
        onRowClick={openEdit}
        filters={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên kỳ…"
            className="h-9 w-64"
          />
        }
        emptyState={{ title: 'Chưa có kỳ thi đua', description: 'Tạo kỳ đầu tiên để gắn nhóm tiêu chí.' }}
        toolbar={
          <Button size="sm" className="h-9!" onClick={() => { setForm(emptyForm); setCreateOpen(true); }} action="create">
            <Plus className="h-4 w-4 ml-2" /> Thêm kỳ
          </Button>
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
        description={`Xóa kỳ ${selected?.name ?? ''}? Chỉ nên xóa kỳ chưa gắn nhóm tiêu chí nào.`}
        confirmLabel="Xóa kỳ"
        variant="destructive"
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
      />

      {selected && !editOpen && !deleteOpen && (
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => selected && openEdit(selected)}>
            Chỉnh sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Xóa
          </Button>
        </div>
      )}
    </div>
  );
}
