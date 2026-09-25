import { useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { X, History, Eye, FilePlus2, MessageSquare } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaItem, CriteriaTable, Locality, ScoreEntry, ScoringStage } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';
import type { ScoreState } from '@/types/rbac';
import type { Action } from '@/lib/rbac';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  /** Council only: detail is read-only; no direct score adjustment or supplementary criterion. */
  readOnlyDetail?: boolean;
  /** Enables the mandatory comment action required by COL.01.09. */
  enableComment?: boolean;
  /** Optional full-page history route for approval roles. */
  historyPath?: string;
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
  const addComment = useScoreStore((s) => s.addComment);
  const evidence = useScoreStore((s) => s.evidence);
  const reviewCriterion = useScoreStore((s) => s.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((s) => s.addSupplementaryCriterion);

  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [commentRow, setCommentRow] = useState<ApprovalRow | null>(null);
  const [diffRow, setDiffRow] = useState<ApprovalRow | null>(null);
  const [confirmRow, setConfirmRow] = useState<ApprovalRow | null>(null);
  const [detailRow, setDetailRow] = useState<ApprovalRow | null>(null);
  const [selectedRow, setSelectedRow] = useState<ApprovalRow | null>(null);
  const [editing, setEditing] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [viewing, setViewing] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [leaderStatus, setLeaderStatus] = useState<'ALL' | 'CHO_DUYET_BAN' | 'CHO_DUYET_HOI_DONG'>('CHO_DUYET_BAN');
  const [leaderFromDate, setLeaderFromDate] = useState('');
  const [leaderToDate, setLeaderToDate] = useState('');
  const [councilLocalityId, setCouncilLocalityId] = useState('ALL');
  const [councilStatus, setCouncilStatus] = useState<'ALL' | 'CHO_DUYET_HOI_DONG'>('ALL');
  const [councilFromDate, setCouncilFromDate] = useState('');
  const [councilToDate, setCouncilToDate] = useState('');

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
        const isLeaderQueue = config.view === 'leader'
          ? record.state === 'CHO_DUYET_BAN' || record.state === 'CHO_DUYET_HOI_DONG'
          : record.state === config.targetState;
        if (isLeaderQueue) {
          list.push({ table, locality, record });
        }
      });
    });
    return list;
  }, [criteriaTables, localities, assignments, scores, emptyRecord, config.targetState, config.view]);

  const visibleRows = useMemo(() => rows
    .filter((row) => config.view !== 'leader' || leaderStatus === 'ALL' || row.record.state === leaderStatus)
    .filter((row) => !leaderFromDate || Boolean(row.record.submittedAt) && new Date(row.record.submittedAt as string) >= new Date(`${leaderFromDate}T00:00:00`))
    .filter((row) => !leaderToDate || Boolean(row.record.submittedAt) && new Date(row.record.submittedAt as string) <= new Date(`${leaderToDate}T23:59:59`))
    .filter((row) => config.view !== 'council' || councilLocalityId === 'ALL' || row.locality.id === councilLocalityId)
    .filter((row) => config.view !== 'council' || councilStatus === 'ALL' || row.record.state === councilStatus)
    .filter((row) => !councilFromDate || Boolean(row.record.submittedAt) && new Date(row.record.submittedAt as string) >= new Date(`${councilFromDate}T00:00:00`))
    .filter((row) => !councilToDate || Boolean(row.record.submittedAt) && new Date(row.record.submittedAt as string) <= new Date(`${councilToDate}T23:59:59`)),
  [rows, config.view, leaderStatus, leaderFromDate, leaderToDate, councilLocalityId, councilStatus, councilFromDate, councilToDate]);

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

  const handleComment = (comment: string) => {
    if (!user || !commentRow) return;
    const saved = addComment(commentRow.table.id, commentRow.locality.id, comment, user.name, user.role);
    if (!saved) {
      toast.error('Không thể lưu nhận xét', { description: 'Hồ sơ này không còn cho phép nhận xét.' });
      return;
    }
    toast.success('Đã gửi nhận xét', { description: `Nhận xét đã được lưu cho ${commentRow.locality.name}.` });
    setCommentRow(null);
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

  const getProposedOverallTotal = (record: ScoreRecord) =>
    getProposedTotal(record) + getProposedBonusTotal(record);

  const getCouncilReviewTotal = (record: ScoreRecord) =>
    record.entries.some((entry) => Boolean(entry.stageScores?.LEADER))
      ? getStageTotal(record, 'LEADER')
      : record.totalScore;

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
        : config.view === 'council'
          ? [
              {
                id: 'councilTotalScore',
                header: 'Tổng điểm',
                accessorFn: (row: ApprovalRow) => getCouncilReviewTotal(row.record),
                cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="font-semibold tabular-nums">{getCouncilReviewTotal(row.original.record)}</span>,
                meta: { align: 'right' },
              },
              {
                id: 'councilProposedTotal',
                header: 'Tổng điểm đề xuất',
                accessorFn: (row: ApprovalRow) => getProposedOverallTotal(row.record),
                cell: ({ row }: { row: { original: ApprovalRow } }) => <span className="tabular-nums">{getProposedOverallTotal(row.original.record)}</span>,
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
      ...(config.view === 'leader' || config.view === 'council'
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
  const historyPath = config.historyPath
    ?? (config.view === 'leader' ? `/thi-dua/duyet/lanh-dao-ban/${banId ?? 'ban1'}/lich-su` : undefined);
  const isLeaderView = config.view === 'leader';
  const isCouncilView = config.view === 'council';
  const usesSelectionToolbar = isLeaderView || isCouncilView;

  const approvalFilters = isLeaderView ? (
    <div className="grid gap-2 sm:grid-cols-3">
      <Select value={leaderStatus} onValueChange={(value) => setLeaderStatus((value ?? 'ALL') as typeof leaderStatus)}>
        <SelectTrigger aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="CHO_DUYET_BAN">Chờ Lãnh đạo duyệt</SelectItem><SelectItem value="CHO_DUYET_HOI_DONG">Đã trình Hội đồng</SelectItem></SelectContent>
      </Select>
      <Input type="date" aria-label="Từ ngày nộp" value={leaderFromDate} onChange={(event) => setLeaderFromDate(event.target.value)} />
      <Input type="date" aria-label="Đến ngày nộp" value={leaderToDate} onChange={(event) => setLeaderToDate(event.target.value)} />
    </div>
  ) : isCouncilView ? (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Select value={councilLocalityId} onValueChange={(value) => setCouncilLocalityId(value ?? 'ALL')}>
        <SelectTrigger aria-label="Lọc theo địa phương"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả địa phương</SelectItem>
          {localities.map((locality) => <SelectItem key={locality.id} value={locality.id}>{locality.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={councilStatus} onValueChange={(value) => setCouncilStatus((value ?? 'ALL') as typeof councilStatus)}>
        <SelectTrigger aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="CHO_DUYET_HOI_DONG">Chờ Hội đồng duyệt</SelectItem></SelectContent>
      </Select>
      <Input type="date" aria-label="Từ ngày nộp" value={councilFromDate} onChange={(event) => setCouncilFromDate(event.target.value)} />
      <Input type="date" aria-label="Đến ngày nộp" value={councilToDate} onChange={(event) => setCouncilToDate(event.target.value)} />
    </div>
  ) : undefined;

  const approvalActiveFilters = isLeaderView ? [
    leaderStatus !== 'ALL' ? { label: 'Trạng thái', value: leaderStatus === 'CHO_DUYET_BAN' ? 'Chờ Lãnh đạo duyệt' : 'Đã trình Hội đồng', onClear: () => setLeaderStatus('ALL') } : null,
    leaderFromDate ? { label: 'Từ ngày', value: leaderFromDate, onClear: () => setLeaderFromDate('') } : null,
    leaderToDate ? { label: 'Đến ngày', value: leaderToDate, onClear: () => setLeaderToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item)) : isCouncilView ? [
    councilLocalityId !== 'ALL' ? { label: 'Địa phương', value: localities.find((locality) => locality.id === councilLocalityId)?.name ?? councilLocalityId, onClear: () => setCouncilLocalityId('ALL') } : null,
    councilStatus !== 'ALL' ? { label: 'Trạng thái', value: 'Chờ Hội đồng duyệt', onClear: () => setCouncilStatus('ALL') } : null,
    councilFromDate ? { label: 'Từ ngày', value: councilFromDate, onClear: () => setCouncilFromDate('') } : null,
    councilToDate ? { label: 'Đến ngày', value: councilToDate, onClear: () => setCouncilToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item)) : undefined;

  const clearApprovalFilters = isLeaderView
    ? () => { setLeaderStatus('ALL'); setLeaderFromDate(''); setLeaderToDate(''); }
    : isCouncilView
      ? () => { setCouncilLocalityId('ALL'); setCouncilStatus('ALL'); setCouncilFromDate(''); setCouncilToDate(''); }
      : undefined;

  const canProcessSelectedRow = Boolean(selectedRow && selectedRow.record.state === config.targetState);
  const selectionToolbar = isLeaderView ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="info" disabled={!selectedRow} disabledReason="Chọn một hồ sơ để xem chi tiết." onClick={() => selectedRow && openDetail(selectedRow)}>
        <Eye className="mr-1.5 h-4 w-4" />Xem chi tiết
      </Button>
      <Button variant="outline" disabled={!selectedRow} disabledReason="Chọn một hồ sơ để xem lịch sử." onClick={() => selectedRow && setDiffRow(selectedRow)}>
        <History className="mr-1.5 h-4 w-4" />Lịch sử
      </Button>
      <Button disabled={!canProcessSelectedRow || !canApprove} disabledReason={!selectedRow ? 'Chọn một hồ sơ để duyệt.' : !canApprove ? 'Tài khoản hiện tại không có quyền duyệt hồ sơ.' : 'Hồ sơ đã được chuyển sang Hội đồng, chỉ có thể xem lịch sử.'} action={config.approveAction} state={config.targetState} onClick={() => selectedRow && (config.useConfirmDialog ? setConfirmRow(selectedRow) : handleApprove(selectedRow))}>
        <config.approveIcon className="mr-1.5 h-4 w-4" />{config.approveLabel}
      </Button>
      <Button variant="outline" disabled={!canProcessSelectedRow} disabledReason={!selectedRow ? 'Chọn một hồ sơ để yêu cầu bổ sung.' : 'Hồ sơ này không còn ở bước chờ Lãnh đạo.'} className="border-destructive text-destructive hover:bg-destructive/10" action="reject" state={config.targetState} onClick={() => selectedRow && setRejectRow(selectedRow)}>
        <X className="mr-1.5 h-4 w-4" />Trả lại
      </Button>
    </div>
  ) : isCouncilView ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="info" disabled={!selectedRow} disabledReason="Chọn một hồ sơ để xem chi tiết." onClick={() => selectedRow && openDetail(selectedRow)}>
        <Eye className="mr-1.5 h-4 w-4" />Xem chi tiết
      </Button>
      <Button variant="outline" disabled={!selectedRow} disabledReason="Chọn một hồ sơ để xem lịch sử." onClick={() => selectedRow && setDiffRow(selectedRow)}>
        <History className="mr-1.5 h-4 w-4" />Lịch sử
      </Button>
      {config.enableComment && (
        <Button variant="outline" disabled={!canProcessSelectedRow} disabledReason={!selectedRow ? 'Chọn một hồ sơ để gửi nhận xét.' : 'Hồ sơ này không còn ở bước chờ Hội đồng.'} action="approve" state={config.targetState} onClick={() => selectedRow && setCommentRow(selectedRow)}>
          <MessageSquare className="mr-1.5 h-4 w-4" />Nhận xét
        </Button>
      )}
      <Button variant="outline" disabled={!canProcessSelectedRow} disabledReason={!selectedRow ? 'Chọn một hồ sơ để yêu cầu chỉnh sửa.' : 'Hồ sơ này không còn ở bước chờ Hội đồng.'} className="border-warning/70 text-destructive hover:bg-warning/10" action="reject" state={config.targetState} onClick={() => selectedRow && setRejectRow(selectedRow)}>
        <X className="mr-1.5 h-4 w-4" />Yêu cầu chỉnh sửa
      </Button>
      <Button disabled={!canProcessSelectedRow || !canApprove} disabledReason={!selectedRow ? 'Chọn một hồ sơ để duyệt.' : !canApprove ? 'Tài khoản hiện tại không có quyền duyệt hồ sơ.' : 'Hồ sơ này không còn ở bước chờ Hội đồng.'} action={config.approveAction} state={config.targetState} onClick={() => selectedRow && (config.useConfirmDialog ? setConfirmRow(selectedRow) : handleApprove(selectedRow))}>
        <config.approveIcon className="mr-1.5 h-4 w-4" />{config.approveLabel}
      </Button>
    </div>
  ) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={historyPath ? <Button variant="outline" render={<Link to={historyPath} />} nativeButton={false}><History className="mr-1.5 h-4 w-4" />Lịch sử duyệt</Button> : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={config.emptyTitle}
          description={config.emptyDescription}
          icon={<EmptyIcon className="h-8 w-8" />}
        />
      ) : (
        <DataTable
          data={visibleRows}
          columns={columns}
          pageSize={10}
          variant={isLeaderView ? 'list' : 'table'}
          className="overflow-auto"
          searchable
          searchPlaceholder="Tìm kiếm địa phương hoặc nhóm tiêu chí..."
          getRowId={(row) => `${row.table.id}:${row.locality.id}`}
          selectedRowId={selectedRow ? `${selectedRow.table.id}:${selectedRow.locality.id}` : undefined}
          onRowClick={usesSelectionToolbar ? setSelectedRow : undefined}
          filters={approvalFilters}
          activeFilters={approvalActiveFilters}
          onClearFilters={clearApprovalFilters}
          toolbar={selectionToolbar}
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
        title={isCouncilView ? 'Yêu cầu Chuyên viên chỉnh sửa' : undefined}
        confirmLabel={isCouncilView ? 'Gửi yêu cầu' : undefined}
        description={isCouncilView ? `Yêu cầu này sẽ được gửi về Chuyên viên để đối chiếu và xử lý${rejectRow ? ` hồ sơ của ${rejectRow.locality.name}` : ''}.` : undefined}
        reasonLabel={isCouncilView ? 'Lý do yêu cầu chỉnh sửa' : undefined}
        reasonPlaceholder={isCouncilView ? 'Ví dụ: Cần đối chiếu lại minh chứng và tổng điểm thưởng.' : undefined}
        confirmVariant={isCouncilView ? 'default' : undefined}
      />

      {config.enableComment && (
        <RejectDialog
          open={!!commentRow}
          onOpenChange={(v) => { if (!v) setCommentRow(null); }}
          localityName={commentRow?.locality.name}
          state={config.targetState}
          onConfirm={handleComment}
          title="Nhận xét địa phương"
          confirmLabel="Gửi nhận xét"
          description={commentRow ? `Nhận xét sẽ được lưu cùng hồ sơ của ${commentRow.locality.name}. Thao tác này không thay đổi trạng thái duyệt.` : 'Nhận xét sẽ được lưu cùng hồ sơ.'}
          reasonLabel="Lý do (nội dung nhận xét)"
          reasonPlaceholder="Ví dụ: Địa phương thực hiện tốt công tác tuyên truyền, cần tiếp tục phát huy."
          submitAction="approve"
          confirmVariant="default"
        />
      )}

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
            <DialogTitle>{config.readOnlyDetail ? 'Xem chi tiết hồ sơ' : 'Thẩm định chi tiết'} — {detailRow?.locality.name}</DialogTitle>
          </DialogHeader>
          {detailRow && (() => {
            const liveRecord = scores[detailRow.table.id]?.[detailRow.locality.id] ?? detailRow.record;
            return (
              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                  <div><p className="font-semibold">{detailRow.table.name}</p><p className="text-xs text-muted-foreground">Điểm hiện tại: {liveRecord.totalScore}</p></div>
                  {!config.readOnlyDetail && (
                    <Button variant="outline" onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="mr-1.5 h-4 w-4" />Thêm tiêu chí bổ sung</Button>
                  )}
                </div>
                <CriterionGrid
                  criteria={detailRow.table.criteria}
                  record={liveRecord}
                  evidence={evidence}
                  localityId={detailRow.locality.id}
                  mode="review"
                  onEdit={config.readOnlyDetail ? undefined : (entry, criterion) => setEditing({ entry, criterion })}
                  onEvidence={(entry, criterion) => setViewing({ entry, criterion })}
                />
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setDetailRow(null)}>Đóng</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {!config.readOnlyDetail && <ReviewScoreModal
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
      />}
      <EvidenceModal
        open={!!viewing}
        onOpenChange={(open) => { if (!open) setViewing(null); }}
        entry={viewing?.entry}
        criterion={viewing?.criterion}
        evidence={detailRow && viewing ? evidence.filter((item) => item.localityId === detailRow.locality.id && item.criteriaId === viewing.entry.criteriaId) : []}
        readonly
      />
      {!config.readOnlyDetail && <SupplementaryCriterionModal
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ file, ...value }) => {
          if (!detailRow || !user) return false;
          const ok = addSupplementaryCriterion({ tableId: detailRow.table.id, localityId: detailRow.locality.id, ...value, fileName: file.name, fileSize: file.size, actorName: user.name, actorRole: user.role, stage: scoringStage });
          if (ok) toast.success('Đã thêm tiêu chí bổ sung');
          return ok;
        }}
      />}
    </div>
  );
}
