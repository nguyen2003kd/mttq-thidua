import { useMemo, useState } from 'react';
import { Eye, History, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, PageHeader, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScoreStore, type ScoreRecord } from '@/store/scoreStore';
import type { Locality } from '@/types/domain';

interface LocalityReviewRow {
  locality: Locality;
  records: Array<{ tableId: string; record: ScoreRecord }>;
  proposedScore: number;
  proposedBonus: number;
  specialistScore: number;
  specialistBonus: number;
  latestUpdatedAt: string | null;
  latestUpdatedBy: string | null;
  hasRevisionRequest: boolean;
  hasNewSpecialistUpdate: boolean;
}

function sum(record: ScoreRecord, selector: (entry: ScoreRecord['entries'][number]) => number) {
  return record.entries.reduce((total, entry) => total + selector(entry), 0);
}

function formatUpdated(row: LocalityReviewRow) {
  if (!row.latestUpdatedAt) return '—';
  const timestamp = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.latestUpdatedAt));
  return row.latestUpdatedBy ? `${row.latestUpdatedBy} · ${timestamp}` : timestamp;
}

/** COL.01.07 — lớp 1: danh sách địa phương chờ Lãnh đạo ban xử lý. */
export default function BanLeaderApprovalPage() {
  const { banId = 'ban1' } = useParams<{ banId?: string }>();
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const [selectedRow, setSelectedRow] = useState<LocalityReviewRow | null>(null);
  const [status, setStatus] = useState<'ALL' | 'CHO_DUYET_BAN' | 'CHO_DUYET_HOI_DONG'>('CHO_DUYET_BAN');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const rows = useMemo<LocalityReviewRow[]>(() => localities.flatMap((locality) => {
    const records = criteriaTables.flatMap((table) => {
      if (!(assignments[table.id] ?? []).includes(locality.id)) return [];
      const record = scores[table.id]?.[locality.id] ?? emptyRecord;
      return record.state === 'CHO_DUYET_BAN' || record.state === 'CHO_DUYET_HOI_DONG'
        ? [{ tableId: table.id, record }]
        : [];
    });
    if (!records.length) return [];

    const updates = records.flatMap(({ record }) => record.entries.flatMap((entry) => Object.values(entry.stageScores ?? {})))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt));
    const latest = updates[0];

    return [{
      locality,
      records,
      proposedScore: records.reduce((total, { record }) => total + sum(record, (entry) => entry.proposedScore ?? 0), 0),
      proposedBonus: records.reduce((total, { record }) => total + sum(record, (entry) => entry.proposedBonusScore ?? 0), 0),
      specialistScore: records.reduce((total, { record }) => total + sum(record, (entry) => entry.stageScores?.SPECIALIST?.score ?? 0), 0),
      specialistBonus: records.reduce((total, { record }) => total + sum(record, (entry) => entry.stageScores?.SPECIALIST?.bonusScore ?? 0), 0),
      latestUpdatedAt: latest?.updatedAt ?? records.map(({ record }) => record.submittedAt).filter(Boolean).sort().at(-1) ?? null,
      latestUpdatedBy: latest?.actorName ?? null,
      hasRevisionRequest: records.some(({ record }) => record.entries.some((entry) => Boolean(entry.revisionRequest))),
      hasNewSpecialistUpdate: records.some(({ record }) => record.entries.some((entry) => Boolean(entry.stageScores?.SPECIALIST))),
    }];
  }), [assignments, criteriaTables, emptyRecord, localities, scores]);

  const visibleRows = useMemo(() => rows
    .filter((row) => status === 'ALL' || row.records.some(({ record }) => record.state === status))
    .filter((row) => !fromDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) <= new Date(`${toDate}T23:59:59`)), [fromDate, rows, status, toDate]);

  const columns = useMemo<ColumnDef<LocalityReviewRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.locality.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(220px,1.25fr)' } } },
    { id: 'newCriteria', accessorFn: (row) => row.hasNewSpecialistUpdate ? 'Có' : 'Không', header: 'Tiêu chí mới được cập nhật', cell: ({ row }) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.original.hasNewSpecialistUpdate ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{row.original.hasNewSpecialistUpdate ? 'Có cập nhật' : 'Không'}</span>, meta: { align: 'center', list: { width: 'minmax(150px,.9fr)' } } },
    { id: 'revision', accessorFn: (row) => row.hasRevisionRequest ? 'Có' : 'Không', header: 'Yêu cầu chỉnh sửa', cell: ({ row }) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.original.hasRevisionRequest ? 'bg-[#D9773D]/15 text-[#9A481D]' : 'bg-muted text-muted-foreground'}`}>{row.original.hasRevisionRequest ? 'Có' : 'Không'}</span>, meta: { align: 'center', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Điểm địa phương đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.specialistScore, header: 'Điểm chuyên viên chấm', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.specialistScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.specialistBonus, header: 'Điểm thưởng chuyên viên chấm', cell: ({ row }) => <span className="tabular-nums">{row.original.specialistBonus}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.85fr)' } } },
    { id: 'specialistTotal', accessorFn: (row) => row.specialistScore + row.specialistBonus, header: 'Tổng điểm chuyên viên chấm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.specialistScore + row.original.specialistBonus}</span>, meta: { align: 'right', list: { width: 'minmax(170px,.9fr)' } } },
    { id: 'proposedTotal', accessorFn: (row) => row.proposedScore + row.proposedBonus, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.proposedScore + row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.8fr)' } } },
    { id: 'updatedAt', accessorFn: formatUpdated, header: 'Cập nhật lần cuối', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatUpdated(row.original)}</span>, meta: { list: { width: 'minmax(180px,1fr)' } } },
    { id: 'state', accessorFn: (row) => row.records.some(({ record }) => record.state === 'CHO_DUYET_BAN') ? 'CHO_DUYET_BAN' : 'CHO_DUYET_HOI_DONG', header: 'Trạng thái duyệt', cell: ({ row }) => <ScoreStateBadge state={row.original.records.some(({ record }) => record.state === 'CHO_DUYET_BAN') ? 'CHO_DUYET_BAN' : 'CHO_DUYET_HOI_DONG'} />, meta: { align: 'center', list: { width: 'minmax(155px,.85fr)' } } },
  ], []);

  const openGroups = () => selectedRow && navigate(`/thi-dua/duyet/lanh-dao-ban/${banId}/${selectedRow.locality.id}`);
  const activeFilters = [
    status !== 'ALL' ? { label: 'Trạng thái', value: status === 'CHO_DUYET_BAN' ? 'Chờ Lãnh đạo duyệt' : 'Đã trình Hội đồng', onClear: () => setStatus('ALL') } : null,
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ do Chuyên viên chuyển Lãnh đạo ban thẩm định." actions={<Button variant="outline" render={<Link to={`/thi-dua/duyet/lanh-dao-ban/${banId}/lich-su`} />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử duyệt</Button>} />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-3"><Select value={status} onValueChange={(value) => setStatus((value ?? 'ALL') as typeof status)}><SelectTrigger aria-label="Lọc theo trạng thái duyệt"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="CHO_DUYET_BAN">Chờ Lãnh đạo duyệt</SelectItem><SelectItem value="CHO_DUYET_HOI_DONG">Đã trình Hội đồng</SelectItem></SelectContent></Select><Input type="date" aria-label="Từ ngày cập nhật" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày cập nhật" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => { setStatus('ALL'); setFromDate(''); setToDate(''); }} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" disabled={!selectedRow} disabledReason="Chọn một địa phương để xem các nhóm tiêu chí." onClick={openGroups}><Eye className="mr-1.5 size-4" />Xem nhóm tiêu chí</Button><Button variant="outline" disabled={!selectedRow} disabledReason="Chọn một địa phương để xem lịch sử duyệt." onClick={() => selectedRow && navigate(`/thi-dua/duyet/lanh-dao-ban/${banId}/lich-su`)}><History className="mr-1.5 size-4" />Lịch sử</Button></div>} emptyState={{ title: 'Không có hồ sơ chờ duyệt', description: 'Hiện chưa có địa phương nào được Chuyên viên chuyển đến Lãnh đạo ban.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ Lãnh đạo ban thẩm định" />
  </div>;
}
