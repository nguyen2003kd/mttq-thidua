import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, FilePlus2, History, Pencil, Save, Search, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, EmptyState, PageHeader, ScoreStateBadge } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvidenceModal, ScoreGroupInput, StatusStepper, type EvidenceFormValue } from '@/features/workflow/components';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import type { CriteriaItem, Evidence, ScoreEntry } from '@/types/domain';

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

export default function LocalityCriteriaPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const evidence = useScoreStore((state) => state.evidence);
  const lockedCriteria = useScoreStore((state) => state.lockedCriteria);
  const saveSelfAssessment = useScoreStore((state) => state.saveSelfAssessment);
  const uploadEvidence = useScoreStore((state) => state.uploadEvidence);
  const deleteEvidence = useScoreStore((state) => state.deleteEvidence);
  const submitRecord = useScoreStore((state) => state.submit);
  const localityId = user?.localityId;
  const assignedTables = useMemo(() => criteriaTables.filter((table) => localityId && assignments[table.id]?.includes(localityId)), [criteriaTables, assignments, localityId]);
  const table = assignedTables.find((item) => item.id === id);
  const record = table && localityId ? (scores[table.id]?.[localityId] ?? emptyRecord) : emptyRecord;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedRow | null>(null);
  const [editing, setEditing] = useState<SelectedRow | null>(null);
  const [viewing, setViewing] = useState<SelectedRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  if (!localityId) return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương." />;

  if (!id) {
    const keyword = search.trim().toLocaleLowerCase('vi');
    const rows = assignedTables.filter((item) => !keyword || `${item.name} ${item.content ?? ''}`.toLocaleLowerCase('vi').includes(keyword));
    return (
      <div className="space-y-5">
        <PageHeader title="Quản lý tiêu chí thi đua" description="COL.01.02 · Danh sách nhóm tiêu chí được giao" />
        <div className="flex gap-2 rounded-lg border bg-card p-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm nhóm tiêu chí" className="pl-9" /></div><Button><Search className="size-4" />Tìm kiếm</Button></div>
        <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow className="bg-muted/70"><TableHead>Tên nhóm tiêu chí</TableHead><TableHead>Nội dung</TableHead><TableHead className="text-right">Điểm tổng</TableHead><TableHead>Hạn nộp</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>
          {rows.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="max-w-lg text-muted-foreground">{item.content ?? '—'}</TableCell><TableCell className="text-right font-semibold tabular-nums">{item.totalScore}</TableCell><TableCell>{formatDate(item.closeDate)}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/dia-phuong/tieu-chi/${item.id}`)}><Eye className="size-4" />Xem</Button></TableCell></TableRow>)}
          {rows.length === 0 && <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">Chưa có nhóm tiêu chí được giao.</TableCell></TableRow>}
        </TableBody></Table><div className="border-t bg-muted/20 p-2 text-center text-xs text-muted-foreground">Hiển thị {rows.length} bản ghi · 10 dòng/trang</div></div>
      </div>
    );
  }

  if (!table) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Nhóm tiêu chí không được giao cho địa phương này." />;
  const editable = record.state === 'DRAFT';
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.localityId === localityId && item.criteriaId === criteriaId);
  const lockedIds = lockedCriteria[table.id]?.[localityId] ?? [];
  const complete = table.criteria.every((criterion) => { const entry = record.entries.find((item) => item.criteriaId === criterion.id); return Boolean(entry?.explanation?.trim() && entry.proposedScore !== undefined && filesFor(criterion.id).length > 0); });

  const save = (value: EvidenceFormValue) => {
    if (!editing?.criterion || !user) return false;
    if (value.file) uploadEvidence({ criteriaId: editing.criterion.id, localityId, fileName: value.file.name, fileUrl: URL.createObjectURL(value.file), fileSize: value.file.size, description: value.explanation, kind: 'STANDARD' });
    if (value.bonusFile) uploadEvidence({ criteriaId: editing.criterion.id, localityId, fileName: value.bonusFile.name, fileUrl: URL.createObjectURL(value.bonusFile), fileSize: value.bonusFile.size, description: value.explanation, kind: 'BONUS' });
    const ok = saveSelfAssessment({ tableId: table.id, localityId, criteriaId: editing.criterion.id, proposedScore: value.proposedScore, proposedBonusScore: value.proposedBonusScore, explanation: value.explanation, actorName: user.name });
    if (ok) toast.success('Đã lưu bản nháp', { description: editing.criterion.name });
    return ok;
  };

  const requireSelection = (callback: () => void) => { if (!selected) { toast.info('Vui lòng chọn một dòng tiêu chí trước.'); return; } callback(); };

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/dia-phuong/tieu-chi" className="hover:text-primary">Danh sách nhóm tiêu chí</Link><span>/</span><span className="font-medium text-foreground">{table.name}</span></div>
      <PageHeader title="Tự đánh giá và nộp bài" description={`${table.name} · Hạn nộp ${formatDate(table.closeDate)}`} actions={<div className="flex gap-2"><ScoreStateBadge state={record.state} /><Button variant="outline" render={<Link to={`/dia-phuong/tieu-chi/${table.id}/lich-su`} />} nativeButton={false}><History className="size-4" />Lịch sử</Button><Button variant="outline" render={<Link to="/dia-phuong/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button></div>} />
      <StatusStepper state={record.state} hasRevisionRequest={Boolean(record.revisionRequestedAt)} revisionTarget="LOCAL" />
      <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm text-muted-foreground">Điểm tự đánh giá hiện tại</p><p className="text-2xl font-bold tabular-nums">{record.totalScore}<span className="text-sm font-normal text-muted-foreground"> / {table.totalScore}</span></p></div>{record.revisionRequestedAt && <div className="max-w-xl rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">Hồ sơ đã được mở lại. Vui lòng xử lý các phản hồi màu cam rồi nộp lại từ đầu chuỗi duyệt.</div>}</CardContent></Card>
      <ScoreGroupInput criteria={table.criteria} record={record} evidence={evidence} localityId={localityId} mode="locality" lockedCriteriaIds={lockedIds} selectedCriteriaId={selected?.entry.criteriaId} onSelect={(entry, criterion) => setSelected({ entry, criterion })} onEdit={editable ? (entry, criterion) => setEditing({ entry, criterion }) : undefined} onEvidence={(entry, criterion) => setViewing({ entry, criterion })} />

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-t bg-card/95 px-4 py-3 shadow-[0_-6px_20px_rgba(31,27,26,0.08)] backdrop-blur">
        <Button variant="outline" disabled={!editable} onClick={() => requireSelection(() => setEditing(selected))}><FilePlus2 className="size-4" />Thêm mới bằng chứng</Button>
        <Button variant="outline" disabled={!editable} onClick={() => requireSelection(() => setEditing(selected))}><Pencil className="size-4" />Sửa bằng chứng</Button>
        <Button variant="destructive" disabled={!editable} onClick={() => requireSelection(() => { const target = filesFor(selected?.entry.criteriaId)[0]; if (target) setDeleteTarget(target); else toast.info('Tiêu chí chưa có bằng chứng để xóa.'); })}><Trash2 className="size-4" />⚠ Xóa bằng chứng</Button>
        <div className="ml-auto flex gap-2"><Button disabled={!editable} onClick={() => toast.success('Đã lưu toàn bộ dữ liệu nháp')}><Save className="size-4" />Lưu</Button><Button disabled={!editable || !complete} onClick={() => setSubmitOpen(true)}><Send className="size-4" />Gửi yêu cầu</Button></div>
      </div>

      <EvidenceModal open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }} criterion={editing?.criterion} entry={editing?.entry} evidence={filesFor(editing?.entry.criteriaId)} onSave={save} onDeleteEvidence={deleteEvidence} />
      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Xóa bằng chứng" description={`Bạn có chắc muốn xóa “${deleteTarget?.fileName ?? ''}”?`} confirmLabel="⚠ Tiếp tục" cancelLabel="Đóng" variant="destructive" onConfirm={() => { if (deleteTarget) { deleteEvidence(deleteTarget.id); toast.success('Đã xóa bằng chứng'); setDeleteTarget(null); } }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} title="Gửi yêu cầu" description="Gửi hồ sơ tự đánh giá này lên Chuyên viên cấp thành phố?" confirmLabel="Tiếp tục" cancelLabel="Đóng" action="submit" state="DRAFT" onConfirm={() => { if (!user) return; submitRecord(table.id, localityId, user.name, user.role); toast.success('Đã gửi hồ sơ lên Chuyên viên'); }} />
    </div>
  );
}
