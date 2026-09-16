import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useScoreStore } from '@/store/scoreStore';
import {
  PageHeader,
  DataTable,
  FilterSelect,
  FormDialog,
  FileUpload,
} from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LABELS } from '@/constants/labels';
import { CRITERIA_STATUS_LABELS } from '@/constants/enums';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertTriangle, Plus, Eye, Pencil, Send, Calendar, Info } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable } from '@/types/domain';
import { criteriaGroupsApi, getCriteriaApiError, type CriteriaGroupApi, type CriteriaGroupStatusApi } from '@/features/admin/api/criteriaGroupsApi';
import { useFileUpload } from '@/hooks/useFileUpload';
import { validateCriteriaApplication } from '@/features/admin/criteriaValidation';

const toDateTimeInput = (value: string) => value ? (value.includes('T') ? value.slice(0, 16) : `${value}T23:59`) : '';
const toTableStatus = (status: CriteriaGroupApi['status']): CriteriaTable['status'] => status === 'Applied' ? 'ACTIVE' : status === 'Closed' ? 'EXPIRED' : 'DRAFT';
const toCriteriaTable = (group: CriteriaGroupApi): CriteriaTable => ({
  id: group.id,
  name: group.name,
  totalScore: group.maxPoint,
  content: group.content ?? undefined,
  status: toTableStatus(group.status),
  criteria: group.criteria.map((criterion, index) => ({ id: criterion.id, name: criterion.content, maxScore: criterion.maxPoint, bonusScore: criterion.maxBonusPoint, deadline: criterion.deadline ?? undefined, note: criterion.note ?? undefined, order: index + 1 })),
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CriteriaGroupStatusApi | ''>('');
  const [sort, setSort] = useState('createdAt-desc');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sortBy, sortOrder] = sort.split('-') as ['createdAt' | 'name' | 'deadline' | 'maxPoint', 'asc' | 'desc'];
  const { data: groupPage, isLoading } = useQuery({
    queryKey: ['criteria-groups', { search, statusFilter, sortBy, sortOrder }],
    queryFn: () => criteriaGroupsApi.list({ search: search || undefined, status: statusFilter || undefined, sortBy, sortOrder, page: 1, pageSize: 100 }),
  });
  const criteriaTables = useMemo(() => (groupPage?.items ?? []).map(toCriteriaTable), [groupPage]);

  const availableYears = useMemo(
    () => Array.from(new Set(criteriaTables.map((t) => new Date(t.openDate).getFullYear().toString()))).sort().reverse(),
    [criteriaTables],
  );

  const filteredTables = useMemo(() => {
    return criteriaTables.filter((t) => {
      const yearMatch =
        !yearFilter ||
        new Date(t.openDate).getFullYear().toString() === yearFilter ||
        new Date(t.closeDate).getFullYear().toString() === yearFilter;
      return yearMatch;
    });
  }, [criteriaTables, yearFilter]);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [content, setContent] = useState('');
  const [editingTable, setEditingTable] = useState<CriteriaTable | null>(null);
  const [selectedTable, setSelectedTable] = useState<CriteriaTable | null>(null);
  const [applyTable, setApplyTable] = useState<CriteriaTable | null>(null);
  const [applyFiles, setApplyFiles] = useState<File[]>([]);
  const [applyError, setApplyError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(toDateTimeInput(deadline));
  const { uploading: fileUploading, uploadProgress: fileProgress, uploadFiles } = useFileUpload();

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
          list: { label: 'Hạn nộp', width: '1fr' },
        },
      },
      {
        accessorKey: 'totalScore',
        header: LABELS.CRITERIA_TOTAL_SCORE,
        meta: {
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
        cell: ({ row }) =>
          row.original.status === 'ACTIVE'
            ? <Badge className="bg-success/15 text-success">Đã áp dụng</Badge>
            : row.original.status === 'EXPIRED'
              ? <Badge className="bg-[#9CA3AF]/15 text-[#626A76]">Đã kết thúc</Badge>
              : <Badge className="bg-[#9CA3AF]/15 text-[#626A76]">Nháp</Badge>,
        meta: {
          list: { label: LABELS.CRITERIA_STATUS, width: '1fr' },
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

  const openApplyDialog = async (table: CriteriaTable) => {
    setSaving(true);
    try {
      const latestGroup = await criteriaGroupsApi.get(table.id);
      const latestTable = toCriteriaTable(latestGroup);
      const validation = validateCriteriaApplication(
        latestTable.totalScore,
        latestTable.criteria.map((item) => item.maxScore),
      );
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      setApplyFiles([]);
      setApplyError('');
      setApplyTable(latestTable);
    } catch (error) {
      toast.error(getCriteriaApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotalScore = Number(totalScore);
    if (!name.trim() || !content.trim() || !Number.isFinite(parsedTotalScore) || parsedTotalScore <= 0) {
      toast.error('Vui lòng nhập Nhóm tiêu chí, Tổng điểm lớn hơn 0 và Nội dung tiêu chí.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: name.trim(), content: content.trim(), maxPoint: parsedTotalScore, deadline: closeDate || null };
      if (editingTable) {
        const latestGroup = await criteriaGroupsApi.get(editingTable.id);
        const childrenTotal = latestGroup.criteria.reduce((sum, criterion) => sum + criterion.maxPoint, 0);
        if (parsedTotalScore < childrenTotal) {
          toast.error(
            `Không thể giảm tổng điểm xuống ${parsedTotalScore}. Tổng điểm của các tiêu chí con hiện là ${childrenTotal}.`,
          );
          return;
        }
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
        selectedRowId={selectedTable?.id}
        searchable
        searchKey="name"
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tên bảng tiêu chí..."
        pageSize={10}
        onRowClick={(row) => setSelectedTable(row)}
        onRowDoubleClick={(row) => navigate(`/chuyen-vien/tieu-chi/${row.id}/con`)}
        filters={
          <>
            <FilterSelect
              label="Trạng thái"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as CriteriaGroupStatusApi | '')}
              options={[
                { value: 'Draft', label: CRITERIA_STATUS_LABELS.DRAFT },
                { value: 'Applied', label: CRITERIA_STATUS_LABELS.ACTIVE },
                { value: 'Closed', label: CRITERIA_STATUS_LABELS.EXPIRED },
              ]}
            />
            <FilterSelect
              label="Sắp xếp"
              value={sort}
              onChange={setSort}
              allLabel="Mặc định"
              options={[
                { value: 'createdAt-desc', label: 'Mới nhất' },
                { value: 'name-asc', label: 'Tên A–Z' },
                { value: 'name-desc', label: 'Tên Z–A' },
                { value: 'deadline-asc', label: 'Hạn nộp gần nhất' },
                { value: 'maxPoint-desc', label: 'Điểm cao nhất' },
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
                value: statusFilter === 'Draft' ? CRITERIA_STATUS_LABELS.DRAFT : statusFilter === 'Applied' ? CRITERIA_STATUS_LABELS.ACTIVE : CRITERIA_STATUS_LABELS.EXPIRED,
                onClear: () => setStatusFilter(''),
              }]
            : []),
          ...(yearFilter
            ? [{ label: 'Năm', value: yearFilter, onClear: () => setYearFilter('') }]
            : []),
          ...(sort !== 'createdAt-desc'
            ? [{ label: 'Sắp xếp', value: sort === 'name-asc' ? 'Tên A–Z' : sort === 'name-desc' ? 'Tên Z–A' : sort === 'deadline-asc' ? 'Hạn nộp gần nhất' : 'Điểm cao nhất', onClear: () => setSort('createdAt-desc') }]
            : []),
        ]}
        onClearFilters={
          statusFilter || yearFilter || sort !== 'createdAt-desc'
            ? () => {
                setStatusFilter('');
                setYearFilter('');
                setSort('createdAt-desc');
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
                <Button
                  disabled={!selectedTable || selectedTable.status !== 'DRAFT'}
                  title={selectedTable && selectedTable.status !== 'DRAFT' ? 'Chỉ nhóm tiêu chí ở trạng thái Nháp mới có thể áp dụng.' : undefined}
                  onClick={() => { if (selectedTable && selectedTable.status === 'DRAFT') void openApplyDialog(selectedTable); }}
                >
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
        size="w-[calc(100vw-2rem)] sm:max-w-[900px] rounded-[20px]"
      >
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_200px]">
            <div className="space-y-1.5">
              <Label htmlFor="criteria-name" className="text-[13.5px] font-semibold">Nhóm tiêu chí <span className="text-destructive">*</span></Label>
              <Input id="criteria-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên nhóm tiêu chí" className="h-11 bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="criteria-total-score" className="text-[13.5px] font-semibold">Tổng điểm <span className="text-destructive">*</span></Label>
              <div className="relative h-11 rounded-lg border border-input bg-muted focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <Input
                  id="criteria-total-score"
                  type="text"
                  inputMode="decimal"
                  value={totalScore}
                  onChange={(e) => setTotalScore(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="VD: 100"
                  className="h-11 border-0 bg-transparent pr-14 text-right tabular-nums focus-visible:ring-0"
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l border-input bg-muted/60 px-3 text-xs font-medium text-muted-foreground">điểm</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="criteria-content" className="text-[13.5px] font-semibold">Nội dung <span className="text-destructive">*</span></Label>
            <Textarea id="criteria-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mô tả nội dung, phạm vi và yêu cầu của nhóm tiêu chí" rows={3} className="min-h-[96px] resize-y bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="close-date" className="text-[13.5px] font-semibold">Hạn nộp <span className="text-xs font-normal text-muted-foreground">Không bắt buộc</span></Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="close-date" type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className="h-11 pl-9 bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="size-3.5" />
              Có thể để trống nếu chưa quy định hạn nộp.
            </p>
          </div>
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
        submitDisabled={saving || fileUploading}
        size="max-w-xl sm:max-w-xl"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!applyTable) return;
          if (applyFiles.some((file) => file.size > 20 * 1024 * 1024)) {
            setApplyError('File thông báo không được vượt quá 20MB.');
            return;
          }
          setSaving(true);
          try {
            const latestGroup = await criteriaGroupsApi.get(applyTable.id);
            const validation = validateCriteriaApplication(
              latestGroup.maxPoint,
              latestGroup.criteria.map((item) => item.maxPoint),
            );
            if (!validation.success) {
              setApplyError(validation.message ?? 'Không thể áp dụng nhóm tiêu chí.');
              return;
            }
            await criteriaGroupsApi.apply(applyTable.id);
            if (applyFiles.length > 0) {
              const uploadedFiles = await uploadFiles(applyFiles, {
                entityType: 'CriteriaGroup',
                entityId: applyTable.id,
                category: 'notice',
              });
              if (uploadedFiles.length !== applyFiles.length) {
                toast.warning('Nhóm tiêu chí đã được áp dụng nhưng có file thông báo tải lên không thành công.');
              }
            }
            await queryClient.invalidateQueries({ queryKey: ['criteria-groups'] });
            setSelectedTable(null);
            setApplyTable(null);
            toast.success('Đã áp dụng nhóm tiêu chí cho các địa phương.');
          } catch (error) {
            toast.error(getCriteriaApiError(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="rounded-md border border-primary/20 bg-primary/[0.04] p-3">
          <p className="font-medium">Địa phương <span className="text-destructive">★</span></p>
          <p className="mt-1 text-sm text-muted-foreground">Áp dụng toàn bộ {localities.length} địa phương</p>
        </div>
        <div className="space-y-1.5">
          <Label>Đính kèm file thông báo</Label>
          <FileUpload
            value={applyFiles}
            onChange={(files) => { setApplyFiles(files); setApplyError(''); }}
            uploading={fileUploading}
            uploadProgress={fileProgress}
            maxSizeMb={20}
          />
        </div>
        {applyError && <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm font-medium text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{applyError}</p>}
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
