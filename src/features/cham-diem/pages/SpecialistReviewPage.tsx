import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, FilePlus2, Search, Send, Sparkles, SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, FormDialog, PageHeader, ScoreStateBadge } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import {
  EvidenceModal,
  ForwardSubmissionDialog,
  ReviewScoreModal,
  ScoreGroupInput,
  StatusStepper,
  SupplementaryCriterionModal,
} from '@/features/workflow/components';
import type { CriteriaItem, ScoreEntry } from '@/types/domain';
import type { ScoreState } from '@/types/rbac';

const PAGE_SIZE = 10;

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

function RevisionDialog({ open, onOpenChange, localityName, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; localityName: string; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = reason.trim();
    if (!value) return;
    onSubmit(value);
    setReason('');
    onOpenChange(false);
  };
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Yêu cầu địa phương chỉnh sửa" description={`Mở lại quyền sửa hồ sơ cho ${localityName}.`} onSubmit={submit} submitLabel="Gửi yêu cầu" cancelLabel="Đóng" submitDisabled={!reason.trim()}>
      <div className="space-y-1.5"><Label htmlFor="revision-reason">Lý do <span className="text-destructive">★</span></Label><Textarea id="revision-reason" rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Minh chứng chưa rõ nét, đề nghị bổ sung ảnh chụp thực tế" /></div>
    </FormDialog>
  );
}

