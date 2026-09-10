import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, FilePlus2, History, Pencil, Save, Search, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, EmptyState, PageHeader, ScoreStateBadge } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvidenceModal, ScoreGroupInput, StatusStepper, type EvidenceFormValue } from '@/features/workflow/components';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { CriteriaItem, Evidence, ScoreEntry, ScoreRecord } from '@/types/domain';
import {
  localityApi,
  mapCriteriaGroupToTable,
  mapSubmissionToRecord,
  getLocalityApiError,
  type SubmissionApi,
} from '@/features/dia-phuong/api/localityApi';

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

export default function LocalityCriteriaPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const localityId = user?.localityId;

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedRow | null>(null);
  const [editing, setEditing] = useState<SelectedRow | null>(null);
  const [viewing, setViewing] = useState<SelectedRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  // Danh sách nhóm tiêu chí được giao (backend trả về tất cả, lọc theo submission của locality)
  const groupsQuery = useQuery({
    queryKey: ['locality-criteria-groups', localityId],
    queryFn: () => localityApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
    enabled: Boolean(localityId),
  });

  const mySubmissionsQuery = useQuery({
    queryKey: ['locality-my-submissions', localityId],
    queryFn: () => localityApi.listMySubmissions({ page: 1, pageSize: 100 }),
    enabled: Boolean(localityId),
  });

  // Map criteriaGroupId → submission
  const submissionByGroup = useMemo(() => {
    const map = new Map<string, SubmissionApi>();
    for (const s of mySubmissionsQuery.data?.items ?? []) {
      map.set(s.criteriaGroupId, s);
    }
    return map;
  }, [mySubmissionsQuery.data]);

  const assignedTables = useMemo(() => {
    const groups = groupsQuery.data?.items ?? [];
    // Địa phương được giao = có submission thuộc group, hoặc group đã Applied
    return groups
      .filter((g) => g.status === 'Applied' || submissionByGroup.has(g.id))
      .map(mapCriteriaGroupToTable);
  }, [groupsQuery.data, submissionByGroup]);

  const table = assignedTables.find((item) => item.id === id);
  const submission = id ? submissionByGroup.get(id) : undefined;

  // Detail: chi tiết group + submission
  const groupDetailQuery = useQuery({
    queryKey: ['locality-criteria-group', id],
    queryFn: () => localityApi.getCriteriaGroup(id!),
    enabled: Boolean(id),
  });

  const submissionDetailQuery = useQuery({
    queryKey: ['locality-submission', submission?.id],
    queryFn: () => localityApi.getSubmission(submission!.id),
    enabled: Boolean(submission?.id),
  });

  // Files (evidence) cho submission
  const filesQuery = useQuery({
    queryKey: ['locality-evidence', submission?.id],
    queryFn: () => localityApi.listFiles({ entityType: 'submission', entityId: submission!.id, page: 1, pageSize: 200 }),
    enabled: Boolean(submission?.id),
  });

  const record: ScoreRecord = useMemo(() => {
    if (submissionDetailQuery.data) return mapSubmissionToRecord(submissionDetailQuery.data);
    return { state: 'DRAFT', entries: [], totalScore: 0, submittedAt: null, publishedAt: null };
  }, [submissionDetailQuery.data]);

  const evidence: Evidence[] = useMemo(() => {
    const rows = filesQuery.data?.rows ?? [];
    return rows.map((f) => ({
      id: f.id,
      criteriaId: '', // Backend gắn file theo submission, không theo criteria → để trống
      localityId: localityId ?? '',
      fileName: f.name,
      fileUrl: f.path,
      uploadedAt: f.createdAt,
      fileSize: f.size ?? undefined,
      description: f.description ?? undefined,
    }));
  }, [filesQuery.data, localityId]);

  // Mutations
  const submitPointsMutation = useMutation({
    mutationFn: localityApi.submitPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-submission'] });
      queryClient.invalidateQueries({ queryKey: ['locality-my-submissions'] });
      toast.success('Đã lưu bản nháp');
    },
    onError: (e) => toast.error('Lỗi khi lưu', { description: getLocalityApiError(e) }),
  });

  const finalizeMutation = useMutation({
    mutationFn: localityApi.finalizeSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-submission'] });
      queryClient.invalidateQueries({ queryKey: ['locality-my-submissions'] });
      toast.success('Đã gửi hồ sơ lên Chuyên viên');
      setSubmitOpen(false);
    },
    onError: (e) => toast.error('Lỗi khi gửi', { description: getLocalityApiError(e) }),
  });

  const uploadMutation = useMutation({
    mutationFn: localityApi.uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
    },
    onError: (e) => toast.error('Lỗi upload', { description: getLocalityApiError(e) }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: localityApi.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
      toast.success('Đã xóa bằng chứng');
      setDeleteTarget(null);
    },
    onError: (e) => toast.error('Lỗi xóa', { description: getLocalityApiError(e) }),
  });

  if (!localityId) return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương." />;

  // ── List view ──────────────────────────────────────────────────────────────
  if (!id) {
    if (groupsQuery.isLoading || mySubmissionsQuery.isLoading) {
      return <div className="space-y-5"><PageHeader title="Quản lý tiêu chí thi đua" description="COL.01.02 · Danh sách nhóm tiêu chí được giao" /><p className="text-sm text-muted-foreground">Đang tải…</p></div>;
    }
    if (groupsQuery.isError || mySubmissionsQuery.isError) {
      return <EmptyState title="Không tải được dữ liệu" description={getLocalityApiError(groupsQuery.error ?? mySubmissionsQuery.error)} />;
    }
    const keyword = search.trim().toLocaleLowerCase('vi');
    const rows = assignedTables.filter((item) => !keyword || `${item.name} ${item.content ?? ''}`.toLocaleLowerCase('vi').includes(keyword));
    return (
      <div className="space-y-5">
        <PageHeader title="Quản lý tiêu chí thi đua" description="COL.01.02 · Danh sách nhóm tiêu chí được giao" />
        <div className="flex gap-2 rounded-lg border bg-card p-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm nhóm tiêu chí" className="pl-9" /></div><Button><Search className="size-4" />Tìm kiếm</Button></div>
        <div className="overflow-hidden rounded-lg border bg-card"><Table className="min-w-[700px] table-fixed"><TableHeader><TableRow className="bg-muted/70"><TableHead className="w-[28%]">Tên nhóm tiêu chí</TableHead><TableHead className="w-[32%]">Nội dung</TableHead><TableHead className="w-[10%] text-right">Điểm tổng</TableHead><TableHead className="w-[12%]">Hạn nộp</TableHead><TableHead className="w-[10%] text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>
          {rows.map((item) => <TableRow key={item.id}><TableCell className="whitespace-normal break-words font-medium">{item.name}</TableCell><TableCell className="whitespace-normal break-words text-muted-foreground">{item.content ?? '—'}</TableCell><TableCell className="text-right font-semibold tabular-nums">{item.totalScore}</TableCell><TableCell>{item.closeDate ? formatDate(item.closeDate) : '—'}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/dia-phuong/tieu-chi/${item.id}`)}><Eye className="size-4" />Xem</Button></TableCell></TableRow>)}
          {rows.length === 0 && <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">Chưa có nhóm tiêu chí được giao.</TableCell></TableRow>}
        </TableBody></Table><div className="border-t bg-muted/20 p-2 text-center text-xs text-muted-foreground">Hiển thị {rows.length} bản ghi · 10 dòng/trang</div></div>
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  if (groupDetailQuery.isLoading) return <div className="space-y-5"><p className="text-sm text-muted-foreground">Đang tải nhóm tiêu chí…</p></div>;
  if (groupDetailQuery.isError) return <EmptyState title="Không tải được nhóm tiêu chí" description={getLocalityApiError(groupDetailQuery.error)} />;

  const detailTable = groupDetailQuery.data ? mapCriteriaGroupToTable(groupDetailQuery.data) : table;
  if (!detailTable) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Nhóm tiêu chí không được giao cho địa phương này." />;

  const editable = record.state === 'DRAFT';
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.criteriaId === criteriaId);
  const complete = detailTable.criteria.every((criterion) => {
    const entry = record.entries.find((item) => item.criteriaId === criterion.id);
    return Boolean(entry?.explanation?.trim() && entry.proposedScore !== undefined);
  });

  const save = (value: EvidenceFormValue) => {
    if (!editing?.criterion || !submission || !user) return false;
    const criterionId = editing.criterion.id;
    // Upload file bằng chứng nếu có (fire-and-forget, mutation tự toast)
    if (value.file) {
      uploadMutation.mutate({
        file: value.file,
        displayName: value.file.name,
        entityType: 'submission',
        entityId: submission.id,
        category: 'evidence',
      });
    }
    if (value.bonusFile) {
      uploadMutation.mutate({
        file: value.bonusFile,
        displayName: value.bonusFile.name,
        entityType: 'submission',
        entityId: submission.id,
        category: 'bonus',
      });
    }
    // Submit point cho tiêu chí
    const resultItem = submissionDetailQuery.data?.results.find((r) => r.criteriaId === criterionId);
    if (resultItem) {
      submitPointsMutation.mutate({
        submissionId: submission.id,
        items: [{
          submissionResultId: resultItem.id,
          point: value.proposedScore,
          bonusPoint: value.proposedBonusScore,
          explanation: value.explanation,
        }],
      });
    }
    return true;
  };

  const requireSelection = (callback: () => void) => { if (!selected) { toast.info('Vui lòng chọn một dòng tiêu chí trước.'); return; } callback(); };

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/dia-phuong/tieu-chi" className="hover:text-primary">Danh sách nhóm tiêu chí</Link><span>/</span><span className="font-medium text-foreground">{detailTable.name}</span></div>
      <PageHeader title="Tự đánh giá và nộp bài" description={`${detailTable.name} · ${detailTable.closeDate ? `Hạn nộp ${formatDate(detailTable.closeDate)}` : 'Chưa có hạn nộp'}`} actions={<div className="flex gap-2"><ScoreStateBadge state={record.state} /><Button variant="outline" render={<Link to={`/dia-phuong/tieu-chi/${detailTable.id}/lich-su`} />} nativeButton={false}><History className="size-4" />Lịch sử</Button><Button variant="outline" render={<Link to="/dia-phuong/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button></div>} />
      <StatusStepper state={record.state} hasRevisionRequest={Boolean(record.revisionRequestedAt)} revisionTarget="LOCAL" />
      <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm text-muted-foreground">Điểm tự đánh giá hiện tại</p><p className="text-2xl font-bold tabular-nums">{record.totalScore}<span className="text-sm font-normal text-muted-foreground"> / {detailTable.totalScore}</span></p></div>{record.revisionRequestedAt && <div className="max-w-xl rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">Hồ sơ đã được mở lại. Vui lòng xử lý các phản hồi màu cam rồi nộp lại từ đầu chuỗi duyệt.</div>}</CardContent></Card>
      <ScoreGroupInput criteria={detailTable.criteria} record={record} evidence={evidence} localityId={localityId} mode="locality" selectedCriteriaId={selected?.entry.criteriaId} onSelect={(entry, criterion) => setSelected({ entry, criterion })} onEdit={editable ? (entry, criterion) => setEditing({ entry, criterion }) : undefined} onEvidence={(entry, criterion) => setViewing({ entry, criterion })} />

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-t bg-card/95 px-4 py-3 shadow-[0_-6px_20px_rgba(31,27,26,0.08)] backdrop-blur">
        <Button variant="outline" disabled={!editable} onClick={() => requireSelection(() => setEditing(selected))}><FilePlus2 className="size-4" />Thêm mới bằng chứng</Button>
        <Button variant="outline" disabled={!editable} onClick={() => requireSelection(() => setEditing(selected))}><Pencil className="size-4" />Sửa bằng chứng</Button>
        <Button variant="destructive" disabled={!editable} onClick={() => requireSelection(() => { const target = filesFor(selected?.entry.criteriaId)[0]; if (target) setDeleteTarget(target); else toast.info('Tiêu chí chưa có bằng chứng để xóa.'); })}><Trash2 className="size-4" />⚠ Xóa bằng chứng</Button>
        <div className="ml-auto flex gap-2"><Button disabled={!editable} onClick={() => toast.success('Đã lưu toàn bộ dữ liệu nháp')}><Save className="size-4" />Lưu</Button><Button disabled={!editable || !complete} onClick={() => setSubmitOpen(true)}><Send className="size-4" />Gửi yêu cầu</Button></div>
      </div>

      <EvidenceModal open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }} criterion={editing?.criterion} entry={editing?.entry} evidence={filesFor(editing?.entry.criteriaId)} onSave={save} onDeleteEvidence={(id) => deleteFileMutation.mutate(id)} />
      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Xóa bằng chứng" description={`Bạn có chắc muốn xóa “${deleteTarget?.fileName ?? ''}”?`} confirmLabel="⚠ Tiếp tục" cancelLabel="Đóng" variant="destructive" onConfirm={() => { if (deleteTarget) deleteFileMutation.mutate(deleteTarget.id); }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} title="Gửi yêu cầu" description="Gửi hồ sơ tự đánh giá này lên Chuyên viên cấp thành phố?" confirmLabel="Tiếp tục" cancelLabel="Đóng" action="submit" state="DRAFT" onConfirm={() => { if (submission) finalizeMutation.mutate(submission.id); }} />
    </div>
  );
}
