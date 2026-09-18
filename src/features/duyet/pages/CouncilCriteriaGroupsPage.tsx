import { useMemo, useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DetailDialog, EmptyState, PageHeader, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { useScoreStore, type ScoreRecord } from '@/store/scoreStore';
import type { CriteriaTable } from '@/types/domain';

interface GroupRow { table: CriteriaTable; record: ScoreRecord; proposedTotal: number; officialTotal: number; }

/** COL.01.09 — lớp 2 read-only của Hội đồng; không có màn sửa điểm. */
export default function CouncilCriteriaGroupsPage() {
  const { localityId } = useParams<{ localityId?: string }>();
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const [selected, setSelected] = useState<GroupRow | null>(null);
  const [viewing, setViewing] = useState<GroupRow | null>(null);
  const locality = localities.find((item) => item.id === localityId);
  const rows = useMemo<GroupRow[]>(() => criteriaTables.flatMap((table) => {
    if (!localityId || !(assignments[table.id] ?? []).includes(localityId)) return [];
    const record = scores[table.id]?.[localityId] ?? emptyRecord;
    if (record.state !== 'CHO_DUYET_HOI_DONG') return [];
    const proposedTotal = record.entries.reduce((sum, entry) => sum + (entry.proposedScore ?? 0) + (entry.proposedBonusScore ?? 0), 0);
    const officialTotal = record.entries.reduce((sum, entry) => sum + (entry.stageScores?.LEADER?.score ?? entry.stageScores?.SPECIALIST?.score ?? entry.proposedScore ?? 0) + (entry.stageScores?.LEADER?.bonusScore ?? entry.stageScores?.SPECIALIST?.bonusScore ?? entry.proposedBonusScore ?? 0), 0);
    return [{ table, record, proposedTotal, officialTotal }];
  }), [assignments, criteriaTables, emptyRecord, localityId, scores]);
  const columns = useMemo<ColumnDef<GroupRow>[]>(() => [
    { accessorFn: (row) => row.table.name, header: 'Nhóm tiêu chí', cell: ({ row }) => <p className="font-semibold">{row.original.table.name}</p>, meta: { list: { width: 'minmax(240px,1.1fr)' } } },
    { accessorFn: (row) => row.table.content ?? '', header: 'Nội dung', cell: ({ row }) => <p className="line-clamp-2 text-muted-foreground">{row.original.table.content || '—'}</p>, meta: { list: { width: 'minmax(260px,1.3fr)' } } },
    { accessorFn: (row) => row.proposedTotal, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedTotal}</span>, meta: { align: 'right', list: { width: 'minmax(155px,.8fr)' } } },
    { accessorFn: (row) => row.officialTotal, header: 'Tổng điểm thực tế', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.officialTotal}</span>, meta: { align: 'right', list: { width: 'minmax(155px,.8fr)' } } },
    { accessorFn: (row) => row.record.state, header: 'Trạng thái', cell: ({ row }) => <ScoreStateBadge state={row.original.record.state} />, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);
  if (!localityId || !locality) return <EmptyState title="Không tìm thấy địa phương" description="Địa phương được chọn không hợp lệ." />;
  return <div className="space-y-6"><PageHeader title="Danh sách nhóm tiêu chí" description={`${locality.fullName} · Hội đồng chỉ xem kết quả do các cấp trước chấm.`} actions={<Button variant="outline" render={<Link to="/thi-dua/duyet/hoi-dong-tdkt" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại địa phương</Button>} /><DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên hoặc nội dung nhóm tiêu chí..." getRowId={(row) => row.table.id} selectedRowId={selected?.table.id} onRowClick={setSelected} toolbar={<Button variant="info" disabled={!selected} disabledReason="Chọn một nhóm tiêu chí để xem thông tin." onClick={() => setViewing(selected)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>} emptyState={{ title: 'Không có nhóm tiêu chí chờ duyệt', description: 'Địa phương này hiện không có nhóm tiêu chí ở bước Hội đồng.', icon: <Eye className="size-8" /> }} stickyTitle="Danh sách nhóm tiêu chí" stickyDescription={locality.name} /><DetailDialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} title="Chi tiết nhóm tiêu chí" subtitle={viewing?.table.name} items={[{ label: 'Nội dung', value: viewing?.table.content || '—' }, { label: 'Tổng điểm đề xuất', value: viewing?.proposedTotal ?? 0 }, { label: 'Tổng điểm thực tế', value: viewing?.officialTotal ?? 0 }, { label: 'Số tiêu chí con', value: viewing?.record.entries.length ?? 0 }, { label: 'Trạng thái', value: viewing ? <ScoreStateBadge state={viewing.record.state} /> : '—' }]} /></div>;
}
