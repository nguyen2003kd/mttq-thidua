import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Eye, FileText, History, MessageSquareWarning, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, EmptyState, FilePreviewDialog, PageHeader, PageLoading, TableColumnVisibility } from '@/components/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ForwardingDocumentsDialog, OfficialScoreRevisionDialog, ReviewScoreModal } from '@/features/workflow/components';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
import { isRealSubmission, specialistApi, type SubmissionResultItem } from '@/features/cham-diem/api/specialistApi';
import { filesApi } from '@/features/files/api/filesApi';

const LEADER_STAGE = 'SpecialistApproved' as const;

function getLocalityCode(localityId: string) {
  return localityId.startsWith('loc-') ? localityId.slice(4) : localityId;
}
function sumResults(results: SubmissionResultItem[], selector: (result: SubmissionResultItem) => number) {
  return results.reduce((total, result) => total + selector(result), 0);
}

function ScoreBox({ label, value, maximum }: { label: string; value: number | null | undefined; maximum: number }) {
  return <div className="min-w-0 rounded-md border border-border bg-muted/40 px-3 py-2.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-right font-semibold tabular-nums">{value ?? '—'}<span className="ml-0.5 text-xs font-medium text-success">/{maximum}</span></p></div>;
}

type PreviewableFile = { id: string; displayName?: string | null; originalName?: string | null };

interface LeaderScoreDraft {
  point: number;
  bonusPoint: number;
  reason: string;
}

function LeaderCriterionDetailDialog({
  open,
  onOpenChange,
  item,
  onEdit,
  editDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { criterion: { content: string; maxPoint: number; maxBonusPoint: number; type: string }; result?: SubmissionResultItem; leader?: LeaderScoreDraft } | undefined;
  onEdit: () => void;
  editDisabled: boolean;
}) {
  if (!item) return null;
  const { criterion, result, leader } = item;
  const fields = [
    ['Điểm đề xuất', String(result?.point ?? 0)],
    ['Điểm thưởng đề xuất', String(result?.bonusPoint ?? 0)],
    ['Điểm tối đa được đề xuất', String(criterion.maxPoint)],
    ['Điểm thưởng tối đa được đề xuất', String(criterion.maxBonusPoint)],
  ];

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
      <DialogHeader className="border-b border-border bg-muted/25 px-6 py-5 pr-12">
        <DialogTitle>Chi tiết tiêu chí con</DialogTitle>
        <DialogDescription>Đối chiếu kết quả chấm điểm trước khi phê duyệt.</DialogDescription>
      </DialogHeader>
      <div className="space-y-5 px-6 py-5">
        <div><p className="text-xs font-medium text-muted-foreground">Nội dung tiêu chí</p><p className="mt-1.5 text-sm font-semibold leading-6 text-foreground">{criterion.content}</p></div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-3 sm:[&>*:nth-child(-n+3)]:border-t-0 sm:[&>*:nth-child(3n+1)]:border-l-0">
          {fields.map(([label, value]) => <div key={label} className="min-w-0 px-3 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground">{value}</p></div>)}
        </div>
        <div><p className="text-xs font-medium text-muted-foreground">Nội dung diễn giải</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{result?.explanation || 'Chưa có diễn giải.'}</p></div>
        {result?.officialReason && <div><p className="text-xs font-medium text-muted-foreground">Lý do sửa điểm của Chuyên viên</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{result.officialReason}</p></div>}
        {leader?.reason && <div><p className="text-xs font-medium text-muted-foreground">Lý do Lãnh đạo sửa điểm</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{leader.reason}</p></div>}
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3"><p className="text-sm font-medium text-foreground">Minh chứng đã nộp</p><p className="mt-0.5 text-xs text-muted-foreground">{result?.files.length ?? 0} file đính kèm</p>{result?.files.length ? <div className="mt-3 space-y-2">{result.files.map((file) => file.url ? <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><FileText className="size-4 shrink-0" />{file.originalName}</a> : <p key={file.id} className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="size-4 shrink-0" />{file.originalName}</p>)}</div> : null}</div>
      </div>
      <DialogFooter className="mx-0 mb-0 border-t border-border px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>{criterion.type !== 'Supplementary' && <Button type="button" disabled={editDisabled} disabledReason={editDisabled ? 'Hồ sơ đã chuyển bước nên không thể cập nhật điểm.' : undefined} onClick={onEdit}><Edit3 className="size-4" />Sửa điểm</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>;
}

