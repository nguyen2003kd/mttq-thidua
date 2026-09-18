import { useMemo, useState } from 'react';
import { Eye, History, MessageSquare, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { ConfirmDialog, DataTable, PageHeader, RejectDialog, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore, type ScoreRecord } from '@/store/scoreStore';
import type { Locality } from '@/types/domain';
import { toast } from 'sonner';

interface CouncilLocalityRow { locality: Locality; records: Array<{ tableId: string; record: ScoreRecord }>; officialTotal: number; proposedTotal: number; }
const total = (record: ScoreRecord, selector: (entry: ScoreRecord['entries'][number]) => number) => record.entries.reduce((sum, entry) => sum + selector(entry), 0);

/** COL.01.09 — lớp 1: Hội đồng xem danh sách địa phương, không sửa điểm. */
export default function CouncilApprovalPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const approve = useScoreStore((state) => state.approve);
  const reject = useScoreStore((state) => state.reject);
  const addComment = useScoreStore((state) => state.addComment);
  const [selected, setSelected] = useState<CouncilLocalityRow | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  const rows = useMemo<CouncilLocalityRow[]>(() => localities.flatMap((locality) => {
    const records = criteriaTables.flatMap((table) => {
      if (!(assignments[table.id] ?? []).includes(locality.id)) return [];
      const record = scores[table.id]?.[locality.id] ?? emptyRecord;
      return record.state === 'CHO_DUYET_HOI_DONG' ? [{ tableId: table.id, record }] : [];
    });
    if (!records.length) return [];
    return [{ locality, records, officialTotal: records.reduce((sum, item) => sum + total(item.record, (entry) => (entry.stageScores?.LEADER?.score ?? entry.stageScores?.SPECIALIST?.score ?? entry.proposedScore ?? 0) + (entry.stageScores?.LEADER?.bonusScore ?? entry.stageScores?.SPECIALIST?.bonusScore ?? entry.proposedBonusScore ?? 0)), 0), proposedTotal: records.reduce((sum, item) => sum + total(item.record, (entry) => (entry.proposedScore ?? 0) + (entry.proposedBonusScore ?? 0)), 0) }];
  }), [assignments, criteriaTables, emptyRecord, localities, scores]);

  const columns = useMemo<ColumnDef<CouncilLocalityRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold">{row.original.locality.name}</p><p className="text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(250px,1.4fr)' } } },
    { accessorFn: (row) => row.officialTotal, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.officialTotal}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.proposedTotal, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedTotal}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.9fr)' } } },
    { id: 'groups', accessorFn: (row) => row.records.length, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{row.original.records.length} nhóm</span>, meta: { align: 'center', list: { width: 'minmax(130px,.7fr)' } } },
    { id: 'state', accessorFn: () => 'CHO_DUYET_HOI_DONG', header: 'Trạng thái duyệt', cell: () => <ScoreStateBadge state="CHO_DUYET_HOI_DONG" />, meta: { align: 'center', list: { width: 'minmax(170px,.9fr)' } } },
  ], []);

  const applyToSelected = (callback: (tableId: string) => void) => selected?.records.forEach(({ tableId }) => callback(tableId));
  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ đang chờ Hội đồng thi đua xem xét. Hội đồng chỉ xem và ra quyết định, không sửa điểm." actions={<Button variant="outline" render={<Link to="/hoi-dong/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử duyệt</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selected?.locality.id} onRowClick={setSelected} toolbar={<div className="flex flex-wrap gap-2"><Button variant="info" disabled={!selected} disabledReason="Chọn một địa phương để xem các nhóm tiêu chí." onClick={() => selected && navigate(`/thi-dua/duyet/hoi-dong-tdkt/${selected.locality.id}`)}><Eye className="mr-1.5 size-4" />Xem nhóm tiêu chí</Button><Button variant="outline" disabled={!selected} disabledReason="Chọn một địa phương để gửi nhận xét." onClick={() => setCommentOpen(true)}><MessageSquare className="mr-1.5 size-4" />Nhận xét</Button><Button variant="outline" disabled={!selected} disabledReason="Chọn một địa phương để yêu cầu Chuyên viên chỉnh sửa." className="border-[#D9773D]/70 text-[#9A481D] hover:bg-[#D9773D]/10" onClick={() => setRequestOpen(true)}>Yêu cầu chỉnh sửa</Button><Button disabled={!selected} disabledReason="Chọn một địa phương để duyệt." onClick={() => setApproveOpen(true)}><Send className="mr-1.5 size-4" />Duyệt &amp; gửi Ủy ban</Button></div>} emptyState={{ title: 'Không có hồ sơ chờ Hội đồng', description: 'Hiện chưa có địa phương nào được Lãnh đạo ban chuyển đến.', icon: <Eye className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ Hội đồng thi đua" />
    <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Duyệt và gửi Ủy ban" description={`Xác nhận chuyển toàn bộ ${selected?.records.length ?? 0} nhóm tiêu chí của ${selected?.locality.name ?? 'địa phương'} lên Ủy ban thường trực?`} confirmLabel="Duyệt & gửi Ủy ban" cancelLabel="Đóng" action="approve" state="CHO_DUYET_HOI_DONG" onConfirm={() => { if (!user || !selected) return; applyToSelected((tableId) => approve(tableId, selected.locality.id, user.name, user.role)); toast.success('Đã chuyển hồ sơ lên Ủy ban thường trực.'); }} />
    <RejectDialog open={requestOpen} onOpenChange={setRequestOpen} localityName={selected?.locality.name} state="CHO_DUYET_HOI_DONG" title="Yêu cầu Chuyên viên chỉnh sửa" confirmLabel="Gửi yêu cầu" confirmVariant="default" description="Yêu cầu sẽ được chuyển về Chuyên viên để đối chiếu và xử lý; không gửi trực tiếp đến địa phương." reasonLabel="Lý do yêu cầu chỉnh sửa" reasonPlaceholder="Ví dụ: Cần đối chiếu lại minh chứng và tổng điểm thưởng." onConfirm={(reason) => { if (!user || !selected) return; applyToSelected((tableId) => reject(tableId, selected.locality.id, reason, user.name, user.role)); toast.success('Đã gửi yêu cầu đến Chuyên viên.'); }} />
    <RejectDialog open={commentOpen} onOpenChange={setCommentOpen} localityName={selected?.locality.name} state="CHO_DUYET_HOI_DONG" title="Nhận xét địa phương" confirmLabel="Gửi nhận xét" confirmVariant="default" submitAction="approve" description="Nhận xét được lưu cùng hồ sơ và không làm thay đổi trạng thái duyệt." reasonLabel="Nội dung nhận xét" reasonPlaceholder="Ví dụ: Địa phương thực hiện tốt công tác tuyên truyền, cần tiếp tục phát huy." onConfirm={(comment) => { if (!user || !selected) return; applyToSelected((tableId) => addComment(tableId, selected.locality.id, comment, user.name, user.role)); toast.success('Đã lưu nhận xét.'); }} />
  </div>;
}
