import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, History, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { useScoreStore, type ScoreRecord } from '@/store/scoreStore';
import type { CriteriaTable } from '@/types/domain';

interface CriteriaGroupRow { table: CriteriaTable; record: ScoreRecord; proposedScore: number; proposedBonus: number; isSpecialistScored: boolean; }

/** COL.01.07 — lớp 2: nhóm tiêu chí của một địa phương. */
export default function BanLeaderCriteriaGroupsPage() {
  const { banId = 'ban1', localityId } = useParams<{ banId?: string; localityId?: string }>();
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const [selectedRow, setSelectedRow] = useState<CriteriaGroupRow | null>(null);
  const locality = localities.find((item) => item.id === localityId);

  const rows = useMemo<CriteriaGroupRow[]>(() => criteriaTables.flatMap((table) => {
    if (!localityId || !(assignments[table.id] ?? []).includes(localityId)) return [];
    const record = scores[table.id]?.[localityId] ?? emptyRecord;
    if (record.state !== 'CHO_DUYET_BAN' && record.state !== 'CHO_DUYET_HOI_DONG') return [];
    return [{ table, record, proposedScore: record.entries.reduce((total, entry) => total + (entry.proposedScore ?? 0), 0), proposedBonus: record.entries.reduce((total, entry) => total + (entry.proposedBonusScore ?? 0), 0), isSpecialistScored: record.entries.every((entry) => Boolean(entry.stageScores?.SPECIALIST)) }];
  }), [assignments, criteriaTables, emptyRecord, localityId, scores]);

  const columns = useMemo<ColumnDef<CriteriaGroupRow>[]>(() => [
    { accessorFn: (row) => row.table.name, header: 'Nhóm tiêu chí', cell: ({ row }) => <p className="font-semibold text-foreground">{row.original.table.name}</p>, meta: { list: { width: 'minmax(240px,1.1fr)' } } },
    { accessorFn: (row) => row.table.content ?? '', header: 'Nội dung', cell: ({ row }) => <p className="line-clamp-2 text-sm text-muted-foreground">{row.original.table.content || '—'}</p>, meta: { list: { width: 'minmax(260px,1.3fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Tổng điểm thưởng', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.75fr)' } } },
    { id: 'scored', accessorFn: (row) => row.isSpecialistScored ? 'Đã chấm' : 'Chưa chấm', header: 'Trạng thái chấm', cell: ({ row }) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.original.isSpecialistScored ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning-foreground'}`}>{row.original.isSpecialistScored ? 'Đã chấm' : 'Chưa chấm'}</span>, meta: { align: 'center', list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.record.state, header: 'Trạng thái duyệt', cell: ({ row }) => <ScoreStateBadge state={row.original.record.state} />, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);

  if (!localityId || !locality) return <EmptyState title="Không tìm thấy địa phương" description="Địa phương được chọn không hợp lệ." />;
  const backToList = `/thi-dua/duyet/lanh-dao-ban/${banId}`;
  const openDetail = () => selectedRow && navigate(`${backToList}/chi-tiet/${selectedRow.table.id}/${localityId}`);
  return <div className="space-y-6">
    <PageHeader title="Danh sách nhóm tiêu chí" description={`${locality.fullName} · Chọn một nhóm để Lãnh đạo ban thẩm định chi tiết.`} actions={<Button variant="outline" render={<Link to={backToList} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại địa phương</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên hoặc nội dung nhóm tiêu chí..." getRowId={(row) => row.table.id} selectedRowId={selectedRow?.table.id} onRowClick={setSelectedRow} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem chi tiết." onClick={openDetail}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button><Button variant="outline" disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem lịch sử." onClick={() => selectedRow && navigate(`${backToList}/lich-su`)}><History className="mr-1.5 size-4" />Lịch sử</Button></div>} emptyState={{ title: 'Không có nhóm tiêu chí chờ duyệt', description: 'Địa phương này hiện không có nhóm tiêu chí ở bước Lãnh đạo ban.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách nhóm tiêu chí" stickyDescription={locality.name} />
  </div>;
}