export default function SpecialistReviewPage() {
  const { diaPhuongId, nhomTieuChiId } = useParams<{ diaPhuongId?: string; nhomTieuChiId?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const evidence = useScoreStore((state) => state.evidence);
  const reviewCriterion = useScoreStore((state) => state.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((state) => state.addSupplementaryCriterion);
  const requestRevision = useScoreStore((state) => state.requestRevision);
  const submitRecord = useScoreStore((state) => state.submit);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | ScoreState>('ALL');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<SelectedRow | null>(null);
  const [viewing, setViewing] = useState<SelectedRow | null>(null);
  const [selected, setSelected] = useState<SelectedRow | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);

  const localityRows = useMemo(() => localities.flatMap((locality) => {
    const table = criteriaTables.find((item) => assignments[item.id]?.includes(locality.id));
    if (!table) return [];
    return [{ locality, table, record: scores[table.id]?.[locality.id] ?? emptyRecord }];
  }), [localities, criteriaTables, assignments, scores, emptyRecord]);

  const locality = localities.find((item) => item.id === diaPhuongId);
  const assignedTables = locality ? criteriaTables.filter((item) => assignments[item.id]?.includes(locality.id)) : [];
  const table = assignedTables.find((item) => item.id === nhomTieuChiId);
  const record = table && locality ? (scores[table.id]?.[locality.id] ?? emptyRecord) : emptyRecord;

  if (!diaPhuongId) {
    const keyword = search.trim().toLocaleLowerCase('vi');
    const filtered = localityRows.filter(({ locality: item, record: itemRecord }) =>
      (!keyword || `${item.name} ${item.code}`.toLocaleLowerCase('vi').includes(keyword)) &&
      (status === 'ALL' || itemRecord.state === status),
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    return (
      <div className="space-y-5">
        <PageHeader title="Chuyên viên chấm tiêu chí thi đua" description="COL.01.04 · Danh sách địa phương và trạng thái hồ sơ" />
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Tìm kiếm tên hoặc mã địa phương" className="pl-9" /></div>
          <Select value={status} onValueChange={(value) => { setStatus(value as 'ALL' | ScoreState); setPage(0); }}><SelectTrigger className="w-full md:w-60"><SelectValue>{status === 'ALL' ? 'Tất cả trạng thái' : undefined}</SelectValue></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="DRAFT">Nháp / cần chỉnh sửa</SelectItem><SelectItem value="CHO_CHUYEN_VIEN">Đang chờ chuyên viên</SelectItem><SelectItem value="CHO_DUYET_BAN">Đã chuyển lãnh đạo</SelectItem><SelectItem value="DA_CONG_BO">Đã công bố</SelectItem></SelectContent></Select>
          <Button onClick={() => setPage(0)}><Search className="size-4" />Tìm kiếm</Button>
          <Button variant="ghost" onClick={() => { setSearch(''); setStatus('ALL'); setPage(0); }}>Xóa lọc</Button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/70"><TableHead>Tên địa phương</TableHead><TableHead className="text-center">Nhóm tiêu chí hoàn thành</TableHead><TableHead className="text-center">Trạng thái hồ sơ</TableHead><TableHead className="text-center">Tiêu chí mới nộp</TableHead><TableHead className="text-center">Yêu cầu chỉnh sửa</TableHead><TableHead className="text-center">Cập nhật thông tin mới</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>
            {visible.map(({ locality: item, table: rowTable, record: rowRecord }) => {
              const completed = rowTable.criteria.filter((criterion) => rowRecord.entries.some((entry) => entry.criteriaId === criterion.id && entry.proposedScore !== undefined)).length;
              const hasRevision = Boolean(rowRecord.revisionRequestedAt || rowRecord.entries.some((entry) => entry.revisionRequest));
              return <TableRow key={item.id}><TableCell><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.code}</p></TableCell><TableCell className="text-center font-medium">{completed}/{rowTable.criteria.length}</TableCell><TableCell className="text-center"><ScoreStateBadge state={rowRecord.state} /></TableCell><TableCell className="text-center">{rowRecord.state === 'CHO_CHUYEN_VIEN' ? <Badge className="bg-accent/20 text-foreground">Mới nộp</Badge> : 'Không'}</TableCell><TableCell className="text-center">{hasRevision ? <Badge className="bg-warning/15 text-warning-foreground">Có</Badge> : 'Không'}</TableCell><TableCell className="text-center">{rowRecord.submittedAt ? 'Có' : 'Không'}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/chuyen-vien/duyet/${item.id}`)}><Eye className="size-4" />Xem</Button></TableCell></TableRow>;
            })}
            {visible.length === 0 && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Không có địa phương phù hợp.</TableCell></TableRow>}
          </TableBody></Table></div>
          <div className="flex items-center justify-center gap-2 border-t bg-muted/20 p-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" />Trước</Button><span className="min-w-20 text-center text-xs">Trang {page + 1}/{pageCount}</span><Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button><span className="ml-2 text-xs text-muted-foreground">10 dòng/trang</span></div>
        </div>
      </div>
    );
  }

  if (!locality) return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không hợp lệ." />;

  if (!nhomTieuChiId) {
    const filteredTables = assignedTables.filter((item) => !search.trim() || `${item.name} ${item.content ?? ''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link><span>/</span><span className="font-medium text-foreground">{locality.name}</span></div>
        <PageHeader title={`Nhóm tiêu chí · ${locality.name}`} description="Chọn nhóm tiêu chí để thẩm định chi tiết" actions={<Button variant="outline" render={<Link to="/chuyen-vien/duyet" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />
        <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm kiếm nhóm tiêu chí" /></div>
        <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow className="bg-muted/70"><TableHead>Nhóm tiêu chí</TableHead><TableHead>Nội dung</TableHead><TableHead className="text-right">Tổng điểm đề xuất</TableHead><TableHead className="text-right">Tổng điểm thưởng</TableHead><TableHead className="text-center">Trạng thái</TableHead><TableHead className="text-center">Yêu cầu từ Lãnh đạo ban</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>
          {filteredTables.map((item) => { const rowRecord = scores[item.id]?.[locality.id] ?? emptyRecord; const proposed = rowRecord.entries.reduce((sum, entry) => sum + (entry.proposedScore ?? 0), 0); const bonus = rowRecord.entries.reduce((sum, entry) => sum + (entry.proposedBonusScore ?? 0), 0); const reviewed = item.criteria.every((criterion) => rowRecord.entries.find((entry) => entry.criteriaId === criterion.id)?.stageScores?.SPECIALIST); return <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="max-w-xs text-muted-foreground">{item.content ?? '—'}</TableCell><TableCell className="text-right tabular-nums">{proposed}</TableCell><TableCell className="text-right tabular-nums">{bonus}</TableCell><TableCell className="text-center"><Badge variant={reviewed ? 'success' : 'secondary'}>{reviewed ? 'Đã chấm' : 'Chưa chấm'}</Badge></TableCell><TableCell className="text-center">{rowRecord.state === 'CHO_CHUYEN_VIEN' && rowRecord.revisionRequestedAt ? <Badge className="bg-warning/15 text-warning-foreground">Có yêu cầu</Badge> : 'Không'}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/chuyen-vien/duyet/${locality.id}/${item.id}`)}><Eye className="size-4" />Xem</Button></TableCell></TableRow>; })}
        </TableBody></Table></div>
      </div>
    );
  }

  if (!table) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Nhóm tiêu chí không được giao cho địa phương này." />;
  const canProcess = record.state === 'CHO_CHUYEN_VIEN';
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.localityId === locality.id && item.criteriaId === criteriaId);
  const copyProposedScores = () => {
    if (!user) return;
    let updated = 0;
    record.entries.filter((entry) => !entry.isSupplementary && entry.proposedScore !== undefined).forEach((entry) => {
      if (reviewCriterion({ tableId: table.id, localityId: locality.id, criteriaId: entry.criteriaId, score: entry.proposedScore ?? 0, bonusScore: entry.proposedBonusScore ?? 0, stage: 'SPECIALIST', actorName: user.name, actorRole: user.role })) updated += 1;
    });
    toast.success(`Đã cho điểm theo đề xuất cho ${updated} tiêu chí`);
  };

  return (
    <div className="space-y-5 pb-20">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link><span>/</span><Link className="hover:text-primary" to={`/chuyen-vien/duyet/${locality.id}`}>{locality.name}</Link><span>/</span><span className="font-medium text-foreground">{table.name}</span></div>
      <PageHeader title={`Thẩm định · ${locality.name}`} description={table.name} actions={<ScoreStateBadge state={record.state} />} />
      <StatusStepper state={record.state} hasRevisionRequest={Boolean(record.revisionRequestedAt)} />
      <ScoreGroupInput criteria={table.criteria} record={record} evidence={evidence} localityId={locality.id} mode="specialist" selectedCriteriaId={selected?.entry.criteriaId} onSelect={(entry, criterion) => setSelected({ entry, criterion })} onEdit={canProcess ? (entry, criterion) => setEditing({ entry, criterion }) : undefined} onEvidence={(entry, criterion) => setViewing({ entry, criterion })} />

      <div className="sticky bottom-0 z-20 -mx-6 flex flex-wrap items-center gap-2 border-t border-border bg-card/95 px-6 py-3 shadow-[0_-6px_20px_rgba(31,27,26,0.08)] backdrop-blur">
        <Button disabled={!canProcess} onClick={copyProposedScores}><Sparkles className="size-4" />Cho điểm theo đề xuất</Button>
        <Button variant="outline" disabled={!canProcess} onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="size-4" />Thêm mới tiêu chí bổ sung</Button>
        <Button variant="outline" disabled={!canProcess || !selected} onClick={() => selected && setEditing(selected)}><SquarePen className="size-4" />Sửa điểm</Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!canProcess} onClick={() => setRevisionOpen(true)}>Yêu cầu địa phương chỉnh sửa</Button>
          <Button disabled={!canProcess} onClick={() => setForwardOpen(true)}><Send className="size-4" />Gửi yêu cầu</Button>
        </div>
      </div>

      <ReviewScoreModal open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }} entry={editing?.entry} criterion={editing?.criterion} onSave={(value) => { if (!editing || !user) return false; const ok = reviewCriterion({ tableId: table.id, localityId: locality.id, criteriaId: editing.entry.criteriaId, ...value, stage: 'SPECIALIST', actorName: user.name, actorRole: user.role }); if (ok) toast.success('Đã lưu điểm chuyên viên'); return ok; }} />
      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <SupplementaryCriterionModal open={supplementaryOpen} onOpenChange={setSupplementaryOpen} onSave={({ file, ...value }) => { if (!user) return false; const ok = addSupplementaryCriterion({ tableId: table.id, localityId: locality.id, ...value, fileName: file.name, fileSize: file.size, stage: 'SPECIALIST', actorName: user.name, actorRole: user.role }); if (ok) toast.success('Đã thêm tiêu chí bổ sung'); return ok; }} />
      <RevisionDialog open={revisionOpen} onOpenChange={setRevisionOpen} localityName={locality.name} onSubmit={(reason) => { if (!user) return; if (requestRevision(table.id, locality.id, null, reason, user.name, user.role)) toast.success('Đã gửi yêu cầu chỉnh sửa về địa phương'); }} />
      <ForwardSubmissionDialog open={forwardOpen} onOpenChange={setForwardOpen} onConfirm={({ file, description }) => { if (!user) return; submitRecord(table.id, locality.id, user.name, user.role); toast.success('Đã chuyển hồ sơ lên Lãnh đạo ban', { description: description || (file ? `Đính kèm ${file.name}` : undefined) }); }} />
    </div>
  );
}
