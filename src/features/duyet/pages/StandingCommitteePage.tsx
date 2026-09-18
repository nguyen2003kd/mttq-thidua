import { useEffect, useMemo, useState } from 'react';
import { Eye, History, Send, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable, EmptyState, PageHeader, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import type { CriteriaItem, CriteriaTable, Locality, ScoreEntry, ScoreRecord } from '@/types/domain';
import { PublishResultModal, type PublishResultValue } from '@/features/workflow/components/PublishResultModal';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
import { CriterionGrid, EvidenceModal } from '@/features/workflow/components';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ApprovalRow {
  table: CriteriaTable;
  locality: Locality;
  record: ScoreRecord;
}

type StatusFilter = 'ALL' | 'CHO_DUYET_BTT' | 'DA_CONG_BO';

const rowId = (row: ApprovalRow) => `${row.table.id}:${row.locality.id}`;

/** Lấy điểm chính thức gần nhất; Ủy ban chỉ xem kết quả, không sửa điểm. */
function getOfficialEntryScore(entry: ScoreEntry) {
  const stageScore = entry.stageScores?.LEADER
    ?? entry.stageScores?.SPECIALIST
    ?? entry.stageScores?.LOCAL;
  return {
    score: stageScore?.score ?? entry.value,
    bonusScore: stageScore?.bonusScore ?? 0,
  };
}

function getScoreTotals(record: ScoreRecord) {
  return record.entries.reduce(
    (totals, entry) => {
      const official = getOfficialEntryScore(entry);
      return {
        score: totals.score + official.score,
        bonus: totals.bonus + official.bonusScore,
        proposed: totals.proposed + (entry.proposedScore ?? 0),
        proposedBonus: totals.proposedBonus + (entry.proposedBonusScore ?? 0),
      };
    },
    { score: 0, bonus: 0, proposed: 0, proposedBonus: 0 },
  );
}

export default function StandingCommitteePage() {
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const evidence = useScoreStore((state) => state.evidence);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const publish = useScoreStore((state) => state.publish);
  const reject = useScoreStore((state) => state.reject);

  const [publishRow, setPublishRow] = useState<ApprovalRow | null>(null);
  const [requestRow, setRequestRow] = useState<ApprovalRow | null>(null);
  const [viewRow, setViewRow] = useState<ApprovalRow | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const rows = useMemo(() => {
    const list: ApprovalRow[] = [];
    criteriaTables.forEach((table) => {
      (assignments[table.id] ?? []).forEach((localityId) => {
        const locality = localities.find((item) => item.id === localityId);
        if (!locality) return;
        const record = scores[table.id]?.[locality.id] ?? emptyRecord;
        // Màn Ủy ban hiển thị hồ sơ đang chờ công bố và hồ sơ đã công bố để tra cứu.
        if (record.state === 'CHO_DUYET_BTT' || record.state === 'DA_CONG_BO') {
          list.push({ table, locality, record });
        }
      });
    });
    return list;
  }, [assignments, criteriaTables, emptyRecord, localities, scores]);

  const visibleRows = useMemo(() => rows
    .filter((row) => statusFilter === 'ALL' || row.record.state === statusFilter)
    .filter((row) => !fromDate || (row.record.submittedAt !== null && new Date(row.record.submittedAt) >= new Date(`${fromDate}T00:00:00`)))
    .filter((row) => !toDate || (row.record.submittedAt !== null && new Date(row.record.submittedAt) <= new Date(`${toDate}T23:59:59`))),
  [fromDate, rows, statusFilter, toDate]);

  const selectedRow = useMemo(
    () => visibleRows.find((row) => rowId(row) === selectedRowId) ?? null,
    [selectedRowId, visibleRows],
  );

  useEffect(() => {
    if (selectedRowId && !selectedRow) setSelectedRowId(undefined);
  }, [selectedRow, selectedRowId]);

  const handlePublish = (value: PublishResultValue) => {
    if (!user || !publishRow) return;
    publish(
      publishRow.table.id,
      publishRow.locality.id,
      user.name,
      user.role,
      value.attachments,
      value.comment,
    );
    toast.success('Đã công bố kết quả', {
      description: `${publishRow.locality.name} đã có thể xem kết quả chính thức.`,
    });
    setPublishRow(null);
  };

  const handleRequestSpecialist = ({ reason, file }: { reason: string; file: File | null }) => {
    if (!user || !requestRow) return;
    // Mock store lưu tên tệp trong lịch sử để người xử lý biết có tài liệu kèm theo.
    const auditReason = file ? `${reason}\n\nTập tin đính kèm: ${file.name}` : reason;
    reject(requestRow.table.id, requestRow.locality.id, auditReason, user.name, user.role);
    toast.success('Đã gửi yêu cầu đến Chuyên viên', {
      description: `${requestRow.locality.name} đã được chuyển về bước Chuyên viên xử lý.`,
    });
    setRequestRow(null);
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
        meta: { className: 'min-w-[200px]' },
      },
      {
        accessorFn: (row) => row.table.name,
        header: 'Bảng tiêu chí',
        meta: { className: 'min-w-[190px]' },
      },
      {
        id: 'totalScore',
        accessorFn: (row) => getScoreTotals(row.record).score,
        header: 'Tổng điểm',
        cell: ({ row }) => <span className="font-semibold tabular-nums">{getScoreTotals(row.original.record).score}</span>,
        meta: { align: 'right', className: 'min-w-[120px]' },
      },
      {
        id: 'proposedScore',
        accessorFn: (row) => getScoreTotals(row.record).proposed,
        header: 'Tổng điểm đề xuất',
        cell: ({ row }) => <span className="tabular-nums">{getScoreTotals(row.original.record).proposed}</span>,
        meta: { align: 'right', className: 'min-w-[155px]' },
      },
      {
        id: 'totalBonus',
        accessorFn: (row) => getScoreTotals(row.record).bonus,
        header: 'Tổng điểm thưởng',
        cell: ({ row }) => <span className="tabular-nums">{getScoreTotals(row.original.record).bonus}</span>,
        meta: { align: 'right', className: 'min-w-[150px]' },
      },
      {
        id: 'proposedBonus',
        accessorFn: (row) => getScoreTotals(row.record).proposedBonus,
        header: 'Tổng điểm thưởng đề xuất',
        cell: ({ row }) => <span className="tabular-nums">{getScoreTotals(row.original.record).proposedBonus}</span>,
        meta: { align: 'right', className: 'min-w-[190px]' },
      },
      {
        accessorFn: (row) => row.record.state,
        header: 'Trạng thái',
        cell: ({ row }) => <ScoreStateBadge state={row.original.record.state} />,
        meta: { align: 'center', className: 'min-w-[135px]' },
      },
    ],
    [],
  );

  const activeFilters = [
    statusFilter !== 'ALL'
      ? {
          label: 'Trạng thái',
          value: statusFilter === 'CHO_DUYET_BTT' ? 'Chờ công bố' : 'Đã công bố',
          onClear: () => setStatusFilter('ALL'),
        }
      : null,
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((filter): filter is { label: string; value: string; onClear: () => void } => filter !== null);

  const canProcessSelectedRow = selectedRow?.record.state === 'CHO_DUYET_BTT';
  const disabledReason = !selectedRow
    ? 'Chọn một hồ sơ để thực hiện thao tác.'
    : 'Hồ sơ đã công bố chỉ có thể xem và tra cứu lịch sử.';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Công bố kết quả — Ủy ban thường trực"
        description="Rà soát hồ sơ đã được Hội đồng thông qua và công bố kết quả cuối cùng cho địa phương."
        actions={<Button variant="outline" render={<Link to="/uy-ban/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử công bố</Button>}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Không có hồ sơ chờ công bố"
          description="Hiện chưa có địa phương nào đến bước chờ Ủy ban thường trực công bố."
          icon={<Trophy className="h-8 w-8" />}
        />
      ) : (
        <DataTable
          data={visibleRows}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Tìm kiếm địa phương hoặc bảng tiêu chí..."
          getRowId={rowId}
          selectedRowId={selectedRowId}
          onRowClick={(row) => setSelectedRowId(rowId(row))}
          filters={
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter((value ?? 'ALL') as StatusFilter)}>
                <SelectTrigger aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="CHO_DUYET_BTT">Chờ công bố</SelectItem>
                  <SelectItem value="DA_CONG_BO">Đã công bố</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" aria-label="Từ ngày nộp" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input type="date" aria-label="Đến ngày nộp" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          }
          activeFilters={activeFilters}
          onClearFilters={activeFilters.length > 0 ? () => { setStatusFilter('ALL'); setFromDate(''); setToDate(''); } : undefined}
          toolbar={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedRow && <span className="mr-1 max-w-[220px] truncate text-xs text-muted-foreground">Đã chọn: {selectedRow.locality.name}</span>}
              <Button variant="info" disabled={!selectedRow} disabledReason="Chọn một hồ sơ để xem chi tiết." onClick={() => selectedRow && setViewRow(selectedRow)}>
                <Eye className="mr-1.5 h-4 w-4" />Xem hồ sơ
              </Button>
              <Button
                variant="warning"
                disabled={!canProcessSelectedRow}
                disabledReason={disabledReason}
                action="reject"
                state="CHO_DUYET_BTT"
                onClick={() => selectedRow && setRequestRow(selectedRow)}
              >
                <Send className="mr-1.5 h-4 w-4" />Yêu cầu Chuyên viên bổ sung
              </Button>
              <Button
                className="bg-accent text-foreground hover:bg-accent/90"
                disabled={!canProcessSelectedRow}
                disabledReason={disabledReason}
                action="publish"
                state="CHO_DUYET_BTT"
                onClick={() => selectedRow && setPublishRow(selectedRow)}
              >
                <Trophy className="mr-1.5 h-4 w-4" />Công bố kết quả
              </Button>
            </div>
          }
          emptyState={{
            title: 'Không tìm thấy hồ sơ phù hợp',
            description: 'Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc.',
          }}
          tableWrapperClassName="overflow-x-auto"
          tableClassName="min-w-[1240px]"
        />
      )}

      <PublishResultModal
        open={!!publishRow}
        onOpenChange={(open) => { if (!open) setPublishRow(null); }}
        locality={publishRow?.locality}
        record={publishRow?.record}
        onPublish={handlePublish}
      />

      <RequestSpecialistDialog
        open={!!requestRow}
        onOpenChange={(open) => { if (!open) setRequestRow(null); }}
        localityName={requestRow?.locality.name}
        requesterLabel="Ủy ban thường trực"
        onConfirm={handleRequestSpecialist}
      />

      <Dialog open={!!viewRow} onOpenChange={(open) => { if (!open) setViewRow(null); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-6xl">
          <DialogHeader><DialogTitle>Chi tiết hồ sơ — {viewRow?.locality.name}</DialogTitle></DialogHeader>
          {viewRow && <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div><p className="font-semibold text-foreground">{viewRow.table.name}</p><p className="mt-1 text-xs text-muted-foreground">Hồ sơ chỉ xem tại bước Ủy ban thường trực.</p></div>
              <ScoreStateBadge state={viewRow.record.state} />
            </div>
            <CriterionGrid
              criteria={viewRow.table.criteria}
              record={viewRow.record}
              evidence={evidence}
              localityId={viewRow.locality.id}
              mode="result"
              onEvidence={(entry, criterion) => setViewingEvidence({ entry, criterion })}
            />
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setViewRow(null)}>Đóng</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <EvidenceModal
        open={!!viewingEvidence}
        onOpenChange={(open) => { if (!open) setViewingEvidence(null); }}
        entry={viewingEvidence?.entry}
        criterion={viewingEvidence?.criterion}
        evidence={viewRow && viewingEvidence ? evidence.filter((item) => item.localityId === viewRow.locality.id && item.criteriaId === viewingEvidence.entry.criteriaId) : []}
        readonly
      />
    </div>
  );
}
