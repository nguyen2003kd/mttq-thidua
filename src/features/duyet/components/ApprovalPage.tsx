import { useMemo, useState, type ComponentType } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import {
  PageHeader,
  DataTable,
  EmptyState,
  ConfirmDialog,
  ScoreStateBadge,
  RejectDialog,
  AuditTimelineDialog,
} from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/core';
import { toast } from 'sonner';
import { X, History } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaTable, Locality } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';
import type { ScoreState } from '@/types/rbac';
import type { Action } from '@/lib/rbac';

interface ApprovalRow {
  table: CriteriaTable;
  locality: Locality;
  record: ScoreRecord;
}

interface ApprovalPageConfig {
  targetState: ScoreState;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: ComponentType<{ className?: string }>;
  approveLabel: string;
  approveAction: Action;
  approveIcon: ComponentType<{ className?: string }>;
  approveClassName?: string;
  approveSuccessMessage: (localityName: string) => string;
  rejectSuccessMessage: (localityName: string) => string;
  requireChair?: boolean;
  useConfirmDialog?: boolean;
  confirmKeyword?: string;
  confirmDescription?: string;
}

export function ApprovalPage(config: ApprovalPageConfig) {
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const scores = useScoreStore((s) => s.scores);
  const emptyRecord = useScoreStore((s) => s.emptyRecord);
  const audits = useScoreStore((s) => s.audits);
  const approve = useScoreStore((s) => s.approve);
  const publish = useScoreStore((s) => s.publish);
  const reject = useScoreStore((s) => s.reject);

  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [diffRow, setDiffRow] = useState<ApprovalRow | null>(null);
  const [confirmRow, setConfirmRow] = useState<ApprovalRow | null>(null);

  const canApprove = !config.requireChair || user?.role === 'COUNCIL_CHAIR';

  const rows = useMemo(() => {
    const list: ApprovalRow[] = [];
    criteriaTables.forEach((table) => {
      const assignedIds = assignments[table.id] ?? [];
      assignedIds.forEach((localityId) => {
        const locality = localities.find((l) => l.id === localityId);
        if (!locality) return;
        const record = scores[table.id]?.[localityId] ?? emptyRecord;
        if (record.state === config.targetState) {
          list.push({ table, locality, record });
        }
      });
    });
    return list;
  }, [criteriaTables, localities, assignments, scores, emptyRecord, config.targetState]);

  const handleApprove = (row: ApprovalRow) => {
    if (!user) return;
    if (config.approveAction === 'publish') {
      publish(row.table.id, row.locality.id, user.name, user.role);
    } else {
      approve(row.table.id, row.locality.id, user.name, user.role);
    }
    toast.success('Đã duyệt', { description: config.approveSuccessMessage(row.locality.name) });
  };

  const handleReject = (reason: string) => {
    if (!user || !rejectRow) return;
    reject(rejectRow.table.id, rejectRow.locality.id, reason, user.name, user.role);
    toast.success('Đã trả lại', { description: config.rejectSuccessMessage(rejectRow.locality.name) });
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
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                className={config.approveClassName ?? 'text-success hover:bg-success/10'}
                action={config.approveAction}
                state={config.targetState}
                onClick={() =>
                  config.useConfirmDialog
                    ? setConfirmRow(row.original)
                    : handleApprove(row.original)
                }
              >
                <config.approveIcon className="h-3.5 w-3.5 mr-1.5" />
                {config.approveLabel}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              action="reject"
              state={config.targetState}
              onClick={() => setRejectRow(row.original)}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Trả lại
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canApprove],
  );

  const EmptyIcon = config.emptyIcon;

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description} />

      {rows.length === 0 ? (
        <EmptyState
          title={config.emptyTitle}
          description={config.emptyDescription}
          icon={<EmptyIcon className="h-8 w-8" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <DataTable data={rows} columns={columns} pageSize={10} />
          </CardContent>
        </Card>
      )}

      {config.useConfirmDialog && (
        <ConfirmDialog
          open={!!confirmRow}
          onOpenChange={(v) => setConfirmRow(v ? confirmRow : null)}
          title={config.approveLabel}
          description={config.confirmDescription ?? ''}
          confirmLabel={config.approveLabel}
          variant="destructive"
          action={config.approveAction}
          state={config.targetState}
          confirmKeyword={config.confirmKeyword}
          confirmKeywordHint={config.confirmKeyword ? `Nhập "${config.confirmKeyword}" để xác nhận` : undefined}
          onConfirm={() => {
            if (confirmRow) handleApprove(confirmRow);
            setConfirmRow(null);
          }}
        />
      )}

      <RejectDialog
        open={!!rejectRow}
        onOpenChange={(v) => { if (!v) setRejectRow(null); }}
        localityName={rejectRow?.locality.name}
        state={config.targetState}
        onConfirm={handleReject}
      />

      <AuditTimelineDialog
        open={!!diffRow}
        onOpenChange={(v) => { if (!v) setDiffRow(null); }}
        localityName={diffRow?.locality.name}
        entries={
          diffRow
            ? audits.filter((a) => a.fieldName.endsWith(` - ${diffRow.locality.id}`))
            : []
        }
      />
    </div>
  );
}
