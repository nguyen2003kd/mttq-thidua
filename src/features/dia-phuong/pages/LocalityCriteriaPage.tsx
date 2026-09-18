import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownToLine, ArrowLeft, Eye, FileText, History, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { EvidenceModal, LocalityScoreTable, type EvidenceFormValue, type LocalityScoreTableHandle } from '@/features/workflow/components';
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
  type SubmissionStage,
} from '@/features/dia-phuong/api/localityApi';
import { downloadFile, filesApi, getFilesApiError } from '@/features/files/api/filesApi';

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

interface LocalityCriteriaListRow extends CriteriaTable {
  totalBonusScore: number;
  totalWithBonus: number;
  submissionStage: SubmissionStage | null;
}

function getSubmissionStageLabel(stage: SubmissionStage | null) {
  switch (stage) {
    case 'Draft': return 'Bản nháp';
    case 'LocalSubmitted': return 'Đã nộp';
    case 'RequiresRevision': return 'Yêu cầu chỉnh sửa';
    case 'SpecialistApproved': return 'Chuyên viên đã duyệt';
    case 'LeaderApproved': return 'Lãnh đạo ban đã duyệt';
    case 'CouncilApproved': return 'Hội đồng đã duyệt';
    case 'CommitteeFinalized': return 'Đã công bố';
    default: return 'Chưa nộp';
  }
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
      .map((g) => mapCriteriaGroupToTable(g));
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
        submissionStage: submissionByGroup.get(assignedTable.id)?.currentStage ?? null,
      };
    }),
    [assignedTables, bonusScoreByGroupId, submissionByGroup],
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
          <TruncatedText value={row.original.content} className="text-sm text-muted-foreground" />
        ),
        meta: { list: { label: 'Nội dung', width: 'minmax(260px, 1.7fr)' } },
      },
      {
        id: 'submissionStage',
        accessorFn: (row) => getSubmissionStageLabel(row.submissionStage),
        header: 'Trạng thái hồ sơ',
        cell: ({ row }) => (
          <Badge variant={row.original.submissionStage === 'RequiresRevision' ? 'warning' : row.original.submissionStage ? 'secondary' : 'outline'}>
            {getSubmissionStageLabel(row.original.submissionStage)}
          </Badge>
        ),
        meta: { list: { label: 'Trạng thái hồ sơ', width: 'minmax(170px, 1fr)' } },
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
  // 1 call batch cho toàn bộ result (tránh N+1), FE tự group theo entityId.
  const submissionResultIds = useMemo(
    () => (submissionDetailQuery.data?.results ?? []).map((result) => result.id),
    [submissionDetailQuery.data],
  );
  const evidenceFilesQuery = useQuery({
    queryKey: ['locality-evidence', submissionResultIds],
    queryFn: () => filesApi.listByEntities('SubmissionResult', submissionResultIds),
    enabled: submissionResultIds.length > 0,
  });

  const detailCriteria = useMemo(() => {
    const group = groupDetailQuery.data;
    if (!group) return [];
    return group.criteria.map((c, idx): CriteriaItem => ({
      id: c.id,
      type: c.type as 'Standard' | 'Supplementary',
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

  const evidence: Evidence[] = useMemo(() => {
    const criteriaIdByResultId = new Map(
      (submissionDetailQuery.data?.results ?? []).map((result) => [result.id, result.criteriaId]),
    );
    return (evidenceFilesQuery.data ?? []).flatMap((file) => {
      const criteriaId = file.entityId ? criteriaIdByResultId.get(file.entityId) : undefined;
      if (!criteriaId) return [];
      return [{
        id: file.id,
        criteriaId,
        localityId: localityId ?? '',
        fileName: file.displayName || file.originalName,
        fileUrl: file.url ?? '',
        uploadedAt: file.createdAt,
        fileSize: file.sizeBytes,
        description: file.description ?? undefined,
        kind: file.category?.toLowerCase() === 'bonus' ? 'BONUS' : 'STANDARD',
      }];
    });
  }, [evidenceFilesQuery.data, submissionDetailQuery.data, localityId]);

  // Lấy lý do yêu cầu chỉnh sửa (ApprovalHistory có action = RequestRevision)
  const isRevisionStage = submission?.currentStage === 'RequiresRevision';
  const revisionHistoriesQuery = useQuery({
    queryKey: ['locality-revision-histories', submission?.id],
    queryFn: () => localityApi.listApprovalHistories(submission!.id, { page: 1, pageSize: 10 }),
    enabled: Boolean(submission?.id) && isRevisionStage,
  });

  const latestRevisionReason = useMemo(() => {
    const items = revisionHistoriesQuery.data?.items ?? [];
    const revisionItem = items.find((item) => item.action?.toLowerCase() === 'requestrevision');
    return revisionItem?.reason ?? null;
  }, [revisionHistoriesQuery.data]);

  // File đính kèm của yêu cầu chỉnh sửa (category = revision-attachment, entityType = Submission)
  const revisionFilesQuery = useQuery({
    queryKey: ['locality-revision-files', submission?.id],
    queryFn: () => filesApi.list({ entityType: 'Submission', entityId: submission!.id, category: 'revision-attachment', page: 1, pageSize: 20 }),
    enabled: Boolean(submission?.id) && isRevisionStage,
  });

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
      toast.success('Đã xóa minh chứng');
      setDeleteTarget(null);
    },
    onError: (e) => toast.error('Lỗi xóa', { description: getFilesApiError(e) }),
  });

  if (!localityId) return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương." />;

  // ── List view ──────────────────────────────────────────────────────────────
  if (!id) {
    if (groupsQuery.isLoading || mySubmissionsQuery.isLoading) {
      return <div className="space-y-5"><PageHeader title="Quản lý tiêu chí thi đua" description="COL.01.02 · Danh sách nhóm tiêu chí được giao" /><PageLoading label="Đang tải danh sách tiêu chí…" /></div>;
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
  if (groupDetailQuery.isLoading) return <PageLoading label="Đang tải nhóm tiêu chí…" />;
  if (groupDetailQuery.isError) return <EmptyState title="Không tải được nhóm tiêu chí" description={getLocalityApiError(groupDetailQuery.error)} />;

  const detailTable = groupDetailQuery.data ? mapCriteriaGroupToTable(groupDetailQuery.data, submissionDetailQuery.data?.id) : table;
  if (!detailTable) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Nhóm tiêu chí không được giao cho địa phương này." />;

  const parentDeadlineMs = detailTable.closeDate ? Date.parse(detailTable.closeDate) : Number.NaN;
  const parentDeadlineExpired = Number.isFinite(parentDeadlineMs) && parentDeadlineMs <= Date.now();
  // Chỉ bản nháp từ /my-submissions mới được địa phương chỉnh sửa hoặc nộp.
  // Các giai đoạn khác chỉ cho phép xem và tải minh chứng đã có.
  const submissionAllowsEditing = !submission || submission.currentStage === 'Draft';
  const submissionLockedReason = submission
    ? 'Hồ sơ đã được gửi xử lý, chỉ có thể xem hoặc tải tập tin.'
    : undefined;
  const editable = submissionAllowsEditing && record.state === 'DRAFT' && !parentDeadlineExpired;
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.criteriaId === criteriaId);
  const canSubmit = submissionAllowsEditing && !parentDeadlineExpired;

  const ensureParentDeadlineActive = () => {
    if (!parentDeadlineExpired) return true;
    toast.error('Nhóm tiêu chí đã hết hạn nộp. Không thể chỉnh sửa hoặc gửi hồ sơ.');
    return false;
  };

  const ensureSubmissionIsEditable = () => {
    if (!submissionAllowsEditing) {
      toast.error('Hồ sơ đã được chuyển xử lý. Bạn chỉ có thể xem hoặc tải tập tin.');
      return false;
    }
    return ensureParentDeadlineActive();
  };

  const uploadDraftFiles = (result: SubmissionApi['results'][number], draft?: EvidenceFormValue) => {
    if (!result || !draft) return Promise.resolve([]);
    const jobs: Promise<unknown>[] = [];
    if (draft.files.length > 0) {
      jobs.push(filesApi.uploadBulk(draft.files, { entityType: 'SubmissionResult', entityId: result.id, category: 'evidence' }));
    }
    if (draft.bonusFiles.length > 0) {
      jobs.push(filesApi.uploadBulk(draft.bonusFiles, { entityType: 'SubmissionResult', entityId: result.id, category: 'bonus' }));
    }
    return Promise.allSettled(jobs);
  };

  /** Gom file đang chọn của các dòng vào các bulk-upload job chạy song song. */
  const collectUploadJobs = (values: Map<string, EvidenceFormValue>) => {
    const results = submissionDetailQuery.data?.results ?? [];
    const jobs: Promise<unknown>[] = [];
    values.forEach((v, criteriaId) => {
      const r = results.find((item) => item.criteriaId === criteriaId);
      if (!r) return;
      if (v.files.length > 0) {
        jobs.push(filesApi.uploadBulk(v.files, { entityType: 'SubmissionResult', entityId: r.id, category: 'evidence' }));
      }
      if (v.bonusFiles.length > 0) {
        jobs.push(filesApi.uploadBulk(v.bonusFiles, { entityType: 'SubmissionResult', entityId: r.id, category: 'bonus' }));
      }
    });
    return jobs;
  };

  const clearLocalDrafts = () => {
    draftResultsRef.current = new Map();
    setDraftResults(new Map());
  };

  const handleSubmitResults = async () => {
    if (!id || !user) return;
    if (!ensureSubmissionIsEditable()) return;
    try {
      const collected = scoreTableRef.current?.collectAll() ?? new Map<string, EvidenceFormValue>();
      if (!submission) {
        // Gộp giá trị đang nhập vào draft local rồi tạo submission 1 lần
        const merged = new Map(draftResultsRef.current);
        collected.forEach((v, k) => merged.set(k, v));
        const items = detailTable.criteria.map((c) => {
          const draft = merged.get(c.id);
          return {
            criteriaId: c.id,
            point: draft?.proposedScore ?? 0,
            bonusPoint: draft?.proposedBonusScore ?? 0,
            explanation: draft?.explanation ?? '',
          };
        });
        const result = await createSubmissionMutation.mutateAsync({ criteriaGroupId: id, items });
        // Sau khi BE tạo SubmissionResult mới có thể gắn file đúng entityId.
        await Promise.all(detailTable.criteria.map((c) => {
          const resultItem = result.results.find((item) => item.criteriaId === c.id);
          return resultItem ? uploadDraftFiles(resultItem, merged.get(c.id)) : Promise.resolve([]);
        }));
        await queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
      } else {
        // Có bản nháp trên server: upload file bulk song song + submitPoints 1 lần
        const results = submissionDetailQuery.data?.results ?? [];
        const uploadJobs = collectUploadJobs(collected);
        const items = results.map((r) => {
          const v = collected.get(r.criteriaId);
          return {
            submissionResultId: r.id,
            point: v?.proposedScore ?? r.point,
            bonusPoint: v?.proposedBonusScore ?? r.bonusPoint,
            explanation: v?.explanation ?? r.explanation,
          };
        });
        const settled = await Promise.allSettled(uploadJobs);
        const failedUploads = settled.filter((s) => s.status === 'rejected').length;
        if (failedUploads > 0) {
          toast.warning(`${failedUploads} nhóm file tải lên thất bại — vẫn tiếp tục nộp điểm.`);
        }
        await localityApi.submitPoints({ submissionId: submission.id, isDraft: false, items });
        await queryClient.invalidateQueries({ queryKey: ['locality-submission'] });
        await queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
        scoreTableRef.current?.markAllSaved();
      }
      clearLocalDrafts();
      toast.success('Đã nộp kết quả lên Chuyên viên');
      setSubmitOpen(false);
    } catch {
      // error handled by mutation onError
    }
  };

  const requireSelection = (callback: () => void) => { if (!selected) { toast.info('Vui lòng chọn một dòng tiêu chí trước.'); return; } callback(); };
  const selectedCriterionDeadlineMs = selected?.criterion?.deadline ? Date.parse(selected.criterion.deadline) : Number.NaN;
  const selectedCriterionDeadlineExpired = Number.isFinite(selectedCriterionDeadlineMs) && selectedCriterionDeadlineMs <= Date.now();
  const currentSelfScore = record.entries.reduce((sum, entry) => sum + (entry.proposedScore ?? entry.value ?? 0), 0);
  const currentBonusScore = record.entries.reduce((sum, entry) => sum + (entry.proposedBonusScore ?? 0), 0);
  const handleSaveAll = async () => {
    if (!scoreTableRef.current || !user) return;
    if (!ensureSubmissionIsEditable()) return;
    setSavingAll(true);
    try {
      const collected = scoreTableRef.current.collectAll();
      if (!submission) {
        // Gộp giá trị đang nhập vào draft local
        const merged = new Map(draftResultsRef.current);
        collected.forEach((v, k) => merged.set(k, v));
        draftResultsRef.current = merged;
        setDraftResults(merged);
        // Chưa có submission trên server → tạo bản nháp (CurrentStage = Draft) từ dữ liệu local
        if (merged.size > 0) {
          const items = detailTable.criteria.map((c) => {
            const draft = merged.get(c.id);
            return {
              criteriaId: c.id,
              point: draft?.proposedScore ?? 0,
              bonusPoint: draft?.proposedBonusScore ?? 0,
              explanation: draft?.explanation ?? '',
            };
          });
          const result = await createSubmissionMutation.mutateAsync({ criteriaGroupId: id!, isDraft: true, items });
          await Promise.all(detailTable.criteria.map((c) => {
            const resultItem = result.results.find((item) => item.criteriaId === c.id);
            return resultItem ? uploadDraftFiles(resultItem, merged.get(c.id)) : Promise.resolve([]);
          }));
          await queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
          clearLocalDrafts();
        }
        toast.success('Đã lưu bản nháp. Bạn có thể tiếp tục hoàn thiện trước khi gửi yêu cầu.');
        return;
      }
      // Đã có submission: 1 call submitPoints cho toàn bộ tiêu chí + bulk upload song song
      const results = submissionDetailQuery.data?.results ?? [];
      const items = collected.size > 0
        ? results.flatMap((r) => {
            const v = collected.get(r.criteriaId);
            return v ? [{ submissionResultId: r.id, point: v.proposedScore, bonusPoint: v.proposedBonusScore, explanation: v.explanation }] : [];
          })
        : [];
      if (items.length > 0) {
        await submitPointsMutation.mutateAsync({ submissionId: submission.id, isDraft: true, items });
      }
      const settled = await Promise.allSettled(collectUploadJobs(collected));
      const failedUploads = settled.filter((s) => s.status === 'rejected').length;
      await queryClient.invalidateQueries({ queryKey: ['locality-evidence'] });
      scoreTableRef.current.markAllSaved();
      if (failedUploads > 0) {
        toast.warning(`Đã lưu điểm — ${failedUploads} nhóm file tải lên thất bại.`);
      } else {
        toast.success('Đã lưu bản nháp. Bạn có thể tiếp tục hoàn thiện trước khi gửi yêu cầu.');
      }
    } catch (e) {
      toast.error('Không thể lưu bản nháp. Vui lòng thử lại.', { description: getLocalityApiError(e) });
    } finally {
      setSavingAll(false);
    }
  };
  const openSubmitDialog = () => {
    if (!ensureSubmissionIsEditable()) return;
    if (!scoreTableRef.current?.validateAll()) {
      toast.error('Vui lòng hoàn thiện các trường bắt buộc trước khi gửi yêu cầu.');
      return;
    }
    setSubmitOpen(true);
  };

  return (
    <div className="space-y-5 pb-6">
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
      {record.revisionRequestedAt && (
        <div className="max-w-2xl space-y-2 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-medium text-warning-foreground">Hồ sơ đã được mở lại. Vui lòng xử lý các phản hồi rồi nộp lại từ đầu chuỗi duyệt.</p>
          {latestRevisionReason && (
            <div className="text-sm">
              <span className="text-muted-foreground">Lý do yêu cầu chỉnh sửa: </span>
              <span className="italic">{latestRevisionReason}</span>
            </div>
          )}
          {(revisionFilesQuery.data?.items ?? []).length > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground">File đính kèm:</span>
              <div className="flex flex-wrap gap-2">
                {(revisionFilesQuery.data?.items ?? []).map((file) => (
                  <a key={file.id} href={file.url ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    {file.displayName ?? file.originalName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <LocalityScoreTable
        ref={scoreTableRef}
        criteria={detailTable.criteria}
        record={record}
        evidence={evidence}
        localityId={localityId}
        editable={editable}
        draftValues={draftResults}
        selectedCriterionId={selected?.criterion?.id}
        uploading={savingAll}
        onSelect={(entry, criterion) => setSelected({ entry, criterion })}
        onDeleteEvidence={(evidenceId) => {
          if (!ensureSubmissionIsEditable()) return;
          const target = evidence.find((item) => item.id === evidenceId);
          if (target) setDeleteTarget(target);
        }}
        toolbar={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={!selected} disabledReason="Chọn một tiêu chí để xem minh chứng." onClick={() => selected && setViewing(selected)}><FileText className="size-4" />Xem minh chứng</Button>
            <Button variant="destructive" disabled={!editable || !selected || selectedCriterionDeadlineExpired} disabledReason={submissionLockedReason ?? (parentDeadlineExpired || selectedCriterionDeadlineExpired ? 'Đã quá hạn nộp, không thể xóa minh chứng.' : !selected ? 'Chọn một tiêu chí để xóa minh chứng.' : 'Hồ sơ hiện không cho phép chỉnh sửa.')} onClick={() => requireSelection(() => { const target = filesFor(selected?.entry.criteriaId)[0]; if (target) setDeleteTarget(target); else toast.info('Tiêu chí chưa có minh chứng để xóa.'); })}><Trash2 className="size-4" />Xóa minh chứng</Button>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button disabled={!editable || savingAll} disabledReason={savingAll ? 'Đang lưu dữ liệu.' : submissionLockedReason ?? (parentDeadlineExpired ? 'Đã quá hạn nộp.' : 'Hồ sơ hiện không cho phép chỉnh sửa.')} onClick={() => void handleSaveAll()}><Save className="size-4" />{savingAll ? 'Đang lưu' : 'Lưu tất cả'}</Button>
              <Button disabled={savingAll || !canSubmit} disabledReason={savingAll ? 'Đang lưu dữ liệu.' : submissionLockedReason ?? (parentDeadlineExpired ? 'Đã quá hạn nộp.' : 'Hồ sơ hiện chưa sẵn sàng để gửi.')} onClick={openSubmitDialog}><Send className="size-4" />Gửi yêu cầu</Button>
            </div>
          </div>
        )}
      />

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
                    <TruncatedText value={file.displayName || file.originalName} className="flex-1 text-[13px] font-semibold text-foreground" />
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

      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Xóa minh chứng" description={`Bạn có chắc muốn xóa “${deleteTarget?.fileName ?? ''}”?`} confirmLabel="Tiếp tục" cancelLabel="Đóng" variant="destructive" onConfirm={() => {
        if (!deleteTarget || !ensureSubmissionIsEditable()) return;
        deleteFileMutation.mutate(deleteTarget.id);
      }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} title="Gửi yêu cầu" description="Gửi hồ sơ tự đánh giá này lên Chuyên viên cấp thành phố?" confirmLabel="Tiếp tục" cancelLabel="Đóng" action="submit" state="DRAFT" onConfirm={handleSubmitResults} />
    </div>
  );
}
