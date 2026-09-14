import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownToLine, ArrowLeft, Eye, FileText, History, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, DataTable, EmptyState, PageHeader, ScoreStateBadge } from '@/components/core';
import { EvidenceModal, LocalityScoreTable, type EvidenceFormValue, type LocalityScoreTableHandle } from '@/features/workflow/components';
import { useFileUpload } from '@/hooks/useFileUpload';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { CriteriaItem, Evidence, ScoreEntry, ScoreRecord } from '@/types/domain';
import type { CriteriaTable } from '@/types/domain';
import type { ColumnDef } from '@tanstack/react-table';
import {
  localityApi,
  mapCriteriaGroupToTable,
  mapSubmissionToRecord,
  getLocalityApiError,
  type SubmissionApi,
} from '@/features/dia-phuong/api/localityApi';
import { downloadFile, filesApi, getFilesApiError } from '@/features/files/api/filesApi';

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

interface LocalityCriteriaListRow extends CriteriaTable {
  totalBonusScore: number;
  totalWithBonus: number;
}

export default function LocalityCriteriaPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const localityId = user?.localityId;

  const [selectedListTable, setSelectedListTable] = useState<LocalityCriteriaListRow | null>(null);
  const [selected, setSelected] = useState<SelectedRow | null>(null);
  const [viewing, setViewing] = useState<SelectedRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [draftResults, setDraftResults] = useState<Map<string, EvidenceFormValue>>(new Map());
  const draftResultsRef = useRef<Map<string, EvidenceFormValue>>(draftResults);
  const scoreTableRef = useRef<LocalityScoreTableHandle>(null);
  const { uploading: fileUploading, uploadFiles } = useFileUpload();

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

  // API danh sách nhóm không trả tiêu chí con, nên cần lấy chi tiết để tính đúng tổng điểm thưởng.
  const assignedGroupDetailQueries = useQueries({
    queries: assignedTables.map((assignedTable) => ({
      queryKey: ['locality-criteria-group', assignedTable.id],
      queryFn: () => localityApi.getCriteriaGroup(assignedTable.id),
      enabled: !id && Boolean(localityId),
    })),
  });

  const bonusScoreByGroupId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const query of assignedGroupDetailQueries) {
      if (!query.data) continue;
      totals.set(query.data.id, query.data.criteria.reduce((total, criterion) => total + criterion.maxBonusPoint, 0));
    }
    return totals;
  }, [assignedGroupDetailQueries]);

  const localityListRows = useMemo<LocalityCriteriaListRow[]>(
    () => assignedTables.map((assignedTable) => {
      const totalBonusScore = bonusScoreByGroupId.get(assignedTable.id) ?? 0;
      return {
        ...assignedTable,
        totalBonusScore,
        totalWithBonus: assignedTable.totalScore + totalBonusScore,
      };
    }),
    [assignedTables, bonusScoreByGroupId],
  );

  const localityListColumns = useMemo<ColumnDef<LocalityCriteriaListRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Tên nhóm tiêu chí',
        meta: { className: 'font-medium', list: { width: 'minmax(220px, 1.35fr)' } },
      },
      {
        accessorKey: 'content',
        header: 'Nội dung',
        cell: ({ row }) => (
          <p className="truncate text-sm text-muted-foreground" title={row.original.content}>
            {row.original.content || '—'}
          </p>
        ),
        meta: { list: { label: 'Nội dung', width: 'minmax(260px, 1.7fr)' } },
      },
      {
        accessorKey: 'closeDate',
        header: 'Hạn nộp',
        cell: ({ row }) => row.original.closeDate ? formatDate(row.original.closeDate) : '—',
        meta: { list: { label: 'Hạn nộp', width: 'minmax(115px, .72fr)' } },
      },
      {
        accessorKey: 'totalScore',
        header: 'Điểm tổng',
        meta: { align: 'right', list: { label: 'Điểm tổng', width: 'minmax(105px, .65fr)', valueClassName: 'font-semibold text-primary tabular-nums' } },
      },
      {
        accessorKey: 'totalBonusScore',
        header: 'Tổng điểm thưởng',
        meta: { align: 'right', list: { label: 'Tổng điểm thưởng', width: 'minmax(145px, .85fr)', valueClassName: 'font-semibold tabular-nums' } },
      },
      {
        accessorKey: 'totalWithBonus',
        header: 'Tổng điểm + thưởng',
        meta: { align: 'right', list: { label: 'Tổng điểm + thưởng', width: 'minmax(145px, .85fr)', valueClassName: 'font-semibold tabular-nums' } },
      },
    ],
    [],
  );

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

  // File phải gắn theo từng SubmissionResult; BE không hỗ trợ entityType "submission".
  const evidenceFileQueries = useQueries({
    queries: (submissionDetailQuery.data?.results ?? []).map((result) => ({
      queryKey: ['locality-evidence', result.id],
      queryFn: () => filesApi.list({ entityType: 'SubmissionResult', entityId: result.id, page: 1, pageSize: 100 }),
      enabled: Boolean(submission?.id),
    })),
  });

  const detailCriteria = useMemo(() => {
    const group = groupDetailQuery.data;
    if (!group) return [];
    return group.criteria.map((c, idx): CriteriaItem => ({
      id: c.id,
      name: c.content,
      maxScore: c.maxPoint,
      bonusScore: c.maxBonusPoint || undefined,
      deadline: c.deadline ?? undefined,
      note: c.note ?? undefined,
      order: idx + 1,
      updatedAt: c.updatedAt ?? undefined,
    }));
  }, [groupDetailQuery.data]);

  const record: ScoreRecord = useMemo(() => {
    if (submissionDetailQuery.data) return mapSubmissionToRecord(submissionDetailQuery.data);
    // Khi chưa có submission, dựng record từ draft local
    const draftEntries: ScoreEntry[] = detailCriteria.map((c): ScoreEntry => {
      const draft = draftResults.get(c.id);
      return {
        id: `draft-${c.id}`,
        criteriaId: c.id,
        criteriaName: c.name,
        value: draft?.proposedScore ?? 0,
        state: 'DRAFT',
        scoredBy: '',
        scoredAt: '',
        evidenceCount: 0,
        proposedScore: draft?.proposedScore,
        proposedBonusScore: draft?.proposedBonusScore,
        explanation: draft?.explanation,
      };
    });
    const totalScore = draftEntries.reduce((sum, e) => sum + (e.proposedScore ?? 0) + (e.proposedBonusScore ?? 0), 0);
    return { state: 'DRAFT', entries: draftEntries, totalScore, submittedAt: null, publishedAt: null };
  }, [submissionDetailQuery.data, draftResults, detailCriteria]);

  const evidence: Evidence[] = (submissionDetailQuery.data?.results ?? []).flatMap((result, index) =>
    (evidenceFileQueries[index]?.data?.items ?? []).map((file) => ({
      id: file.id,
      criteriaId: result.criteriaId,
      localityId: localityId ?? '',
      fileName: file.displayName || file.originalName,
      fileUrl: file.url ?? '',
      uploadedAt: file.createdAt,
      fileSize: file.sizeBytes,
      description: file.description ?? undefined,
      kind: file.category?.toLowerCase() === 'bonus' ? 'BONUS' : 'STANDARD',
    })),
  );

  // Mutations
  const submitPointsMutation = useMutation({
    mutationFn: localityApi.submitPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-submission'] });
      queryClient.invalidateQueries({ queryKey: ['locality-my-submissions'] });
    },
    onError: (e) => toast.error('Lỗi khi lưu', { description: getLocalityApiError(e) }),
  });

  const createSubmissionMutation = useMutation({
    mutationFn: localityApi.createSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-submission'] });
      queryClient.invalidateQueries({ queryKey: ['locality-my-submissions'] });
    },
    onError: (e) => toast.error('Lỗi khi nộp', { description: getLocalityApiError(e) }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: filesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
      toast.success('Đã xóa bằng chứng');
      setDeleteTarget(null);
    },
    onError: (e) => toast.error('Lỗi xóa', { description: getFilesApiError(e) }),
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
    return (
      <div className="space-y-5">
        <PageHeader title="Quản lý tiêu chí thi đua" description="COL.01.02 · Danh sách nhóm tiêu chí được giao" />
        <DataTable
          data={localityListRows}
          columns={localityListColumns}
          variant="list"
          getRowId={(row) => row.id}
          selectedRowId={selectedListTable?.id}
          searchable
          searchKey="name"
          searchPlaceholder="Tìm theo tên nhóm tiêu chí..."
          pageSize={10}
          onRowClick={setSelectedListTable}
          onRowDoubleClick={(row) => navigate(`/dia-phuong/tieu-chi/${row.id}`)}
          emptyState={{ title: 'Chưa có nhóm tiêu chí được giao.' }}
          toolbar={
            <Button variant="info" disabled={!selectedListTable} onClick={() => selectedListTable && navigate(`/dia-phuong/tieu-chi/${selectedListTable.id}`)}>
              <Eye className="size-4" />Xem
            </Button>
          }
        />
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
  const notYetSubmitted = !submission;
  const canSubmit = notYetSubmitted || record.state === 'DRAFT';
  const allCriteriaDrafted = detailTable.criteria.every((c) => {
    const draft = draftResults.get(c.id);
    return Boolean(draft?.explanation?.trim() && draft.proposedScore !== undefined && draft.file);
  });

  const save = async (criterion: CriteriaItem, value: EvidenceFormValue) => {
    if (!user) return false;
    const criterionId = criterion.id;

    // Khi chưa có submission → lưu vào draft local
    if (!submission) {
      const next = new Map(draftResultsRef.current).set(criterionId, value);
      draftResultsRef.current = next;
      setDraftResults(next);
      return true;
    }

    const resultItem = submissionDetailQuery.data?.results.find((r) => r.criteriaId === criterionId);
    if (!resultItem) {
      toast.error('Không tìm thấy kết quả tiêu chí để gắn file bằng chứng.');
      return false;
    }

    await submitPointsMutation.mutateAsync({
      submissionId: submission.id,
      isDraft: true,
      items: [{
        submissionResultId: resultItem.id,
        point: value.proposedScore,
        bonusPoint: value.proposedBonusScore,
        explanation: value.explanation,
      }],
    });
    if (value.file) {
      await uploadFiles([value.file], {
        displayName: value.file.name,
        entityType: 'SubmissionResult',
        entityId: resultItem.id,
        category: 'evidence',
      });
    }
    if (value.bonusFile) {
      await uploadFiles([value.bonusFile], {
        displayName: value.bonusFile.name,
        entityType: 'SubmissionResult',
        entityId: resultItem.id,
        category: 'bonus',
      });
    }
    await queryClient.invalidateQueries({ queryKey: ['locality-evidence', resultItem.id] });
    return true;
  };

  const uploadDraftFiles = async (result: SubmissionApi['results'][number], draft?: EvidenceFormValue) => {
    if (!result || !draft) return;
    if (draft.file) {
      await uploadFiles([draft.file], {
        displayName: draft.file.name,
        entityType: 'SubmissionResult',
        entityId: result.id,
        category: 'evidence',
      });
    }
    if (draft.bonusFile) {
      await uploadFiles([draft.bonusFile], {
        displayName: draft.bonusFile.name,
        entityType: 'SubmissionResult',
        entityId: result.id,
        category: 'bonus',
      });
    }
  };

  const clearLocalDrafts = () => {
    draftResultsRef.current = new Map();
    setDraftResults(new Map());
  };

  const handleSubmitResults = async () => {
    if (!id || !user) return;
    try {
      if (!submission) {
        const items = detailTable.criteria.map((c) => {
          const draft = draftResultsRef.current.get(c.id);
          return {
            criteriaId: c.id,
            point: draft?.proposedScore ?? 0,
            bonusPoint: draft?.proposedBonusScore ?? 0,
            explanation: draft?.explanation ?? '',
          };
        });
        const result = await createSubmissionMutation.mutateAsync({ criteriaGroupId: id, items });
        // Sau khi BE tạo SubmissionResult mới có thể gắn file đúng entityId.
        for (const c of detailTable.criteria) {
          const resultItem = result.results.find((item) => item.criteriaId === c.id);
          if (!resultItem) continue;
          await uploadDraftFiles(resultItem, draftResultsRef.current.get(c.id));
        }
        await queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
      } else {
        // Có bản nháp trên server: lưu toàn bộ hàng đang sửa rồi chuyển sang chờ chuyên viên
        if (scoreTableRef.current && !(await scoreTableRef.current.saveAll())) {
          toast.error('Vui lòng hoàn thiện các trường bắt buộc trước khi gửi yêu cầu.');
          return;
        }
        const fresh = await queryClient.fetchQuery({
          queryKey: ['locality-submission', submission.id],
          queryFn: () => localityApi.getSubmission(submission.id),
        });
        await localityApi.submitPoints({
          submissionId: submission.id,
          isDraft: false,
          items: fresh.results.map((r) => ({
            submissionResultId: r.id,
            point: r.point,
            bonusPoint: r.bonusPoint,
            explanation: r.explanation,
          })),
        });
        await queryClient.invalidateQueries({ queryKey: ['locality-submission'] });
      }
      clearLocalDrafts();
      toast.success('Đã nộp kết quả lên Chuyên viên');
      setSubmitOpen(false);
    } catch {
      // error handled by mutation onError
    }
  };

  const requireSelection = (callback: () => void) => { if (!selected) { toast.info('Vui lòng chọn một dòng tiêu chí trước.'); return; } callback(); };
  const currentSelfScore = record.entries.reduce((sum, entry) => sum + (entry.proposedScore ?? entry.value ?? 0), 0);
  const currentBonusScore = record.entries.reduce((sum, entry) => sum + (entry.proposedBonusScore ?? 0), 0);
  const handleSaveAll = async () => {
    if (!scoreTableRef.current) return;
    setSavingAll(true);
    try {
      if (!(await scoreTableRef.current.saveAll())) {
        toast.error('Không thể lưu bản nháp. Vui lòng thử lại.');
        return;
      }
      // Chưa có submission trên server → tạo bản nháp (CurrentStage = Draft) từ dữ liệu local
      if (!submission && draftResultsRef.current.size > 0) {
        const items = detailTable.criteria.map((c) => {
          const draft = draftResultsRef.current.get(c.id);
          return {
            criteriaId: c.id,
            point: draft?.proposedScore ?? 0,
            bonusPoint: draft?.proposedBonusScore ?? 0,
            explanation: draft?.explanation ?? '',
          };
        });
        const result = await createSubmissionMutation.mutateAsync({ criteriaGroupId: id!, isDraft: true, items });
        for (const c of detailTable.criteria) {
          const resultItem = result.results.find((item) => item.criteriaId === c.id);
          if (!resultItem) continue;
          await uploadDraftFiles(resultItem, draftResultsRef.current.get(c.id));
        }
        await queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
        clearLocalDrafts();
      }
      toast.success('Đã lưu bản nháp. Bạn có thể tiếp tục hoàn thiện trước khi gửi yêu cầu.');
    } finally {
      setSavingAll(false);
    }
  };
  const openSubmitDialog = () => {
    if (!scoreTableRef.current?.validateAll()) {
      toast.error('Vui lòng hoàn thiện các trường bắt buộc trước khi gửi yêu cầu.');
      return;
    }
    if (!submission && !allCriteriaDrafted) {
      toast.error('Vui lòng bấm “Lưu tất cả” sau khi hoàn thiện hồ sơ trước khi gửi yêu cầu.');
      return;
    }
    setSubmitOpen(true);
  };

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/dia-phuong/tieu-chi" className="hover:text-primary">Danh sách nhóm tiêu chí</Link><span>/</span><span className="font-medium text-foreground">{detailTable.name}</span></div>
      <PageHeader
        title="Tự đánh giá và nộp bài"
        description={`${detailTable.name} · ${detailTable.closeDate ? `Hạn nộp ${formatDate(detailTable.closeDate)}` : 'Chưa có hạn nộp'}`}
        summary={(
          <div className="flex items-center divide-x divide-border rounded-md border bg-muted/30 px-4 py-2.5">
            <div className="pr-4">
              <p className="text-xs text-muted-foreground">Điểm tự đánh giá hiện tại</p>
              <p className="text-xl font-semibold tabular-nums">
                {currentSelfScore}
                <span className="text-sm font-normal text-muted-foreground"> / {detailTable.totalScore}</span>
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground">Điểm thưởng hiện tại</p>
              <p className="text-xl font-semibold tabular-nums">{currentBonusScore}</p>
            </div>
          </div>
        )}
        actions={<div className="flex flex-wrap gap-2"><ScoreStateBadge state={record.state} /><Button variant="outline" render={<Link to={`/dia-phuong/tieu-chi/${detailTable.id}/lich-su`} />} nativeButton={false}><History className="size-4" />Lịch sử</Button><Button variant="outline" render={<Link to="/dia-phuong/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button></div>}
      />
      {record.revisionRequestedAt && <div className="max-w-xl rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">Hồ sơ đã được mở lại. Vui lòng xử lý các phản hồi màu cam rồi nộp lại từ đầu chuỗi duyệt.</div>}
      <LocalityScoreTable ref={scoreTableRef} criteria={detailTable.criteria} record={record} evidence={evidence} localityId={localityId} editable={editable} draftValues={draftResults} selectedCriterionId={selected?.criterion?.id} uploading={fileUploading} onSave={save} onSelect={(entry, criterion) => setSelected({ entry, criterion })} />

      {(groupDetailQuery.data?.files ?? []).length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="bg-primary px-4 py-3 text-primary-foreground">
            <p className="text-sm font-semibold">Quyết định</p>
            <p className="mt-0.5 text-xs text-white/75">File đính kèm của nhóm tiêu chí</p>
          </div>
          <div className="p-3">
            <ul className="space-y-2">
              {(groupDetailQuery.data?.files ?? []).map((file) => (
                <li key={file.id} className="group relative overflow-hidden rounded-md border border-border border-l-[3px] border-l-primary bg-card transition-colors hover:bg-surface-muted">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="h-4.5 w-4.5 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground" title={file.displayName || file.originalName}>
                      {file.displayName || file.originalName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-1.5">
                    <span className="truncate text-[11px] text-muted-foreground">
                      {file.sizeBytes ? `${file.sizeBytes < 1024 ? `${file.sizeBytes} B` : file.sizeBytes < 1024 * 1024 ? `${Math.ceil(file.sizeBytes / 1024)} KB` : `${(file.sizeBytes / 1024 / 1024).toFixed(1)} MB`}` : ''} · {formatDate(file.createdAt)}
                    </span>
                    <button
                      type="button"
                      title="Tải file về máy"
                      onClick={() => void downloadFile(file.id, file.displayName || file.originalName)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-t bg-card/95 px-4 py-3 shadow-[0_-6px_20px_rgba(31,27,26,0.08)] backdrop-blur">
        {selected && <Button variant="outline" onClick={() => setViewing(selected)}><FileText className="size-4" />Xem file</Button>}
        <Button variant="destructive" disabled={!editable} onClick={() => requireSelection(() => { const target = filesFor(selected?.entry.criteriaId)[0]; if (target) setDeleteTarget(target); else toast.info('Tiêu chí chưa có bằng chứng để xóa.'); })}><Trash2 className="size-4" />Xóa bằng chứng</Button>
        <div className="ml-auto flex gap-2"><Button disabled={!editable || savingAll || fileUploading} onClick={() => void handleSaveAll()}><Save className="size-4" />{savingAll || fileUploading ? 'Đang lưu' : 'Lưu tất cả'}</Button><Button disabled={savingAll || !canSubmit} onClick={openSubmitDialog}><Send className="size-4" />Gửi yêu cầu</Button></div>
      </div>

      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Xóa bằng chứng" description={`Bạn có chắc muốn xóa “${deleteTarget?.fileName ?? ''}”?`} confirmLabel="Tiếp tục" cancelLabel="Đóng" variant="destructive" onConfirm={() => { if (deleteTarget) deleteFileMutation.mutate(deleteTarget.id); }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} title="Gửi yêu cầu" description="Gửi hồ sơ tự đánh giá này lên Chuyên viên cấp thành phố?" confirmLabel="Tiếp tục" cancelLabel="Đóng" action="submit" state="DRAFT" onConfirm={handleSubmitResults} />
    </div>
  );
}
