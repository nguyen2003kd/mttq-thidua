import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, DataTable } from '@/components/core';
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
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Calendar } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable } from '@/types/domain';

const statusVariant: Record<CriteriaTable['status'], 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  EXPIRED: 'destructive',
};

export default function CriteriaListPage() {
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const deleteCriteriaTable = useScoreStore((s) => s.deleteCriteriaTable);
  const createCriteriaTable = useScoreStore((s) => s.createCriteriaTable);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [criteriaText, setCriteriaText] = useState('');

  const columns = useMemo<ColumnDef<CriteriaTable>[]>(
    () => [
      {
        accessorKey: 'name',
        header: LABELS.CRITERIA_TABLE_NAME,
      },
      {
        accessorKey: 'totalScore',
        header: LABELS.CRITERIA_TOTAL_SCORE,
        meta: { align: 'center' },
      },
      {
        accessorKey: 'criteria.length',
        header: LABELS.CRITERIA_SUB_COUNT,
        meta: { align: 'center' },
      },
      {
        accessorKey: 'assignedLocalityCount',
        header: LABELS.CRITERIA_ASSIGNED_COUNT,
        meta: { align: 'center' },
      },
      {
        accessorKey: 'status',
        header: LABELS.CRITERIA_STATUS,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
        ),
        meta: { align: 'center' },
      },
      {
        accessorKey: 'openDate',
        header: () => (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Mở
          </span>
        ),
        cell: ({ row }) => formatDate(row.original.openDate),
      },
      {
        accessorKey: 'closeDate',
        header: () => (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Đóng
          </span>
        ),
        cell: ({ row }) => formatDate(row.original.closeDate),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              action="edit"
              onClick={() => navigate(ROUTES.ADMIN_CRITERIA_FORM.replace(':id', row.original.id))}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {row.original.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="icon-sm"
                action="delete"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (window.confirm('Xóa bảng tiêu chí này?')) {
                    deleteCriteriaTable(row.original.id);
                    toast.success('Đã xóa bảng tiêu chí');
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [deleteCriteriaTable, navigate],
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
        data={criteriaTables}
        columns={columns}
        searchable
        searchKey="name"
        searchPlaceholder="Tìm theo tên bảng tiêu chí..."
        pageSize={10}
        emptyState={{
          title: 'Chưa có bảng tiêu chí',
          description: 'Tạo bảng tiêu chí đầu tiên để bắt đầu.',
        }}
        toolbar={
          <Button onClick={() => setOpen(true)} action="create">
            <Plus className="h-4 w-4 mr-2" />
            {LABELS.CREATE}
          </Button>
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
    </div>
  );
}
