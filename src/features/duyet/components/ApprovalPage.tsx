import { useMemo, useState, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Button } from '@/components/core';
import { toast } from 'sonner';
import { X, History, Eye, FilePlus2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaItem, CriteriaTable, Locality, ScoreEntry, ScoringStage } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';
import type { ScoreState } from '@/types/rbac';
import type { Action } from '@/lib/rbac';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CriterionGrid, EvidenceModal, ReviewScoreModal, SupplementaryCriterionModal } from '@/features/workflow/components';

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
  view?: 'leader' | 'council';
}

export function ApprovalPage(config: ApprovalPageConfig) {
  const navigate = useNavigate();
  const { banId } = useParams<{ banId?: string }>();
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
  const evidence = useScoreStore((s) => s.evidence);
  const reviewCriterion = useScoreStore((s) => s.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((s) => s.addSupplementaryCriterion);

  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [diffRow, setDiffRow] = useState<ApprovalRow | null>(null);
  const [confirmRow, setConfirmRow] = useState<ApprovalRow | null>(null);
  const [detailRow, setDetailRow] = useState<ApprovalRow | null>(null);
  const [selectedRow, setSelectedRow] = useState<ApprovalRow | null>(null);
  const [editing, setEditing] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [viewing, setViewing] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);

  const scoringStage: Exclude<ScoringStage, 'LOCAL' | 'SPECIALIST'> =
    config.targetState === 'CHO_DUYET_BAN'
      ? 'LEADER'
      : config.targetState === 'CHO_DUYET_HOI_DONG'
        ? 'COUNCIL'
        : 'COMMITTEE';

  const canApprove = !config.requireChair || user?.role === 'COUNCIL';

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

  const openDetail = (row: ApprovalRow) => {
    if (config.view === 'leader') {
      navigate(`/thi-dua/duyet/lanh-dao-ban/${banId ?? 'ban1'}/chi-tiet/${row.table.id}/${row.locality.id}`);
      return;
    }
    setDetailRow(row);
  };

  const getStageTotal = (record: ScoreRecord, stage: ScoringStage) =>
    record.entries.reduce((total, entry) => {
      const score = entry.stageScores?.[stage];
      return total + (score?.score ?? 0) + (score?.bonusScore ?? 0);
    }, 0);

  const getProposedTotal = (record: ScoreRecord) =>
    record.entries.reduce((total, entry) => total + (entry.proposedScore ?? 0), 0);

  const getProposedBonusTotal = (record: ScoreRecord) =>
    record.entries.reduce((total, entry) => total + (entry.proposedBonusScore ?? 0), 0);

  const getStageBonusTotal = (record: ScoreRecord, stage: ScoringStage) =>
    record.entries.reduce((total, entry) => total + (entry.stageScores?.[stage]?.bonusScore ?? 0), 0);

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
      ...(config.view === 'leader'
        ? [
            {
              id: 'proposedScore',
              header: 'Điểm địa phương đề xuất',
              accessorFn: (row: ApprovalRow) => getProposedTotal(row.record),
              cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="font-medium tabular-nums">{getProposedTotal(row.original.record)}</span>,
              meta: { align: 'right' },
            },
            {
              id: 'specialistScore',
              header: 'Điểm chuyên viên chấm',
              accessorFn: (row: ApprovalRow) => getStageTotal(row.record, 'SPECIALIST'),
              cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="font-medium tabular-nums">{getStageTotal(row.original.record, 'SPECIALIST')}</span>,
              meta: { align: 'right' },
            },
            {
              id: 'proposedBonus',
              header: 'Điểm thưởng đề xuất',
              accessorFn: (row: ApprovalRow) => getProposedBonusTotal(row.record),
              cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="tabular-nums">{getProposedBonusTotal(row.original.record)}</span>,
              meta: { align: 'right' },
            },
            {
              id: 'specialistBonus',
              header: 'Điểm thưởng chuyên viên',
              accessorFn: (row: ApprovalRow) => getStageBonusTotal(row.record, 'SPECIALIST'),
              cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="tabular-nums">{getStageBonusTotal(row.original.record, 'SPECIALIST')}</span>,
              meta: { align: 'right' },
            },
            {
              accessorFn: (row: ApprovalRow) => row.record.totalScore,
              header: 'Tổng điểm chuyên viên',
              cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="font-semibold tabular-nums">{row.original.record.totalScore}</span>,
              meta: { align: 'right' },
            },
          ]
        : [{ accessorFn: (row: ApprovalRow) => row.record.totalScore, header: 'Tổng điểm', meta: { align: 'right' } }]),
      {
        accessorFn: (row) => row.record.state,
        header: 'Trạng thái',
        cell: ({ row }) => <ScoreStateBadge state={row.original.record.state} />,
        meta: { align: 'center' },
      },
      ...(config.view === 'leader'
        ? [{ accessorFn: (row: ApprovalRow) => row.record.submittedAt ?? '', header: 'Cập nhật lần cuối', cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="text-xs text-muted-foreground">{row.original.record.submittedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.original.record.submittedAt)) : '—'}</span> }]
        : []),
      ...(config.view === 'leader'
        ? []
        : [{
            id: 'actions',
            header: 'Thao tác',
            enableSorting: false,
            meta: { align: 'right' },
            cell: ({ row }: { row: { original: ApprovalRow } }) => (
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailRow(row.original)}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Xem chi tiết
                </Button>
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
                    onClick={() => config.useConfirmDialog ? setConfirmRow(row.original) : handleApprove(row.original)}
                  >
                    <config.approveIcon className="h-3.5 w-3.5 mr-1.5" />
                    {config.approveLabel}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" action="reject" state={config.targetState} onClick={() => setRejectRow(row.original)}>
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Trả lại
                </Button>
              </div>
            ),
          }]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canApprove, config.view],
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
        <DataTable
          data={rows}
          columns={columns}
          pageSize={10}
          variant={config.view === 'leader' ? 'list' : 'table'}
          className="overflow-auto"
          searchable
          searchPlaceholder="Tìm kiếm địa phương hoặc nhóm tiêu chí..."
          getRowId={(row) => `${row.table.id}:${row.locality.id}`}
          selectedRowId={selectedRow ? `${selectedRow.table.id}:${selectedRow.locality.id}` : undefined}
          onRowClick={config.view === 'leader' ? setSelectedRow : undefined}
          toolbar={config.view === 'leader' ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="info" disabled={!selectedRow} onClick={() => selectedRow && openDetail(selectedRow)}>
                <Eye className="mr-1.5 h-4 w-4" />Xem chi tiết
              </Button>
              <Button variant="outline" disabled={!selectedRow} onClick={() => selectedRow && setDiffRow(selectedRow)}>
                <History className="mr-1.5 h-4 w-4" />Lịch sử
              </Button>
              <Button disabled={!selectedRow || !canApprove} action={config.approveAction} state={config.targetState} onClick={() => selectedRow && (config.useConfirmDialog ? setConfirmRow(selectedRow) : handleApprove(selectedRow))}>
                <config.approveIcon className="mr-1.5 h-4 w-4" />{config.approveLabel}
              </Button>
              <Button variant="outline" disabled={!selectedRow} className="border-destructive text-destructive hover:bg-destructive/10" action="reject" state={config.targetState} onClick={() => selectedRow && setRejectRow(selectedRow)}>
                <X className="mr-1.5 h-4 w-4" />Trả lại
              </Button>
            </div>
          ) : undefined}
        />
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

      <Dialog open={!!detailRow} onOpenChange={(open) => { if (!open) setDetailRow(null); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Thẩm định chi tiết — {detailRow?.locality.name}</DialogTitle>
          </DialogHeader>
          {detailRow && (() => {
            const liveRecord = scores[detailRow.table.id]?.[detailRow.locality.id] ?? detailRow.record;
            return (
              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                  <div><p className="font-semibold">{detailRow.table.name}</p><p className="text-xs text-muted-foreground">Điểm hiện tại: {liveRecord.totalScore}</p></div>
                  <Button variant="outline" onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="mr-1.5 h-4 w-4" />Thêm tiêu chí bổ sung</Button>
                </div>
                <CriterionGrid
                  criteria={detailRow.table.criteria}
                  record={liveRecord}
                  evidence={evidence}
                  localityId={detailRow.locality.id}
                  mode="review"
                  onEdit={(entry, criterion) => setEditing({ entry, criterion })}
                  onEvidence={(entry, criterion) => setViewing({ entry, criterion })}
                />
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setDetailRow(null)}>Đóng</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ReviewScoreModal
        open={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        entry={editing?.entry}
        criterion={editing?.criterion}
        onSave={(value) => {
          if (!detailRow || !editing || !user) return false;
          const ok = reviewCriterion({ tableId: detailRow.table.id, localityId: detailRow.locality.id, criteriaId: editing.entry.criteriaId, ...value, stage: scoringStage, actorName: user.name, actorRole: user.role });
          if (ok) toast.success('Đã lưu điểm thẩm định');
          return ok;
        }}
      />
      <EvidenceModal
        open={!!viewing}
        onOpenChange={(open) => { if (!open) setViewing(null); }}
        entry={viewing?.entry}
        criterion={viewing?.criterion}
        evidence={detailRow && viewing ? evidence.filter((item) => item.localityId === detailRow.locality.id && item.criteriaId === viewing.entry.criteriaId) : []}
        readonly
      />
      <SupplementaryCriterionModal
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ file, ...value }) => {
          if (!detailRow || !user) return false;
          const ok = addSupplementaryCriterion({ tableId: detailRow.table.id, localityId: detailRow.locality.id, ...value, fileName: file.name, fileSize: file.size, actorName: user.name, actorRole: user.role, stage: scoringStage });
          if (ok) toast.success('Đã thêm tiêu chí bổ sung');
          return ok;
        }}
      />
    </div>
  );
}