export default function BanLeaderReviewDetailPage() {
  const { banId = 'ban1', tableId, localityId } = useParams<{ banId?: string; tableId?: string; localityId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string | null>(null);
  const [criterionDetailOpen, setCriterionDetailOpen] = useState(false);
  const [scoreEditOpen, setScoreEditOpen] = useState(false);
  const [scoreRevisionResult, setScoreRevisionResult] = useState<SubmissionResultItem | null>(null);
  const [drafts, setDrafts] = useState<Record<string, LeaderScoreDraft>>({});
  const [pendingAttachments, setPendingAttachments] = useState<Record<string, File>>({});
  const [savedDraftIds, setSavedDraftIds] = useState<Set<string>>(() => new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  const localityCode = localityId ? getLocalityCode(localityId) : '';
  const groupQuery = useQuery({
    queryKey: ['leader-criteria-group-detail', tableId],
    queryFn: () => specialistApi.getCriteriaGroup(tableId!),
    enabled: Boolean(tableId),
  });
  const submissionsQuery = useQuery({
    queryKey: ['leader-submissions-by-group', tableId, localityCode],
    queryFn: async () => {
      const result = await specialistApi.listSubmissionsByGroup(tableId!, { stage: LEADER_STAGE, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      return result.items.filter(isRealSubmission).find((submission) => (submission.createdByWardCode ?? submission.createdBy ?? '') === localityCode) ?? null;
    },
    enabled: Boolean(tableId && localityCode),
  });
  const submissionDetailQuery = useQuery({
    queryKey: ['leader-submission-detail', submissionsQuery.data?.id],
    queryFn: async () => {
      const data = await specialistApi.getSubmission(submissionsQuery.data!.id);
      return isRealSubmission(data) ? data : null;
    },
    enabled: Boolean(submissionsQuery.data?.id),
  });
  const approvalHistoriesQuery = useQuery({
    queryKey: ['leader-approval-histories', submissionsQuery.data?.id],
    queryFn: () => specialistApi.listApprovalHistories(submissionsQuery.data!.id, { action: 'Approve', page: 1, pageSize: 100 }),
    enabled: Boolean(submissionsQuery.data?.id),
  });
  const legacySpecialistForwardingFilesQuery = useQuery({
    queryKey: ['leader-legacy-specialist-forwarding-files', submissionsQuery.data?.id],
    queryFn: () => filesApi.list({ entityType: 'Submission', entityId: submissionsQuery.data!.id, category: 'SpecialistForwarding', page: 1, pageSize: 50 }),
    enabled: Boolean(submissionsQuery.data?.id),
  });

  const submission = submissionDetailQuery.data ?? submissionsQuery.data;
  const resultsByCriteria = useMemo(() => new Map((submission?.results ?? []).map((result) => [result.criteriaId, result])), [submission]);
  const criteria = useMemo(() => (groupQuery.data?.criteria ?? [])
    .filter((criterion) => criterion.type !== 'Supplementary' || criterion.targetSubmissionId === submission?.id), [groupQuery.data, submission?.id]);
  const backToGroups = `/thi-dua/duyet/lanh-dao-ban/${banId}/${localityId}`;
  const backToList = `/thi-dua/duyet/lanh-dao-ban/${banId}`;
  const isLoading = groupQuery.isLoading || submissionsQuery.isLoading || submissionDetailQuery.isLoading;
  const isError = groupQuery.isError || submissionsQuery.isError || submissionDetailQuery.isError;

  if (!tableId || !localityId) return <EmptyState title="Không tìm thấy hồ sơ" description="Thiếu mã nhóm tiêu chí hoặc địa phương." />;
  if (isLoading) return <PageLoading label="Đang tải chi tiết chấm điểm…" />;
  if (isError) return <EmptyState variant="error" title="Không tải được chi tiết hồ sơ" description="Vui lòng thử lại sau." />;
  if (!groupQuery.data || !submission) return <EmptyState title="Không tìm thấy hồ sơ" description="Submission không tồn tại hoặc không còn ở trạng thái SpecialistApproved." />;

  const resultItems = criteria.map((criterion) => ({ criterion, result: resultsByCriteria.get(criterion.id) }));
  const proposedScore = sumResults(submission.results, (result) => result.point);
  const specialistScore = sumResults(submission.results, (result) => result.officialPoint ?? result.point);
  const specialistBonus = sumResults(submission.results, (result) => result.officialBonusPoint ?? result.bonusPoint);
  const maximumScore = criteria.reduce((total, criterion) => total + criterion.maxPoint, 0);
  const maximumBonus = criteria.reduce((total, criterion) => total + criterion.maxBonusPoint, 0);
  const localityName = submission.localityFullName ?? submission.createdByUsername ?? localityCode;
  const specialistForwarding = (approvalHistoriesQuery.data?.items ?? [])
    .find((history) => history.stageLevel === 'LocalSubmitted');
  const specialistForwardingFiles = specialistForwarding?.files?.length
    ? specialistForwarding.files
    : (legacySpecialistForwardingFilesQuery.data?.items ?? []);
  const canProcess = submission.currentStage === LEADER_STAGE;
  const selectedResultItem = resultItems.find(({ criterion }) => criterion.id === selectedCriteriaId);
  const selectedCriterion = selectedResultItem?.criterion;

  // API hiện chỉ trả officialPoint của Chuyên viên. Không dùng nó làm điểm Lãnh đạo.
  // Điểm Lãnh đạo chỉ hiển thị khi người dùng đã nhập ở phiên làm việc này.
  const leaderScoreFor = (result?: SubmissionResultItem) => (result ? drafts[result.id] : undefined);

  const validateLeaderDrafts = () => {
    for (const { criterion, result } of resultItems) {
      if (criterion.type === 'Supplementary' || !result) continue;
      const draft = drafts[result.id];
      if (!draft) continue;
      if (!Number.isFinite(draft.point) || draft.point < 0 || draft.point > criterion.maxPoint) {
        toast.error(`Điểm Lãnh đạo phải từ 0 đến ${criterion.maxPoint}.`, { description: criterion.content });
        setSelectedCriteriaId(criterion.id);
        return false;
      }
      if (!Number.isFinite(draft.bonusPoint) || draft.bonusPoint < 0 || draft.bonusPoint > criterion.maxBonusPoint) {
        toast.error(`Điểm thưởng Lãnh đạo phải từ 0 đến ${criterion.maxBonusPoint}.`, { description: criterion.content });
        setSelectedCriteriaId(criterion.id);
        return false;
      }
      const referencePoint = result.officialPoint ?? result.point;
      const referenceBonus = result.officialBonusPoint ?? result.bonusPoint;
      const changed = draft.point !== referencePoint || draft.bonusPoint !== referenceBonus;
      if (changed && !draft.reason.trim()) {
        toast.error('Vui lòng nhập lý do khi điểm Lãnh đạo khác điểm Chuyên viên.', { description: criterion.content });
        setSelectedCriteriaId(criterion.id);
        return false;
      }
    }
    return true;
  };

  const uploadPendingLeaderAttachments = async () => {
    const pending = Object.entries(pendingAttachments);
    if (pending.length === 0) return;

    const uploadedIds: string[] = [];
    const failedFiles: string[] = [];
    for (const [resultId, file] of pending) {
      const result = resultItems.find((item) => item.result?.id === resultId)?.result;
      if (!result) {
        failedFiles.push(file.name);
        continue;
      }
      try {
        await filesApi.upload(file, { displayName: file.name, entityType: 'SubmissionResult', entityId: result.id, category: 'LeaderScoring' });
        uploadedIds.push(resultId);
      } catch {
        failedFiles.push(file.name);
      }
    }

    if (uploadedIds.length > 0) {
      setPendingAttachments((current) => {
        const next = { ...current };
        uploadedIds.forEach((resultId) => delete next[resultId]);
        return next;
      });
    }
    if (failedFiles.length > 0) toast.warning(`Điểm đã được lưu nhưng ${failedFiles.length} tệp Lãnh đạo chưa tải lên được.`);
  };

  const saveAllScores = async (notifyWhenEmpty = true) => {
    if (!validateLeaderDrafts()) return false;
    const dirtyItems = resultItems.flatMap(({ result }) => {
      if (!result || !drafts[result.id] || savedDraftIds.has(result.id)) return [];
      const draft = drafts[result.id];
      return [{ submissionResultId: result.id, point: draft.point, bonusPoint: draft.bonusPoint, reason: draft.reason || null }];
    });
    if (!dirtyItems.length) {
      if (Object.keys(pendingAttachments).length > 0) {
        setSavingAll(true);
        try {
          await uploadPendingLeaderAttachments();
          return true;
        } finally {
          setSavingAll(false);
        }
      }
      const requiredItems = resultItems.filter(({ criterion }) => criterion.type !== 'Supplementary');
      const alreadySaved = requiredItems.length > 0 && requiredItems.every(({ result }) => result && savedDraftIds.has(result.id));
      if (alreadySaved) return true;
      if (notifyWhenEmpty) toast.info('Chưa có điểm Lãnh đạo mới để lưu.');
      return false;
    }

    setSavingAll(true);
    try {
      const response = await specialistApi.updateScores({
        submissionId: submission.id,
        reason: dirtyItems.map((item) => item.reason).filter(Boolean).join('\n') || 'Lãnh đạo ban cập nhật điểm thẩm định.',
        scoreItems: dirtyItems,
      });
      if (!response.processed) throw new Error('API chưa xử lý lưu điểm.');
      await uploadPendingLeaderAttachments();
      setSavedDraftIds((current) => new Set([...current, ...dirtyItems.map((item) => item.submissionResultId)]));
      await queryClient.invalidateQueries({ queryKey: ['leader-submission-detail', submission.id] });
      await queryClient.invalidateQueries({ queryKey: ['leader-submissions'] });
      toast.success('Đã lưu tất cả điểm Lãnh đạo.');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu điểm Lãnh đạo.');
      return false;
    } finally {
      setSavingAll(false);
    }
  };

  const requestRevision = async ({ reason, file }: { reason: string; file: File | null }) => {
    if (!selectedCriterion) {
      toast.info('Vui lòng chọn tiêu chí con cần yêu cầu chỉnh sửa.');
      return;
    }
    try {
      const criterionReason = `Tiêu chí con: ${selectedCriterion.content}\n\n${reason}`;
      const reasonWithFile = file ? `${criterionReason}\n\nTập tin đính kèm: ${file.name}` : criterionReason;
      await specialistApi.requestRevision({ submissionId: submission.id, reason: reasonWithFile });
      await queryClient.invalidateQueries({ queryKey: ['leader-submissions'] });
      toast.success('Đã gửi yêu cầu chuyên viên bổ sung hồ sơ.');
      navigate(backToList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi yêu cầu chỉnh sửa.');
    }
  };

  return <div className="mx-auto flex min-h-full w-full max-w-[1480px] flex-col gap-5 pb-6">
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><Link to={backToList} className="hover:text-primary">Danh sách địa phương</Link><span>/</span><Link to={backToGroups} className="hover:text-primary">{localityName}</Link><span>/</span><span className="font-medium text-foreground">{groupQuery.data.name}</span></nav>
    <PageHeader title="Chi tiết chấm điểm kết quả tiêu chí" description={`${localityName} · ${groupQuery.data.name}`} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link to={`${backToList}/lich-su`} />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử</Button><Button variant="outline" render={<Link to={backToGroups} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại nhóm tiêu chí</Button></div>} />

    <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Tóm tắt hồ sơ chấm điểm"><div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
      <div className="bg-card px-4 py-3.5 sm:col-span-2 xl:col-span-1"><p className="text-xs font-medium text-muted-foreground">Địa phương</p><p className="mt-1 truncate text-sm font-semibold">{localityName}</p></div>
      <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Trạng thái</p><p className="mt-1 font-semibold text-primary">Chuyên viên đã duyệt</p></div>
      <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Đã chấm</p><p className="mt-1 text-base font-semibold tabular-nums">{resultItems.filter(({ result }) => result).length}<span className="text-sm font-normal text-muted-foreground"> / {criteria.length} tiêu chí</span></p></div>
      <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Điểm đề xuất</p><p className="mt-1 text-base font-semibold tabular-nums">{proposedScore}<span className="text-sm font-normal text-success"> / {maximumScore}</span></p></div>
      <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Điểm chuyên viên</p><p className="mt-1 text-base font-semibold tabular-nums">{specialistScore}<span className="text-sm font-normal text-success"> / {maximumScore}</span></p></div>
      <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Điểm thưởng</p><p className="mt-1 text-base font-semibold tabular-nums">{specialistBonus}<span className="text-sm font-normal text-success"> / {maximumBonus}</span></p></div>
    </div></section>

    <section className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card [&_a]:min-w-0 [&_a]:break-all [&_p]:break-words [&_table]:min-w-[1440px] [&_table]:table-fixed [&_td]:min-w-0 [&_td]:whitespace-normal">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-5"><div><p className="flex items-center gap-2 text-base font-semibold"><FileText className="size-4 text-primary" />Chi tiết tiêu chí con</p><p className="mt-1 text-sm text-muted-foreground">Đối chiếu bằng chứng, điểm địa phương đề xuất, điểm chuyên viên chấm và nội dung diễn giải trước khi phê duyệt.</p></div><span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">{criteria.length} tiêu chí</span></div>
      {(specialistForwarding || specialistForwardingFiles.length > 0) && <div className="flex justify-end border-b border-border bg-card/95 px-4 py-3 sm:px-5"><ForwardingDocumentsDialog documents={[{ label: 'Hồ sơ Chuyên viên chuyển lên', explanationLabel: 'Diễn giải hồ sơ từ chuyên viên', explanation: specialistForwarding?.reason, files: specialistForwardingFiles }]} onPreview={setPreviewFile} /></div>}
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-card/95 px-4 py-3 sm:px-5">
        <TableColumnVisibility storageKey="leader-review-detail" columns={[{ id: 'criterion', label: 'Tiêu chí con' }, { id: 'evidence', label: 'Bằng chứng' }, { id: 'local-proposed', label: 'Điểm địa phương đề xuất' }, { id: 'specialist-score', label: 'Điểm chuyên viên chấm' }, { id: 'explanation', label: 'Nội dung diễn giải' }]} />
        <Button variant="outline" disabled={!selectedResultItem} disabledReason="Chọn một tiêu chí con để xem chi tiết." onClick={() => setCriterionDetailOpen(true)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>
        {selectedResultItem?.result && selectedResultItem.criterion.type !== 'Supplementary' && <Button variant="outline" disabled={!canProcess} onClick={() => setScoreEditOpen(true)}><Edit3 className="mr-1.5 size-4" />Sửa điểm</Button>}
        <Button variant="outline" disabled={!canProcess || savingAll} disabledReason={!canProcess ? 'Hồ sơ đã chuyển bước nên không thể lưu điểm.' : undefined} onClick={() => { void saveAllScores(); }}><Save className="mr-1.5 size-4" />{savingAll ? 'Đang lưu…' : 'Lưu tất cả'}</Button>
        {selectedCriterion && <Button variant="outline" disabled={!canProcess} disabledReason={!canProcess ? 'Hồ sơ đã chuyển bước nên không thể yêu cầu chỉnh sửa.' : undefined} onClick={() => setRevisionOpen(true)}><MessageSquareWarning className="mr-1.5 size-4" />Yêu cầu chỉnh sửa</Button>}
      </div>
      <div className="overflow-x-auto"><Table data-column-visibility-table="leader-review-detail" className="min-w-[1440px] table-fixed"><colgroup><col className="w-[23%]" /><col className="w-[16%]" /><col className="w-[19%]" /><col className="w-[19%]" /><col className="w-[23%]" /></colgroup><TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Bằng chứng</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Điểm địa phương đề xuất</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Điểm chuyên viên chấm</TableHead><TableHead className="bg-primary px-4 py-3 text-primary-foreground">Nội dung diễn giải</TableHead></TableRow></TableHeader><TableBody>
        {resultItems.map(({ criterion, result }) => {
          const revised = leaderScoreFor(result);
          return <TableRow key={criterion.id} aria-selected={selectedCriteriaId === criterion.id} onClick={() => setSelectedCriteriaId(criterion.id)} className={selectedCriteriaId === criterion.id ? 'cursor-pointer align-top bg-primary/[0.055] shadow-[inset_3px_0_0_#A8202C] hover:bg-primary/[0.07]' : 'cursor-pointer align-top hover:bg-muted/60'}>
            <TableCell className="border-r border-primary/15 px-4 py-5"><p title={criterion.content} className="line-clamp-4 font-semibold leading-5">{criterion.content}</p>{result && result.officialReason !== null && <Button type="button" variant="ghost" size="sm" className="mt-3 -ml-2 h-8 px-2 text-primary hover:bg-primary/5 hover:text-primary" onClick={(event) => { event.stopPropagation(); setScoreRevisionResult(result); }}><Eye className="size-4" />Xem điểm đã sửa</Button>}</TableCell>
            <TableCell className="border-r border-primary/15 px-4 py-5">{result?.files.length ? <div className="space-y-1">{result.files.map((file) => file.url ? <a key={file.id} href={file.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex items-center gap-1 text-sm text-primary hover:underline"><FileText className="size-4" />{file.originalName}</a> : <p key={file.id} className="flex items-center gap-1 text-sm text-muted-foreground"><FileText className="size-4" />{file.originalName}</p>)}</div> : <span className="text-xs text-muted-foreground">Chưa có bằng chứng</span>}</TableCell>
            <TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreBox label="Điểm" value={result?.point} maximum={criterion.maxPoint} /><ScoreBox label="Điểm thưởng" value={result?.bonusPoint} maximum={criterion.maxBonusPoint} /></div></TableCell>
            <TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreBox label="Điểm" value={revised?.point ?? result?.officialPoint ?? result?.point} maximum={criterion.maxPoint} /><ScoreBox label="Điểm thưởng" value={revised?.bonusPoint ?? result?.officialBonusPoint ?? result?.bonusPoint} maximum={criterion.maxBonusPoint} /></div></TableCell>
            <TableCell className="px-4 py-5 text-sm leading-6 text-muted-foreground"><p title={result?.explanation || '—'} className="line-clamp-4">{result?.explanation || '—'}</p></TableCell>
          </TableRow>;
        })}
        {!resultItems.length && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}
      </TableBody></Table></div>
    </section>

    <LeaderCriterionDetailDialog
      open={criterionDetailOpen}
      onOpenChange={setCriterionDetailOpen}
      item={selectedResultItem ? { criterion: selectedResultItem.criterion, result: selectedResultItem.result, leader: leaderScoreFor(selectedResultItem.result) } : undefined}
      editDisabled={!canProcess}
      onEdit={() => { setCriterionDetailOpen(false); setScoreEditOpen(true); }}
    />
    <OfficialScoreRevisionDialog open={Boolean(scoreRevisionResult)} onOpenChange={(open) => { if (!open) setScoreRevisionResult(null); }} result={scoreRevisionResult} criterionLabel={scoreRevisionResult?.criteriaContent ?? selectedResultItem?.criterion.content ?? 'Tiêu chí con'} />

    <ReviewScoreModal
      open={scoreEditOpen}
      onOpenChange={setScoreEditOpen}
      criterionName={selectedResultItem?.criterion.content}
      maxScoreOverride={selectedResultItem?.criterion.maxPoint}
      maxBonusOverride={selectedResultItem?.criterion.maxBonusPoint}
      referenceLabel="Điểm Chuyên viên đang chấm"
      referenceScore={selectedResultItem?.result?.officialPoint ?? selectedResultItem?.result?.point ?? 0}
      referenceBonusScore={selectedResultItem?.result?.officialBonusPoint ?? selectedResultItem?.result?.bonusPoint ?? 0}
      initialScore={selectedResultItem?.result ? leaderScoreFor(selectedResultItem.result)?.point ?? selectedResultItem.result.officialPoint ?? selectedResultItem.result.point : undefined}
      initialBonusScore={selectedResultItem?.result ? leaderScoreFor(selectedResultItem.result)?.bonusPoint ?? selectedResultItem.result.officialBonusPoint ?? selectedResultItem.result.bonusPoint : undefined}
      initialReason={selectedResultItem?.result ? leaderScoreFor(selectedResultItem.result)?.reason ?? selectedResultItem.result.officialReason ?? undefined : undefined}
      enableAttachment
      initialAttachment={selectedResultItem?.result ? pendingAttachments[selectedResultItem.result.id] ?? null : null}
      title="Sửa điểm Chuyên viên chấm"
      onSave={({ score, bonusScore, reason, attachment }) => {
        const result = selectedResultItem?.result;
        if (!result) return false;
        setDrafts((current) => ({ ...current, [result.id]: { point: score, bonusPoint: bonusScore, reason: reason ?? '' } }));
        setPendingAttachments((current) => {
          const next = { ...current };
          if (attachment) next[result.id] = attachment;
          else delete next[result.id];
          return next;
        });
        setSavedDraftIds((current) => {
          const next = new Set(current);
          next.delete(result.id);
          return next;
        });
        return true;
      }}
    />
    <RequestSpecialistDialog
      open={revisionOpen && Boolean(selectedCriterion)}
      onOpenChange={setRevisionOpen}
      localityName={localityName}
      description={selectedCriterion ? `Yêu cầu Chuyên viên rà soát tiêu chí “${selectedCriterion.content}” của ${localityName}.` : undefined}
      onConfirm={requestRevision}
    />
    <FilePreviewDialog file={previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} />
  </div>;
}
