import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useScoreStore } from '@/store/scoreStore';
import {
  PageHeader,
  DataTable,
  FilterSelect,
  FormDialog,
} from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LABELS } from '@/constants/labels';
import { CRITERIA_STATUS_LABELS } from '@/constants/enums';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Eye, Pencil, Send } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable } from '@/types/domain';
import { criteriaGroupsApi, getCriteriaApiError, type CriteriaGroupApi } from '@/features/admin/api/criteriaGroupsApi';

const toDateTimeInput = (value: string) => value ? (value.includes('T') ? value.slice(0, 16) : `${value}T23:59`) : '';
const toTableStatus = (status: CriteriaGroupApi['status']): CriteriaTable['status'] => status === 'Applied' ? 'ACTIVE' : status === 'Closed' ? 'EXPIRED' : 'DRAFT';
const toCriteriaTable = (group: CriteriaGroupApi): CriteriaTable => ({
  id: group.id,
  name: group.name,
  totalScore: group.maxPoint,
  content: group.content ?? undefined,
  status: toTableStatus(group.status),
  criteria: group.criteria.map((criterion, index) => ({ id: criterion.id, name: criterion.content, maxScore: criterion.maxPoint, bonusScore: criterion.maxBonusPoint, deadline: criterion.deadline ?? undefined, note: criterion.note ?? undefined, order: index + 1 })),
  // API không trả số đơn vị đã nhận; chỉ dùng cờ này cho cách hiển thị trạng thái cũ của bảng.
  assignedLocalityCount: group.status === 'Applied' ? 1 : 0,
  openDate: group.createdAt,
  closeDate: group.deadline ?? '',
  updatedAt: group.updatedAt ?? undefined,
});

