import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, DataTable, FilterSelect } from '@/components/core';
import { Button } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { CRITERIA_STATUS_LABELS } from '@/constants/enums';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable } from '@/types/domain';

const statusVariant: Record<CriteriaTable['status'], 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'secondary',
};

export default function CriteriaListPage() {
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const deleteCriteriaTable = useScoreStore((s) => s.deleteCriteriaTable);
  const createCriteriaTable = useScoreStore((s) => s.createCriteriaTable);

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
  const [criteriaText, setCriteriaText] = useState('');
  const [selectedTable, setSelectedTable] = useState<CriteriaTable | null>(null);
  const [viewTable, setViewTable] = useState<CriteriaTable | null>(null);

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
        accessorKey: 'totalScore',
        header: LABELS.CRITERIA_TOTAL_SCORE,
        meta: {
          align: 'center',
          list: { label: LABELS.CRITERIA_TOTAL_SCORE, width: '1fr', valueClassName: 'text-primary' },
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
        accessorKey: 'status',
        header: LABELS.CRITERIA_STATUS,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>{CRITERIA_STATUS_LABELS[row.original.status]}</Badge>
        ),
        meta: {
          align: 'center',
          list: { label: LABELS.CRITERIA_STATUS, width: '1fr' },
        },
      },
      {
        accessorKey: 'openDate',
        header: LABELS.CRITERIA_OPEN_DATE,
        cell: ({ row }) => formatDate(row.original.openDate),
        meta: {
          align: 'center',
          list: { label: 'Ngày bắt đầu', width: '1fr' },
        },
      },
      {
        accessorKey: 'closeDate',
        header: LABELS.CRITERIA_CLOSE_DATE,
        cell: ({ row }) => formatDate(row.original.closeDate),
        meta: {
          align: 'center',
          list: { label: 'Ngày kết thúc', width: '1fr' },
        },
      },
    ],
    [],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const criteria = criteriaText
      .split('\n')
      .map((line) => {
        const [n, max] = line.split(':');
        if (!n?.trim()) return null;
        return { name: n.trim(), maxScore: Number(max?.trim()) || 0 };
      })
      .filter((c): c is { name: string; maxScore: number } => c !== null && c.maxScore > 0);

    if (!name.trim() || !openDate || !closeDate || criteria.length === 0) {
      toast.error('Vui lòng nhập đầy đủ thông tin và ít nhất một tiêu chí con (dạng Tên:Điểm tối đa)');
      return;
    }

    const totalScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
    createCriteriaTable({ name, totalScore, openDate, closeDate, criteria });
    toast.success('Đã tạo bảng tiêu chí mới');
    setOpen(false);
    setName('');
    setOpenDate('');
    setCloseDate('');
    setCriteriaText('');
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
        onRowDoubleClick={(row) => setViewTable(row)}
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
          <div className="flex items-center gap-2">
            {selectedTable && (
              <Button className="bg-warning text-white hover:bg-warning/90" onClick={() => setViewTable(selectedTable)}>
                <Eye className="h-4 w-4 ml-2" /> Xem
              </Button>
            )}
            <Button onClick={() => setOpen(true)} action="create">
              <Plus className="h-4 w-4 ml-2" /> {LABELS.CREATE}
            </Button>
          </div>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo bảng tiêu chí mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="criteria-name">Tên bảng tiêu chí</Label>
              <Input id="criteria-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bảng tiêu chí 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="open-date">Ngày mở</Label>
                <Input id="open-date" type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="close-date">Ngày đóng</Label>
                <Input id="close-date" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="criteria-list">Danh sách tiêu chí con (mỗi dòng: Tên:Điểm tối đa)</Label>
              <Textarea
                id="criteria-list"
                value={criteriaText}
                onChange={(e) => setCriteriaText(e.target.value)}
                placeholder="Tổ chức thực hiện nhiệm vụ:40\nKết quả hoạt động:30\nChất lượng cán bộ:30"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {LABELS.CANCEL}
              </Button>
              <Button type="submit">{LABELS.CREATE}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View modal */}
      <Dialog open={!!viewTable} onOpenChange={(v) => !v && setViewTable(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bảng tiêu chí</DialogTitle>
          </DialogHeader>
          {viewTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tên bảng tiêu chí</p>
                  <p className="font-medium">{viewTable.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                  <Badge variant={statusVariant[viewTable.status]}>{CRITERIA_STATUS_LABELS[viewTable.status]}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ngày bắt đầu</p>
                  <p className="font-medium">{formatDate(viewTable.openDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ngày kết thúc</p>
                  <p className="font-medium">{formatDate(viewTable.closeDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tổng điểm</p>
                  <p className="font-medium text-primary">{viewTable.totalScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Số tiêu chí con</p>
                  <p className="font-medium">{viewTable.criteria.length}</p>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Danh sách tiêu chí con</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {viewTable.criteria.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
                        <span className="text-sm">{idx + 1}. {c.name}</span>
                        <span className="text-sm font-medium text-primary">{c.maxScore} điểm</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {viewTable.status === 'DRAFT' && (
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm('Xóa bảng tiêu chí này?')) {
                        deleteCriteriaTable(viewTable.id);
                        toast.success('Đã xóa bảng tiêu chí');
                        setViewTable(null);
                        setSelectedTable(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 ml-2" /> Xóa
                  </Button>
                  <Button onClick={() => navigate(ROUTES.ADMIN_CRITERIA_FORM.replace(':id', viewTable.id))}>
                    Chỉnh sửa
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
