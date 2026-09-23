import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownToLine, ArrowLeft, Eye, FileText, History, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, DataTable, EmptyState, FilePreviewDialog, FormDialog, PageHeader, PageLoading, ScoreStateBadge, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EvidenceModal, LocalityScoreTable, type EvidenceFormValue, type LocalityScoreTableHandle } from '@/features/workflow/components';
import { LocalityCriteriaHistoryDialog } from '@/features/dia-phuong/components/LocalityCriteriaHistoryDialog';
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
import { useTrustedTime } from '@/hooks/useTrustedTime';

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

function CriterionDetailDialog({ open, onOpenChange, item, evidence, onPreview }: { open: boolean; onOpenChange: (open: boolean) => void; item: SelectedRow | null; evidence: Evidence[]; onPreview: (file: Evidence) => void }) {
  if (!item) return null;
  const { entry, criterion } = item;
  const fields = [
    ['Loại tiêu chí', entry.isSupplementary ? 'Tiêu chí bổ sung' : 'Tiêu chí chấm điểm'],
    ['Hạn nộp', criterion?.deadline ? formatDate(criterion.deadline) : 'Chưa có hạn'],
    ['Điểm đề xuất', `${entry.proposedScore ?? entry.value ?? 0} / ${criterion?.maxScore ?? entry.supplementaryMaxScore ?? 0}`],
    ['Điểm thưởng đề xuất', `${entry.proposedBonusScore ?? 0} / ${criterion?.bonusScore ?? 0}`],
  ];

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto p-0 sm:max-w-3xl"><DialogHeader className="border-b border-border bg-muted/20 px-6 py-5 pr-12"><DialogTitle>Chi tiết tiêu chí con</DialogTitle><DialogDescription>Xem đầy đủ thông tin, điểm đề xuất và minh chứng đã nộp.</DialogDescription></DialogHeader><div className="space-y-5 px-6 py-5"><section><p className="text-xs font-medium text-muted-foreground">Nội dung tiêu chí</p><p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold leading-6 text-foreground">{criterion?.name ?? entry.criteriaName}</p></section><div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="border-b border-border px-4 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p></div>)}</div>{criterion?.note && <section><p className="text-xs font-medium text-muted-foreground">Ghi chú</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{criterion.note}</p></section>}<section><p className="text-xs font-medium text-muted-foreground">Nội dung diễn giải</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{entry.explanation || 'Chưa có diễn giải.'}</p></section>{entry.revisionRequest && <section className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3"><p className="text-xs font-medium text-warning-foreground">Yêu cầu chỉnh sửa</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{entry.revisionRequest}</p></section>}<section><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-foreground">Minh chứng đã nộp</p><span className="text-xs text-muted-foreground">{evidence.length} tệp</span></div>{evidence.length > 0 ? <div className="mt-3 space-y-2">{evidence.map((file) => <button key={file.id} type="button" onClick={() => onPreview(file)} className="flex w-full min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2.5 text-left hover:bg-muted/50"><FileText className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 break-all text-sm font-medium">{file.fileName}</span><Eye className="size-4 shrink-0 text-muted-foreground" /></button>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Chưa có minh chứng đính kèm.</p>}</section></div></DialogContent></Dialog>;
}

interface LocalityCriteriaListRow extends CriteriaTable {
  totalBonusScore: number;
  totalWithBonus: number;
  submissionStage: SubmissionStage | null;
}

function getSubmissionStageLabel(stage: SubmissionStage | null) {
  switch (stage) {
    case 'LocalSubmitted': return 'Đã nộp';
    case 'RequiresRevision': return 'Yêu cầu chỉnh sửa';
    // Địa phương chỉ cần biết hồ sơ đã rời bước nộp hay đang cần xử lý lại;
    // không hiển thị chi tiết các cấp duyệt nội bộ.
    case 'SpecialistApproved':
    case 'LeaderApproved':
    case 'CouncilApproved':
    case 'CommitteeFinalized': return 'Đã nộp';
    default: return 'Chưa nộp';
  }
}

