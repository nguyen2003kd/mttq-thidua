import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, DataTable, AuditTimeline, EmptyState } from '@/components/core';
import { ScoreStateBadge } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X, History } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable, Locality } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';

interface ApprovalRow {
  table: CriteriaTable;
  locality: Locality;
  record: ScoreRecord;
}

export default function CouncilApprovalPage() {
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const getScore = useScoreStore((s) => s.getScore);
  const approve = useScoreStore((s) => s.approve);
  const reject = useScoreStore((s) => s.reject);
  const getAuditsForLocality = useScoreStore((s) => s.getAuditsForLocality);

  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [reason, setReason] = useState('');
  const [diffRow, setDiffRow] = useState<ApprovalRow | null>(null);

  const isChair = user?.role === 'COUNCIL_CHAIR';

  const rows = useMemo(() => {
    const list: ApprovalRow[] = [];
    criteriaTables.forEach((table) => {
      const assignedIds = assignments[table.id] ?? [];
      assignedIds.forEach((localityId) => {
        const locality = localities.find((l) => l.id === localityId);
        if (!locality) return;
        const record = getScore(table.id, locality.id);
        if (record.state === 'CHO_DUYET_HOI_DONG') {
          list.push({ table, locality, record });
        }
      });
    });
    return list;
  }, [criteriaTables, localities, assignments, getScore]);

  const handleApprove = (row: ApprovalRow) => {
    if (!user || !isChair) return;
    approve(row.table.id, row.locality.id, user.name, user.role);
    toast.success('Đã duyệt', { description: `${row.locality.name} chuyển sang chờ Ban thường trực.` });
  };

  const handleReject = () => {
    if (!user || !rejectRow || !reason.trim()) return;
    reject(rejectRow.table.id, rejectRow.locality.id, reason, user.name, user.role);
    toast.success('Đã trả lại', { description: `${rejectRow.locality.name} đã được trả về Ban.` });
    setRejectRow(null);
    setReason('');
  };

  const columns = useMemo<ColumnDef<ApprovalRow>[]>(
    () => [
      {
        accessorFn: (row) => row.locality.name,
        header: 'Địa phương',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.locality.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.locality.district}</p>
          </div>
        ),
      },
      { accessorFn: (row) => row.table.name, header: 'Bảng tiêu chí' },
      { accessorFn: (row) => row.record.totalScore, header: 'Tổng điểm', meta: { align: 'center' } },
      {
        accessorFn: (row) => row.record.state,
        header: 'Trạng thái',
        cell: ({ row }) => <ScoreStateBadge state={row.original.record.state} />,
        meta: { align: 'center' },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDiffRow(row.original)}>
              <History className="h-3.5 w-3.5 mr-1.5" />
              Lịch sử
            </Button>
            <Button size="sm" variant="outline" className="text-success hover:bg-success/10" action="approve" state="CHO_DUYET_HOI_DONG" onClick={() => handleApprove(row.original)}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Duyệt
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" action="reject" state="CHO_DUYET_HOI_DONG" onClick={() => setRejectRow(row.original)}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Trả lại
            </Button>
          </div>
        ),
      },
    ],
    [isChair],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duyệt — Hội đồng TĐKT"
        description="Xem xét kết quả từ Ban và chuyển lên Ban thường trực. Chủ tịch Hội đồng có quyền duyệt."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Không có hồ sơ chờ duyệt"
          description="Hiện chưa có địa phương nào đến bước chờ Hội đồng TĐKT."
          icon={<Check className="h-8 w-8" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <DataTable data={rows} columns={columns} pageSize={10} />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!rejectRow} onOpenChange={(v) => { if (!v) { setRejectRow(null); setReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trả lại hồ sơ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {rejectRow ? `Trả lại bảng điểm của ${rejectRow.locality.name}. Vui lòng nhập lý do.` : ''}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="council-reject-reason">Lý do trả lại</Label>
              <Input
                id="council-reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do trả lại"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectRow(null); setReason(''); }}>Hủy</Button>
            <Button variant="destructive" action="reject" state="CHO_DUYET_HOI_DONG" onClick={handleReject} disabled={!reason.trim()}>Trả lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!diffRow} onOpenChange={(v) => { if (!v) setDiffRow(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lịch sử thay đổi — {diffRow?.locality.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-[60vh] overflow-auto">
            <AuditTimeline entries={diffRow ? getAuditsForLocality(diffRow.locality.id) : []} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffRow(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