export default function CriteriaListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const localities = useScoreStore((s) => s.localities);
  const deadline = useScoreStore((s) => s.deadline);
  const setDeadline = useScoreStore((s) => s.setDeadline);
  const { data: groupPage, isLoading } = useQuery({ queryKey: ['criteria-groups'], queryFn: () => criteriaGroupsApi.list({ page: 1, pageSize: 100 }) });
  const criteriaTables = useMemo(() => (groupPage?.items ?? []).map(toCriteriaTable), [groupPage]);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');

  const availableYears = useMemo(
    () => Array.from(new Set(criteriaTables.map((t) => new Date(t.openDate).getFullYear().toString()))).sort().reverse(),
    [criteriaTables],
  );

  const filteredTables = useMemo(() => {
    return criteriaTables.filter((t) => {
      const statusMatch = !statusFilter || t.status === statusFilter;
      const yearMatch =
        !yearFilter ||
        new Date(t.openDate).getFullYear().toString() === yearFilter ||
        new Date(t.closeDate).getFullYear().toString() === yearFilter;
      return statusMatch && yearMatch;
    });
  }, [criteriaTables, statusFilter, yearFilter]);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [content, setContent] = useState('');
  const [editingTable, setEditingTable] = useState<CriteriaTable | null>(null);
  const [selectedTable, setSelectedTable] = useState<CriteriaTable | null>(null);
  const [applyTable, setApplyTable] = useState<CriteriaTable | null>(null);
  const [applyFile, setApplyFile] = useState<File | null>(null);
  const [applyError, setApplyError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(toDateTimeInput(deadline));

  const columns = useMemo<ColumnDef<CriteriaTable>[]>(
    () => [
      {
        accessorKey: 'name',
        header: LABELS.CRITERIA_TABLE_NAME,
        meta: {
          className: 'font-medium',
          list: { width: 'minmax(220px, 1.5fr)' },
        },
      },
      {
        id: 'content',
        accessorFn: (row) => row.content ?? row.criteria.map((criteria) => criteria.name).join(' '),
        header: 'Nội dung tiêu chí',
        cell: ({ row }) => (
          <p className="max-w-[280px] truncate text-sm text-muted-foreground" title={row.original.content}>
            {row.original.content || '—'}
          </p>
        ),
        meta: { list: { label: 'Nội dung tiêu chí', width: 'minmax(220px, 1.4fr)' } },
      },
      {
        accessorKey: 'closeDate',
        header: 'Hạn nộp',
        cell: ({ row }) => row.original.closeDate ? formatDate(row.original.closeDate) : '—',
        meta: {
          align: 'left',
          list: { label: 'Hạn nộp', width: '1fr' },
        },
      },
      {
        accessorKey: 'totalScore',
        header: LABELS.CRITERIA_TOTAL_SCORE,
        meta: {
          align: 'right',
          list: { label: LABELS.CRITERIA_TOTAL_SCORE, width: '1fr', valueClassName: 'text-primary' },
        },
      },
      {
        accessorKey: 'note',
        header: 'Ghi chú',
        cell: ({ row }) => (
          <p className="max-w-[180px] truncate text-sm text-muted-foreground" title={row.original.note}>
            {row.original.note || '—'}
          </p>
        ),
        meta: { list: { label: 'Ghi chú', width: 'minmax(160px, 1fr)' } },
      },
      {
        accessorKey: 'status',
        header: LABELS.CRITERIA_STATUS,
        cell: ({ row }) => row.original.assignedLocalityCount > 0
          ? <Badge className="bg-success/15 text-success">Đã áp dụng</Badge>
          : <Badge className="bg-[#9CA3AF]/15 text-[#626A76]">Chưa áp dụng</Badge>,
        meta: {
          align: 'center',
          list: { label: LABELS.CRITERIA_STATUS, width: '1fr' },
        },
      },
      {
        accessorKey: 'openDate',
        header: 'Cập nhật lần cuối',
        cell: ({ row }) => (
          <p className="text-sm">bởi {row.original.updatedBy ?? 'Hệ thống'} · {formatDateTime(row.original.updatedAt ?? row.original.openDate)}</p>
        ),
        meta: {
          align: 'left',
          list: { label: 'Cập nhật lần cuối', width: '1fr' },
        },
      },
    ],
    [],
  );

  const resetEditor = () => {
    setName('');
    setCloseDate('');
    setTotalScore('');
    setContent('');
    setEditingTable(null);
  };

  const openCreateDialog = () => {
    resetEditor();
    setOpen(true);
  };

  const openEditDialog = (table: CriteriaTable) => {
    setEditingTable(table);
    setName(table.name);
    setCloseDate(toDateTimeInput(table.closeDate));
    setTotalScore(String(table.totalScore));
    setContent(table.content ?? '');
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotalScore = Number(totalScore);
    if (!name.trim() || !content.trim() || !Number.isFinite(parsedTotalScore) || parsedTotalScore <= 0) {
      toast.error('Vui lòng nhập Nhóm tiêu chí, Tổng điểm lớn hơn 0 và Nội dung tiêu chí.');
      return;
    }

    if (editingTable?.assignedLocalityCount) {
      toast.error('Nhóm tiêu chí đã áp dụng không thể cập nhật.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), content: content.trim(), maxPoint: parsedTotalScore, deadline: closeDate || null };
      if (editingTable) {
        await criteriaGroupsApi.update(editingTable.id, payload);
        toast.success('Đã cập nhật nhóm tiêu chí');
      } else {
        await criteriaGroupsApi.create(payload);
        toast.success('Đã tạo nhóm tiêu chí mới. Hãy thêm tiêu chí con trước khi áp dụng.');
      }
      await queryClient.invalidateQueries({ queryKey: ['criteria-groups'] });
      setSelectedTable(null);
      setOpen(false);
      resetEditor();
    } catch (error) {
      toast.error(getCriteriaApiError(error));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={LABELS.CRITERIA_TABLE}
        description="Quản lý nhóm tiêu chí và tiêu chí chấm điểm thi đua khen thưởng."
        actions={new Date(deadline).getTime() <= Date.now() ? <Badge className="h-7 bg-accent/20 px-3 text-foreground">Đến hạn gợi ý công bố</Badge> : undefined}
      />

      <DataTable
        data={filteredTables}
        loading={isLoading}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        searchable
        searchKey="name"
        searchPlaceholder="Tìm theo tên bảng tiêu chí..."
        pageSize={10}
        onRowClick={(row) => setSelectedTable(row)}
        onRowDoubleClick={(row) => navigate(`/chuyen-vien/tieu-chi/${row.id}/con`)}
        filters={
          <>
            <FilterSelect
              label="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'DRAFT', label: CRITERIA_STATUS_LABELS.DRAFT },
                { value: 'ACTIVE', label: CRITERIA_STATUS_LABELS.ACTIVE },
                { value: 'EXPIRED', label: CRITERIA_STATUS_LABELS.EXPIRED },
              ]}
            />
            <FilterSelect
              label="Năm"
              value={yearFilter}
              onChange={setYearFilter}
              options={availableYears.map((year) => ({ value: year, label: year }))}
            />
          </>
        }
        activeFilters={[
          ...(statusFilter
            ? [{
                label: 'Trạng thái',
                value: CRITERIA_STATUS_LABELS[statusFilter as CriteriaTable['status']],
                onClear: () => setStatusFilter(''),
              }]
            : []),
          ...(yearFilter
            ? [{ label: 'Năm', value: yearFilter, onClear: () => setYearFilter('') }]
            : []),
        ]}
        onClearFilters={
          statusFilter || yearFilter
            ? () => {
                setStatusFilter('');
                setYearFilter('');
              }
            : undefined
        }
        emptyState={{
          title: 'Chưa có bảng tiêu chí',
          description: 'Tạo bảng tiêu chí đầu tiên để bắt đầu.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
              <>
                <Button variant="info" disabled={!selectedTable} onClick={() => selectedTable && navigate(`/chuyen-vien/tieu-chi/${selectedTable.id}/con`)}>
                  <Eye className="mr-1.5 h-4 w-4" /> Xem
                </Button>
                <Button variant="warning" disabled={!selectedTable} onClick={() => selectedTable && openEditDialog(selectedTable)}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Sửa
                </Button>
                <Button variant="outline" disabled={!selectedTable} onClick={() => selectedTable && navigate(`/chuyen-vien/tieu-chi/${selectedTable.id}/con`)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Tiêu chí con
                </Button>
                <Button disabled={!selectedTable} onClick={() => { if (selectedTable) { setApplyFile(null); setApplyError(''); setApplyTable(selectedTable); } }}>
                  <Send className="mr-1.5 h-4 w-4" /> Áp dụng tiêu chí cho địa phương
                </Button>
              </>
            <Button variant="outline" onClick={() => { setDeadlineValue(toDateTimeInput(deadline)); setDeadlineOpen(true); }}>Đặt thời gian gợi ý công bố kết quả</Button>
            <Button onClick={openCreateDialog} action="create">
              <Plus className="mr-1.5 h-4 w-4" /> {LABELS.CREATE}
            </Button>
          </div>
        }
      />

      <FormDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetEditor();
        }}
        title={editingTable ? 'Cập nhật bảng tiêu chí' : 'Tạo bảng tiêu chí mới'}
        description={editingTable ? 'Cập nhật thông tin nhóm tiêu chí.' : 'Khai báo thông tin nhóm tiêu chí trước khi áp dụng.'}
        onSubmit={handleSave}
        submitDisabled={saving}
        submitLabel={editingTable ? 'Lưu thay đổi' : LABELS.CREATE}
        cancelLabel={LABELS.CANCEL}
        submitAction={editingTable ? 'edit' : 'create'}
        size="w-[calc(100vw-4rem)] max-w-5xl sm:max-w-5xl"
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-1.5">
            <Label htmlFor="criteria-name">Nhóm tiêu chí <span className="text-destructive">*</span></Label>
            <Input id="criteria-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nhóm tiêu chí về công tác Mặt trận" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="criteria-total-score">Tổng điểm <span className="text-destructive">*</span></Label>
            <Input id="criteria-total-score" type="number" min={1} value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="VD: 100" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="criteria-content">Nội dung <span className="text-destructive">*</span></Label>
          <Textarea id="criteria-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mô tả nội dung, phạm vi và yêu cầu của nhóm tiêu chí" rows={3} />
        </div>
        <div className="max-w-sm space-y-1.5">
          <Label htmlFor="close-date">Hạn nộp</Label>
          <Input id="close-date" type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          <p className="text-xs text-muted-foreground">Có thể để trống nếu chưa quy định hạn nộp.</p>
        </div>
      </FormDialog>

      <FormDialog
        open={!!applyTable}
        onOpenChange={(isOpen) => { if (!isOpen) setApplyTable(null); }}
        title="Áp dụng tiêu chí cho địa phương"
        description={`Bảng “${applyTable?.name ?? ''}” sẽ được gửi đến toàn bộ ${localities.length} địa phương trong hệ thống.`}
        submitLabel="Áp dụng"
        cancelLabel="Đóng"
        submitAction="assign"
        submitDisabled={saving}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!applyTable) return;
          if (applyFile && applyFile.size > 20 * 1024 * 1024) { setApplyError('File thông báo không được vượt quá 20MB.'); return; }
          if (applyFile) { setApplyError('API hiện chưa nhận file thông báo khi áp dụng.'); return; }
          setSaving(true);
          try {
            await criteriaGroupsApi.apply(applyTable.id);
            await queryClient.invalidateQueries({ queryKey: ['criteria-groups'] });
            setSelectedTable(null);
            setApplyTable(null);
            toast.success('Đã áp dụng nhóm tiêu chí cho các địa phương.');
          } catch (error) { toast.error(getCriteriaApiError(error)); }
          finally { setSaving(false); }
        }}
      >
        <div className="rounded-md border border-primary/20 bg-primary/[0.04] p-3"><p className="font-medium">Địa phương <span className="text-destructive">★</span></p><p className="mt-1 text-sm text-muted-foreground">Áp dụng toàn bộ {localities.length} địa phương</p></div>
        <div className="space-y-1.5"><Label htmlFor="apply-notice-file">Đính kèm file thông báo</Label><Input id="apply-notice-file" type="file" onChange={(event) => setApplyFile(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Dung lượng tối đa 20MB.</p></div>
        {applyError && <p className="text-sm font-medium text-destructive">⚠ {applyError}</p>}
      </FormDialog>

      <FormDialog
        open={deadlineOpen}
        onOpenChange={setDeadlineOpen}
        title="Đặt thời gian gợi ý công bố kết quả"
        description="Một mốc chung toàn hệ thống; chỉ hiển thị nhắc nhở cho Chuyên viên."
        onSubmit={(event) => { event.preventDefault(); if (!deadlineValue) { toast.error('Vui lòng chọn thời gian gợi ý công bố.'); return; } setDeadline(deadlineValue); setDeadlineOpen(false); toast.success('Đã lưu thời gian gợi ý công bố kết quả'); }}
        submitLabel="Lưu"
        cancelLabel="Đóng"
      >
        <div className="space-y-1.5"><Label htmlFor="suggested-publish-time">Thời gian gợi ý công bố <span className="text-destructive">★</span></Label><Input id="suggested-publish-time" type="datetime-local" value={deadlineValue} onChange={(event) => setDeadlineValue(event.target.value)} /></div>
      </FormDialog>

    </div>
  );
}