function parseSubmissionResultIds(changedData?: string | null) {
  if (!changedData) return [] as string[];
  try {
    const parsed = JSON.parse(changedData) as { submissionResultIds?: unknown };
    return Array.isArray(parsed.submissionResultIds)
      ? parsed.submissionResultIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function extractRevisionReason(reason?: string | null) {
  if (!reason) return null;
  const lines = reason.split(/\r?\n/);
  let index = 0;
  while (index < lines.length && /^\s*\[[^\]]+\]/.test(lines[index])) index += 1;
  while (index < lines.length && lines[index].trim() === '') index += 1;
  const extracted = lines.slice(index).join('\n').trim();
  return extracted || reason.trim();
}

export default function LocalityCriteriaPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const localityId = user?.localityId;
  const { nowMs: trustedNowMs, isReady: isTrustedTimeReady } = useTrustedTime();

  const [selectedListTable, setSelectedListTable] = useState<LocalityCriteriaListRow | null>(null);
  const [selected, setSelected] = useState<SelectedRow | null>(null);
  const [viewing, setViewing] = useState<SelectedRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null);
  const [previewFile, setPreviewFile] = useState<{ id: string; originalName: string } | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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
      // File đính kèm yêu cầu bổ sung của Chuyên viên và tệp đính kèm khi sửa điểm không phải minh chứng của địa phương — tách riêng.
      const category = file.category?.toLowerCase();
      if (category === 'supplementary' || category === 'score-update' || category === 'leaderscoring') return [];
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

  // Lấy lịch sử yêu cầu chỉnh sửa để hiện phản hồi chung và riêng phản hồi từ Chuyên viên.
  const currentSubmissionStage = submissionDetailQuery.data?.currentStage ?? submission?.currentStage;
  const isRevisionStage = currentSubmissionStage === 'RequiresRevision';
  const revisionHistoriesQuery = useQuery({
    queryKey: ['locality-revision-histories', submission?.id],
    queryFn: () => localityApi.listApprovalHistories(submission!.id, { action: 'RequestRevision', page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: Boolean(submission?.id),
  });

  const latestRevisionReason = useMemo(() => {
    const items = revisionHistoriesQuery.data?.items ?? [];
    const revisionItem = items.find((item) => item.action?.toLowerCase() === 'requestrevision');
    return extractRevisionReason(revisionItem?.reason);
  }, [revisionHistoriesQuery.data]);

  const latestSpecialistRevision = useMemo(() => (
    (revisionHistoriesQuery.data?.items ?? []).find((item) => (
      item.action?.toLowerCase() === 'requestrevision' && item.stageLevel === 'LocalSubmitted'
    )) ?? null
  ), [revisionHistoriesQuery.data]);

  const specialistRevisionReason = useMemo(
    () => extractRevisionReason(latestSpecialistRevision?.reason),
    [latestSpecialistRevision],
  );

  const specialistRevisionCriteriaIds = useMemo(() => {
    if (!latestSpecialistRevision) return null;
    const resultIds = parseSubmissionResultIds(latestSpecialistRevision.changedData);
    if (resultIds.length === 0) return null;
    const resultIdSet = new Set(resultIds);
    const criteriaIds = new Set<string>();
    for (const result of submissionDetailQuery.data?.results ?? []) {
      if (resultIdSet.has(result.id)) criteriaIds.add(result.criteriaId);
    }
    return criteriaIds;
  }, [latestSpecialistRevision, submissionDetailQuery.data]);

  // Tiêu chí bổ sung do Chuyên viên thêm cho riêng hồ sơ này.
  const supplementaryCriteriaIds = useMemo(() => {
    const submissionId = submissionDetailQuery.data?.id ?? submission?.id;
    if (!submissionId) return new Set<string>();
    return new Set(
      (groupDetailQuery.data?.criteria ?? [])
        .filter((criterion) => criterion.type === 'Supplementary' && criterion.targetSubmissionId === submissionId)
        .map((criterion) => criterion.id),
    );
  }, [groupDetailQuery.data, submissionDetailQuery.data, submission?.id]);

  // Khi hồ sơ ở RequiresRevision: chỉ cho nhập tiêu chí bổ sung + tiêu chí được yêu cầu chỉnh sửa.
  const revisionEditableCriteriaIds = useMemo<ReadonlySet<string> | null>(() => {
    if (!isRevisionStage) return null;
    // Yêu cầu chỉnh sửa không chỉ định tiêu chí (dữ liệu cũ) → cho phép sửa toàn bộ.
    if (latestSpecialistRevision && !specialistRevisionCriteriaIds) return null;
    const editableIds = new Set(specialistRevisionCriteriaIds ?? []);
    supplementaryCriteriaIds.forEach((id) => editableIds.add(id));
    // Không có yêu cầu nào xác định phạm vi → giữ hành vi cũ (sửa tất cả).
    if (editableIds.size === 0) return null;
    return editableIds;
  }, [isRevisionStage, latestSpecialistRevision, specialistRevisionCriteriaIds, supplementaryCriteriaIds]);

  const specialistRevisionReasons = useMemo(() => {
    const map = new Map<string, string>();
    if (!specialistRevisionReason) return map;
    if (specialistRevisionCriteriaIds) {
      specialistRevisionCriteriaIds.forEach((criteriaId) => map.set(criteriaId, specialistRevisionReason));
      return map;
    }
    detailCriteria.forEach((criterion) => map.set(criterion.id, specialistRevisionReason));
    return map;
  }, [specialistRevisionReason, specialistRevisionCriteriaIds, detailCriteria]);

  // File đính kèm khi Chuyên viên thêm tiêu chí bổ sung (category = supplementary, gắn trên SubmissionResult).
  const supplementaryFiles = useMemo(() => {
    const criteriaIdByResultId = new Map(
      (submissionDetailQuery.data?.results ?? []).map((result) => [result.id, result.criteriaId]),
    );
    const nameByCriteriaId = new Map(detailCriteria.map((criterion) => [criterion.id, criterion.name]));
    return (evidenceFilesQuery.data ?? [])
      .filter((file) => file.category?.toLowerCase() === 'supplementary')
      .map((file) => {
        const criteriaId = file.entityId ? criteriaIdByResultId.get(file.entityId) : undefined;
        return { file, criteriaName: criteriaId ? nameByCriteriaId.get(criteriaId) : undefined };
      });
  }, [evidenceFilesQuery.data, submissionDetailQuery.data, detailCriteria]);

  // File đính kèm của yêu cầu chỉnh sửa: file mới gắn vào ApprovalHistory (history.files),
  // file cũ (legacy) gắn vào Submission với category = revision-attachment.
  const revisionFilesQuery = useQuery({
    queryKey: ['locality-revision-files', submission?.id],
    queryFn: () => filesApi.list({ entityType: 'Submission', entityId: submission!.id, category: 'revision-attachment', page: 1, pageSize: 20 }),
    enabled: Boolean(submission?.id) && isRevisionStage,
  });

  const revisionFiles = useMemo(() => {
    const fromHistories = (revisionHistoriesQuery.data?.items ?? []).flatMap((item) => item.files ?? []);
    const legacy = revisionFilesQuery.data?.items ?? [];
    return [...fromHistories, ...legacy];
  }, [revisionHistoriesQuery.data, revisionFilesQuery.data]);

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

  const currentTimeMs = trustedNowMs ?? 0;
  const parentDeadlineMs = detailTable.closeDate ? Date.parse(detailTable.closeDate) : Number.NaN;
  const parentDeadlineExpired = isTrustedTimeReady && Number.isFinite(parentDeadlineMs) && parentDeadlineMs <= currentTimeMs;
  // Địa phương được chỉnh sửa bản nháp hoặc hồ sơ bị yêu cầu chỉnh sửa.
  // Các giai đoạn đã chuyển tiếp khác chỉ cho phép xem và tải minh chứng đã có.
  const submissionAllowsEditing = !submission
    || currentSubmissionStage === 'Draft'
    || currentSubmissionStage === 'RequiresRevision';
  const submissionLockedReason = submission
    ? 'Hồ sơ đã được gửi xử lý, chỉ có thể xem hoặc tải tập tin.'
    : undefined;
  const editable = isTrustedTimeReady && submissionAllowsEditing && record.state === 'DRAFT' && !parentDeadlineExpired;
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.criteriaId === criteriaId);
  const decisionFiles = groupDetailQuery.data?.files ?? [];
  const canSubmit = isTrustedTimeReady && submissionAllowsEditing && !parentDeadlineExpired;

  const ensureParentDeadlineActive = () => {
    if (!isTrustedTimeReady) {
      toast.info('Đang đồng bộ thời gian chuẩn, vui lòng thử lại sau giây lát.');
      return false;
    }
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
        const items = results.flatMap((r) => {
          const v = collected.get(r.criteriaId);
          return v ? [{
            submissionResultId: r.id,
            point: v.proposedScore,
            bonusPoint: v.proposedBonusScore,
            explanation: v.explanation,
          }] : [];
        });
        if (items.length === 0) {
          toast.error('Không có tiêu chí nào cần chỉnh sửa để gửi.');
          return;
        }
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
  const selectedCriterionDeadlineExpired = isTrustedTimeReady && Number.isFinite(selectedCriterionDeadlineMs) && selectedCriterionDeadlineMs <= currentTimeMs;
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
      <PageHeader
        title="Tự đánh giá và gửi minh chứng"
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
        actions={<div className="flex flex-wrap items-center gap-2"><ScoreStateBadge state={record.state} size="lg" />{decisionFiles.length > 0 && <Button onClick={() => { if (decisionFiles.length === 1) { setPreviewFile({ id: decisionFiles[0].id, originalName: decisionFiles[0].displayName || decisionFiles[0].originalName }); } else { setDecisionOpen(true); } }}><FileText className="size-4" />Xem quyết định{decisionFiles.length > 1 ? ` (${decisionFiles.length})` : ''}</Button>}<Button variant="outline" onClick={() => setHistoryOpen(true)}><History className="size-4" />Lịch sử</Button><Button render={<Link to="/dia-phuong/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button></div>}
      />
      {record.revisionRequestedAt && (
        <div className="max-w-2xl space-y-2 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-medium text-warning-foreground">Hồ sơ đã được mở lại. Vui lòng xử lý các phản hồi rồi nộp lại.</p>
          {latestRevisionReason && (
            <div className="text-sm">
              <span className="text-muted-foreground">Lý do yêu cầu chỉnh sửa: </span>
              <span className="italic">{latestRevisionReason}</span>
            </div>
          )}
          {revisionFiles.length > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground">File đính kèm:</span>
              <div className="flex flex-wrap gap-2">
                {revisionFiles.map((file) => (
                  <button key={file.id} type="button" onClick={() => setPreviewFile({ id: file.id, originalName: file.displayName || file.originalName })} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    {file.displayName ?? file.originalName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {supplementaryFiles.length > 0 && (
        <div className="max-w-2xl space-y-2 rounded-md border border-info/40 bg-info/10 px-4 py-3 text-sm">
          <p className="font-medium text-info">Chuyên viên đã thêm tiêu chí bổ sung. Vui lòng nhập minh chứng cho tiêu chí bổ sung.</p>
          <div className="space-y-1">
            <span className="text-muted-foreground">File đính kèm yêu cầu bổ sung:</span>
            <div className="flex flex-wrap gap-2">
              {supplementaryFiles.map(({ file, criteriaName }) => (
                <button key={file.id} type="button" onClick={() => setPreviewFile({ id: file.id, originalName: file.displayName || file.originalName })} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  {file.displayName ?? file.originalName}
                  {criteriaName && <span className="text-muted-foreground">· {criteriaName}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <LocalityScoreTable
        ref={scoreTableRef}
        criteria={detailTable.criteria}
        record={record}
        evidence={evidence}
        localityId={localityId}
        editable={editable}
        nowMs={currentTimeMs}
        draftValues={draftResults}
        selectedCriterionId={selected?.criterion?.id}
        specialistRevisionReasons={specialistRevisionReasons}
        editableCriteriaIds={revisionEditableCriteriaIds}
        uploading={savingAll}
        onSelect={(entry, criterion) => setSelected({ entry, criterion })}
        onDeleteEvidence={(evidenceId) => {
          if (!ensureSubmissionIsEditable()) return;
          const target = evidence.find((item) => item.id === evidenceId);
          if (target) setDeleteTarget(target);
        }}
        toolbar={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={!selected} disabledReason="Chọn một tiêu chí để xem chi tiết." onClick={() => setDetailOpen(true)}><Eye className="size-4" />Xem chi tiết</Button>
            <Button variant="outline" disabled={!selected} disabledReason="Chọn một tiêu chí để xem minh chứng." onClick={() => selected && setViewing(selected)}><FileText className="size-4" />Xem minh chứng</Button>
            <Button variant="destructive" disabled={!editable || !selected || selectedCriterionDeadlineExpired} disabledReason={!isTrustedTimeReady ? 'Đang đồng bộ thời gian chuẩn.' : submissionLockedReason ?? (parentDeadlineExpired || selectedCriterionDeadlineExpired ? 'Đã quá hạn nộp, không thể xóa minh chứng.' : !selected ? 'Chọn một tiêu chí để xóa minh chứng.' : 'Hồ sơ hiện không cho phép chỉnh sửa.')} onClick={() => requireSelection(() => { const target = filesFor(selected?.entry.criteriaId)[0]; if (target) setDeleteTarget(target); else toast.info('Tiêu chí chưa có minh chứng để xóa.'); })}><Trash2 className="size-4" />Xóa minh chứng</Button>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button disabled={!editable || savingAll} disabledReason={savingAll ? 'Đang lưu dữ liệu.' : !isTrustedTimeReady ? 'Đang đồng bộ thời gian chuẩn.' : submissionLockedReason ?? (parentDeadlineExpired ? 'Đã quá hạn nộp.' : 'Hồ sơ hiện không cho phép chỉnh sửa.')} onClick={() => void handleSaveAll()}><Save className="size-4" />{savingAll ? 'Đang lưu' : 'Lưu tất cả'}</Button>
              <Button disabled={savingAll || !canSubmit} disabledReason={savingAll ? 'Đang lưu dữ liệu.' : !isTrustedTimeReady ? 'Đang đồng bộ thời gian chuẩn.' : submissionLockedReason ?? (parentDeadlineExpired ? 'Đã quá hạn nộp.' : 'Hồ sơ hiện chưa sẵn sàng để gửi.')} onClick={openSubmitDialog}><Send className="size-4" />Gửi yêu cầu</Button>
            </div>
          </div>
        )}
      />

      <FormDialog open={decisionOpen} onOpenChange={setDecisionOpen} title="Quyết định" description="File đính kèm của nhóm tiêu chí" onSubmit={(event) => { event.preventDefault(); setDecisionOpen(false); }} submitLabel="Đóng" cancelLabel="Đóng" hideCancel size="max-w-md sm:max-w-md">
        <ul className="space-y-2">
          {decisionFiles.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <TruncatedText as="p" value={file.displayName || file.originalName} className="text-sm font-medium" />
                <p className="text-xs text-muted-foreground">{file.sizeBytes ? `${Math.ceil(file.sizeBytes / 1024)} KB` : 'Tệp đính kèm'} · {formatDate(file.createdAt)}</p>
              </div>
              <Button variant="ghost" size="icon-xs" title="Xem file" onClick={() => { setDecisionOpen(false); setPreviewFile({ id: file.id, originalName: file.displayName || file.originalName }); }}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-xs" title="Tải file về máy" onClick={() => void downloadFile(file.id, file.displayName || file.originalName)}>
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </FormDialog>
      <LocalityCriteriaHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} submission={submissionDetailQuery.data ?? submission} groupName={detailTable.name} />
      <FilePreviewDialog file={previewFile} onOpenChange={(isOpen) => { if (!isOpen) setPreviewFile(null); }} />
      <CriterionDetailDialog open={detailOpen && Boolean(selected)} onOpenChange={(open) => setDetailOpen(open)} item={selected} evidence={filesFor(selected?.entry.criteriaId)} onPreview={(file) => setPreviewFile({ id: file.id, originalName: file.fileName })} />
      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Xóa minh chứng" description={`Bạn có chắc muốn xóa “${deleteTarget?.fileName ?? ''}”?`} confirmLabel="Tiếp tục" cancelLabel="Đóng" variant="destructive" onConfirm={() => {
        if (!deleteTarget || !ensureSubmissionIsEditable()) return;
        deleteFileMutation.mutate(deleteTarget.id);
      }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} title="Gửi yêu cầu" description="Gửi hồ sơ tự đánh giá này lên Chuyên viên cấp thành phố?" confirmLabel="Tiếp tục" cancelLabel="Đóng" action="submit" state="DRAFT" onConfirm={handleSubmitResults} />
    </div>
  );
}
