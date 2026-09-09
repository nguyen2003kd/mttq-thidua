import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import {
  PageHeader,
  DataTable,
  FilterSelect,
  CriteriaStatusBadge,
  FormDialog,
  ConfirmDialog,
} from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { CRITERIA_STATUS_LABELS } from '@/constants/enums';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Pencil, Send } from 'lucide-react';
import { CriteriaChildrenDialog, type CriteriaChildInput } from '@/features/admin/components/CriteriaChildrenDialog';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable } from '@/types/domain';

const today = () => new Date().toISOString().slice(0, 10);
const toDateTimeInput = (value: string) => value ? (value.includes('T') ? value.slice(0, 16) : `${value}T23:59`) : '';

export default function CriteriaListPage() {
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const deleteCriteriaTable = useScoreStore((s) => s.deleteCriteriaTable);
  const createCriteriaTable = useScoreStore((s) => s.createCriteriaTable);
  const updateCriteriaTable = useScoreStore((s) => s.updateCriteriaTable);

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
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [content, setContent] = useState('');
  const [criteriaItems, setCriteriaItems] = useState<CriteriaChildInput[]>([]);
  const [criteriaChildrenOpen, setCriteriaChildrenOpen] = useState(false);
  const [criteriaChildTable, setCriteriaChildTable] = useState<CriteriaTable | null>(null);
  const [note, setNote] = useState('');
  const [editingTable, setEditingTable] = useState<CriteriaTable | null>(null);
  const [selectedTable, setSelectedTable] = useState<CriteriaTable | null>(null);
  const [viewTable, setViewTable] = useState<CriteriaTable | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          align: 'center',
          list: { label: 'Hạn nộp', width: '1fr' },
        },
      },
      {
        accessorKey: 'criteria.length',
        header: LABELS.CRITERIA_SUB_COUNT,
        meta: {
          align: 'center',
          list: { label: 'Tiêu chí con', width: '1fr' },
        },
      },
      {
        accessorKey: 'totalScore',
        header: LABELS.CRITERIA_TOTAL_SCORE,
        meta: {
          align: 'center',
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
        cell: ({ row }) => <CriteriaStatusBadge status={row.original.status} />,
        meta: {
          align: 'center',
          list: { label: LABELS.CRITERIA_STATUS, width: '1fr' },
        },
      },
      {
        accessorKey: 'openDate',
        header: 'Cập nhật lần cuối',
        cell: ({ row }) => (
          <div className="text-center">
            <p>{formatDate(row.original.updatedAt ?? row.original.openDate)}</p>
            <p className="text-xs text-muted-foreground">{row.original.updatedBy ?? 'Hệ thống'}</p>
          </div>
        ),
        meta: {
          align: 'center',
          list: { label: 'Cập nhật lần cuối', width: '1fr' },
        },
      },
    ],
    [],
  );

  const resetEditor = () => {
    setName('');
    setOpenDate(today());
    setCloseDate('');
    setTotalScore('');
    setContent('');
    setCriteriaItems([]);
    setCriteriaChildrenOpen(false);
    setCriteriaChildTable(null);
    setNote('');
    setEditingTable(null);
  };

  const openCreateDialog = () => {
    resetEditor();
    setOpen(true);
  };

  const openEditDialog = (table: CriteriaTable) => {
    setEditingTable(table);
    setName(table.name);
    setOpenDate(table.openDate);
    setCloseDate(toDateTimeInput(table.closeDate));
    setTotalScore(String(table.totalScore));
    setContent(table.content ?? '');
    setCriteriaItems(table.criteria.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      maxScore: criterion.maxScore,
      bonusScore: criterion.bonusScore,
      deadline: criterion.deadline,
      note: criterion.note,
    })));
    setNote(table.note ?? '');
    setCriteriaChildrenOpen(false);
    setViewTable(null);
    setOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const criteria = criteriaItems
      .filter((item) => item.name.trim() && item.maxScore > 0)
      .map((item) => ({ ...item, name: item.name.trim() }));

    const parsedTotalScore = Number(totalScore);
    if (!name.trim() || !content.trim() || !Number.isFinite(parsedTotalScore) || parsedTotalScore <= 0) {
      toast.error('Vui lòng nhập Nhóm tiêu chí, Tổng điểm lớn hơn 0 và Nội dung tiêu chí.');
      return;
    }

    const childrenTotalScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
    if (childrenTotalScore > parsedTotalScore) {
      toast.error(`Tổng điểm tiêu chí con (${childrenTotalScore}) không được vượt quá Tổng điểm (${parsedTotalScore}).`);
      return;
    }
    if (editingTable) {
      updateCriteriaTable({
        ...editingTable,
        name: name.trim(),
        totalScore: parsedTotalScore,
        content: content.trim(),
        openDate: editingTable.openDate,
        closeDate,
        note: note.trim() || undefined,
        criteria: criteria.map((criterion, index) => ({
          id: criterion.id ?? `criterion-${Date.now()}-${index}`,
          name: criterion.name,
          maxScore: criterion.maxScore,
          bonusScore: criterion.bonusScore,
          deadline: criterion.deadline,
          note: criterion.note,
          order: index + 1,
        })),
      });
      toast.success('Đã cập nhật bảng tiêu chí');
    } else {
      createCriteriaTable({ name: name.trim(), totalScore: parsedTotalScore, content: content.trim(), openDate: openDate || today(), closeDate, note: note.trim() || undefined, criteria });
      toast.success('Đã tạo bảng tiêu chí mới');
    }
    setOpen(false);
    resetEditor();
  };

  const openCriteriaChildrenDialog = (table: CriteriaTable) => {
    setCriteriaChildTable(table);
    setCriteriaItems(table.criteria.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      maxScore: criterion.maxScore,
      bonusScore: criterion.bonusScore,
      deadline: criterion.deadline,
      note: criterion.note,
    })));
    setCriteriaChildrenOpen(true);
  };

  const saveCriteriaChildren = (items: CriteriaChildInput[]) => {
    if (!criteriaChildTable) return;
    const updatedTable: CriteriaTable = {
      ...criteriaChildTable,
      criteria: items.map((item, index) => ({
        id: item.id ?? `criterion-${Date.now()}-${index}`,
        name: item.name,
        maxScore: item.maxScore,
        bonusScore: item.bonusScore,
        deadline: item.deadline,
        note: item.note,
        order: index + 1,
      })),
    };
    updateCriteriaTable(updatedTable);
    setSelectedTable((table) => table?.id === updatedTable.id ? updatedTable : table);
    setViewTable((table) => table?.id === updatedTable.id ? updatedTable : table);
    toast.success('Đã cập nhật tiêu chí con');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={LABELS.CRITERIA_TABLE}
        description="Quản lý các bảng tiêu chí chấm điểm thi đua khen thưởng."
      />

      <DataTable
        data={filteredTables}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        searchable
        searchKey="name"
        searchPlaceholder="Tìm theo tên bảng tiêu chí..."
        pageSize={10}
        onRowClick={(row) => setSelectedTable(row)}
        onRowDoubleClick={(row) => navigate(ROUTES.ADMIN_CRITERIA_DETAIL.replace(':id', row.id))}
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
            {selectedTable && (
              <>
                <Button variant="info" onClick={() => navigate(ROUTES.ADMIN_CRITERIA_DETAIL.replace(':id', selectedTable.id))}>
                  <Eye className="mr-1.5 h-4 w-4" /> Xem
                </Button>
                <Button variant="warning" onClick={() => openEditDialog(selectedTable)}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Sửa
                </Button>
                <Button variant="outline" onClick={() => openCriteriaChildrenDialog(selectedTable)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Tiêu chí con
                </Button>
                <Button variant="success" onClick={() => navigate(ROUTES.ADMIN_ASSIGN_LOCALITY.replace(':id', selectedTable.id))}>
                  <Send className="mr-1.5 h-4 w-4" /> Áp dụng
                </Button>
                <Button
                  variant="destructive"
                  action="delete"
                  disabled={selectedTable.status !== 'DRAFT'}
                  onClick={() => {
                    setViewTable(selectedTable);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Xóa
                </Button>
              </>
            )}
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
        <div className="space-y-1.5">
          <Label htmlFor="criteria-note">Ghi chú</Label>
          <Textarea id="criteria-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thông tin bổ sung (nếu có)" rows={2} />
        </div>
      </FormDialog>

      <CriteriaChildrenDialog
        open={criteriaChildrenOpen}
        onOpenChange={(isOpen) => {
          setCriteriaChildrenOpen(isOpen);
          if (!isOpen) setCriteriaChildTable(null);
        }}
        items={criteriaItems}
        totalScore={criteriaChildTable?.totalScore ?? 0}
        criteriaGroupName={criteriaChildTable?.name ?? ''}
        onSave={saveCriteriaChildren}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa bảng tiêu chí"
        description={`Xóa "${viewTable?.name ?? ''}"? Toàn bộ điểm và phân công của bảng này sẽ bị xóa. Hành động không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="destructive"
        action="delete"
        onConfirm={() => {
          if (!viewTable) return;
          deleteCriteriaTable(viewTable.id);
          toast.success('Đã xóa bảng tiêu chí');
          setViewTable(null);
          setSelectedTable(null);
        }}
      />

    </div>
  );
}
