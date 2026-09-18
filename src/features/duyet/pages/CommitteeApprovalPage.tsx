import { useMemo, useState } from 'react';
import { Eye, History, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DetailDialog, PageHeader, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore, type ScoreRecord } from '@/store/scoreStore';
import type { Locality } from '@/types/domain';
import { PublishResultModal, type PublishResultValue } from '@/features/workflow/components/PublishResultModal';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
import { toast } from 'sonner';

interface CommitteeLocalityRow {
  locality: Locality;
  records: Array<{ tableId: string; tableName: string; record: ScoreRecord }>;
  score: number;
  bonus: number;
  proposed: number;
  proposedBonus: number;
  state: 'CHO_DUYET_BTT' | 'DA_CONG_BO';
  summaryRecord: ScoreRecord;
}

/** COL.01.11 — Ban thường trực công bố theo địa phương, không sửa điểm. */
export default function CommitteeApprovalPage() {
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const publish = useScoreStore((state) => state.publish);
  const reject = useScoreStore((state) => state.reject);
  const [selected, setSelected] = useState<CommitteeLocalityRow | null>(null);
  const [viewing, setViewing] = useState<CommitteeLocalityRow | null>(null);
  const [publishing, setPublishing] = useState<CommitteeLocalityRow | null>(null);
  const [requesting, setRequesting] = useState<CommitteeLocalityRow | null>(null);

  const rows = useMemo<CommitteeLocalityRow[]>(() => localities.flatMap((locality) => {
    const records = criteriaTables.flatMap((table) => {
      if (!(assignments[table.id] ?? []).includes(locality.id)) return [];
      const record = scores[table.id]?.[locality.id] ?? emptyRecord;
      return record.state === 'CHO_DUYET_BTT' || record.state === 'DA_CONG_BO' ? [{ tableId: table.id, tableName: table.name, record }] : [];
    });
    if (!records.length) return [];
    const totals = records.reduce((value, { record }) => record.entries.reduce((sum, entry) => ({ score: sum.score + (entry.stageScores?.LEADER?.score ?? entry.stageScores?.SPECIALIST?.score ?? entry.proposedScore ?? 0), bonus: sum.bonus + (entry.stageScores?.LEADER?.bonusScore ?? entry.stageScores?.SPECIALIST?.bonusScore ?? entry.proposedBonusScore ?? 0), proposed: sum.proposed + (entry.proposedScore ?? 0), proposedBonus: sum.proposedBonus + (entry.proposedBonusScore ?? 0) }), value), { score: 0, bonus: 0, proposed: 0, proposedBonus: 0 });
    const state = records.some(({ record }) => record.state === 'CHO_DUYET_BTT') ? 'CHO_DUYET_BTT' : 'DA_CONG_BO';
    return [{ locality, records, ...totals, state, summaryRecord: { ...records[0].record, totalScore: totals.score + totals.bonus } }];
  }), [assignments, criteriaTables, emptyRecord, localities, scores]);

  const columns = useMemo<ColumnDef<CommitteeLocalityRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold">{row.original.locality.name}</p><p className="text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(240px,1.2fr)' } } },
    { accessorFn: (row) => row.score, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.score}</span>, meta: { align: 'right', list: { width: 'minmax(130px,.7fr)' } } },
    { accessorFn: (row) => row.proposed, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposed}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.bonus, header: 'Tổng điểm thưởng', cell: ({ row }) => <span className="tabular-nums">{row.original.bonus}</span>, meta: { align: 'right', list: { width: 'minmax(145px,.75fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.85fr)' } } },
    { id: 'groups', accessorFn: (row) => row.records.length, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{row.original.records.length} nhóm</span>, meta: { align: 'center', list: { width: 'minmax(130px,.7fr)' } } },
    { accessorFn: (row) => row.state, header: 'Trạng thái', cell: ({ row }) => <ScoreStateBadge state={row.original.state} />, meta: { align: 'center', list: { width: 'minmax(145px,.8fr)' } } },
  ], []);
  const canPublish = selected?.state === 'CHO_DUYET_BTT';
  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ chờ Ban thường trực công bố kết quả. Điểm chỉ được xem, không chỉnh sửa." actions={<Button variant="outline" render={<Link to="/uy-ban/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử công bố</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selected?.locality.id} onRowClick={setSelected} toolbar={<div className="flex flex-wrap gap-2"><Button variant="info" disabled={!selected} disabledReason="Chọn một địa phương để xem chi tiết." onClick={() => setViewing(selected)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button><Button variant="outline" disabled={!canPublish} disabledReason={!selected ? 'Chọn một địa phương để yêu cầu Chuyên viên bổ sung.' : 'Hồ sơ đã công bố, không thể yêu cầu bổ sung.'} className="border-[#D9773D]/70 text-[#9A481D] hover:bg-[#D9773D]/10" onClick={() => selected && setRequesting(selected)}>Yêu cầu bổ sung</Button><Button disabled={!canPublish} disabledReason={!selected ? 'Chọn một địa phương để công bố.' : 'Hồ sơ này đã được công bố.'} className="bg-accent text-foreground hover:bg-accent/85" onClick={() => selected && setPublishing(selected)}><Send className="mr-1.5 size-4" />Công bố kết quả</Button></div>} emptyState={{ title: 'Không có hồ sơ chờ công bố', description: 'Hiện chưa có hồ sơ nào được Hội đồng chuyển đến Ban thường trực.', icon: <Eye className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ công bố kết quả" />
    <DetailDialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} title="Tổng hợp kết quả địa phương" subtitle={viewing?.locality.fullName} items={[{ label: 'Tổng điểm chính thức', value: viewing ? viewing.score + viewing.bonus : 0 }, { label: 'Tổng điểm đề xuất', value: viewing ? viewing.proposed + viewing.proposedBonus : 0 }, { label: 'Nhóm tiêu chí', value: viewing?.records.map((item) => item.tableName).join(', ') || '—' }, { label: 'Trạng thái', value: viewing ? <ScoreStateBadge state={viewing.state} /> : '—' }]} />
    <PublishResultModal open={!!publishing} onOpenChange={(open) => { if (!open) setPublishing(null); }} locality={publishing?.locality} record={publishing?.summaryRecord} onPublish={(value: PublishResultValue) => { if (!user || !publishing) return; publishing.records.filter((item) => item.record.state === 'CHO_DUYET_BTT').forEach((item) => publish(item.tableId, publishing.locality.id, user.name, user.role, value.attachments, value.comment)); toast.success('Đã công bố kết quả', { description: `${publishing.locality.name} có thể xem kết quả chính thức.` }); setPublishing(null); }} />
    <RequestSpecialistDialog open={!!requesting} onOpenChange={(open) => { if (!open) setRequesting(null); }} localityName={requesting?.locality.name} onConfirm={({ reason, file }) => { if (!user || !requesting) return; const auditReason = file ? `${reason}\n\nTập tin đính kèm: ${file.name}` : reason; requesting.records.filter((item) => item.record.state === 'CHO_DUYET_BTT').forEach((item) => reject(item.tableId, requesting.locality.id, auditReason, user.name, user.role)); toast.success('Đã gửi yêu cầu đến Chuyên viên.'); setRequesting(null); }} />
  </div>;
}
