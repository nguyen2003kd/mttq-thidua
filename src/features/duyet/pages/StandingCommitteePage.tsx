import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import {
  PageHeader,
  DataTable,
  EmptyState,
  ScoreStateBadge,
  RejectDialog,
  AuditTimelineDialog,
} from '@/components/core';
import { Button } from '@/components/core';
import { toast } from 'sonner';
import { Trophy, X, History } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable, Locality } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';
import type { CriteriaTableAttachment } from '@/types/domain';
import { PublishResultModal } from '@/features/workflow/components';

interface ApprovalRow {
  table: CriteriaTable;
  locality: Locality;
  record: ScoreRecord;
}

export default function StandingCommitteePage() {
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const getScore = useScoreStore((s) => s.getScore);
  const publish = useScoreStore((s) => s.publish);
  const reject = useScoreStore((s) => s.reject);
  const getAuditsForLocality = useScoreStore((s) => s.getAuditsForLocality);

  const [publishRow, setPublishRow] = useState<ApprovalRow | null>(null);
  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [diffRow, setDiffRow] = useState<ApprovalRow | null>(null);

  const rows = useMemo(() => {
    const list: ApprovalRow[] = [];
    criteriaTables.forEach((table) => {
      const assignedIds = assignments[table.id] ?? [];
      assignedIds.forEach((localityId) => {
        const locality = localities.find((l) => l.id === localityId);
        if (!locality) return;
        const record = getScore(table.id, locality.id);
        if (record.state === 'CHO_DUYET_BTT') {
          list.push({ table, locality, record });
        }
      });
    });
    return list;
  }, [criteriaTables, localities, assignments, getScore]);

  const handlePublish = (attachments: CriteriaTableAttachment[]) => {
    if (!user || !publishRow) return;
    publish(publishRow.table.id, publishRow.locality.id, user.name, user.role, attachments);
    toast.success('Đã công bố kết quả', { description: `${publishRow.locality.name} đã được công bố.` });
    setPublishRow(null);
  };

  const handleReject = (reason: string) => {
    if (!user || !rejectRow) return;
    reject(rejectRow.table.id, rejectRow.locality.id, reason, user.name, user.role);
    toast.success('Đã trả lại', { description: `${rejectRow.locality.name} đã được trả về Hội đồng TĐKT.` });
    setRejectRow(null);
  };

  const columns = useMemo<ColumnDef<ApprovalRow>[]>(
    () => [
      {
        accessorFn: (row) => row.locality.name,
        header: 'Địa phương',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.locality.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.locality.region}</p>
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
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" action="publish" state="CHO_DUYET_BTT" onClick={() => setPublishRow(row.original)}>
              <Trophy className="h-3.5 w-3.5 mr-1.5" />
              Công bố
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" action="reject" state="CHO_DUYET_BTT" onClick={() => setRejectRow(row.original)}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Trả lại
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duyệt — Ban thường trực"
        description="Công bố kết quả cuối cùng sau khi đã thông qua Hội đồng TĐKT."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Không có hồ sơ chờ công bố"
          description="Hiện chưa có địa phương nào đến bước chờ Ban thường trực công bố."
          icon={<Trophy className="h-8 w-8" />}
        />
      ) : (
        <DataTable data={rows} columns={columns} pageSize={10} className="overflow-auto" searchable searchPlaceholder="Tìm kiếm địa phương..." />
      )}

      <PublishResultModal
        open={!!publishRow}
        onOpenChange={(v) => setPublishRow(v ? publishRow : null)}
        locality={publishRow?.locality}
        record={publishRow?.record}
        onPublish={handlePublish}
      />

      <RejectDialog
        open={!!rejectRow}
        onOpenChange={(v) => { if (!v) setRejectRow(null); }}
        localityName={rejectRow?.locality.name}
        state="CHO_DUYET_BTT"
        onConfirm={handleReject}
      />

      <AuditTimelineDialog
        open={!!diffRow}
        onOpenChange={(v) => { if (!v) setDiffRow(null); }}
        localityName={diffRow?.locality.name}
        entries={diffRow ? getAuditsForLocality(diffRow.locality.id) : []}
      />
    </div>
  );
}
