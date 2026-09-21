import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, FileText, History, MessageSquareWarning, Save, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, EmptyState, PageHeader, PageLoading, TableColumnVisibility } from '@/components/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ForwardSubmissionDialog, ReviewScoreModal } from '@/features/workflow/components';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
import { specialistApi, type SubmissionResultItem } from '@/features/cham-diem/api/specialistApi';

const LEADER_STAGE = 'SpecialistApproved' as const;

function getLocalityCode(localityId: string) {
  return localityId.startsWith('loc-') ? localityId.slice(4) : localityId;
}
function sumResults(results: SubmissionResultItem[], selector: (result: SubmissionResultItem) => number) {
  return results.reduce((total, result) => total + selector(result), 0);
}
function ScoreBox({ label, value, maximum }: { label: string; value: number | null; maximum: number }) {
  return <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/40 px-3 py-2.5"><p className="break-words text-xs text-muted-foreground">{label}</p>{value === null ? <p className="mt-1 text-xs font-medium text-muted-foreground">Chưa chấm</p> : <p className="mt-1 whitespace-nowrap font-semibold tabular-nums">{value}<span className="ml-1 text-xs font-normal text-muted-foreground">/ {maximum}</span></p>}</div>;
}

interface LeaderScoreDraft {
  point: number;
  bonusPoint: number;
  reason: string;
}

export default function BanLeaderReviewDetailPage() {
  const { banId = 'ban1', tableId, localityId } = useParams<{ banId?: string; tableId?: string; localityId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string | null>(null);
  const [scoreEditOpen, setScoreEditOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, LeaderScoreDraft>>({});
  const [savedDraftIds, setSavedDraftIds] = useState<Set<string>>(() => new Set());
  const [savingAll, setSavingAll] = useState(false);

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
      return result.items.find((submission) => (submission.createdByWardCode ?? submission.createdBy ?? '') === localityCode) ?? null;
    },
    enabled: Boolean(tableId && localityCode),
  });
  const submissionDetailQuery = useQuery({
    queryKey: ['leader-submission-detail', submissionsQuery.data?.id],
    queryFn: () => specialistApi.getSubmission(submissionsQuery.data!.id),
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
  const canProcess = submission.currentStage === LEADER_STAGE;
  const selectedResultItem = resultItems.find(({ criterion }) => criterion.id === selectedCriteriaId);
  const selectedCriterion = selectedResultItem?.criterion;

  // API hiện chỉ trả officialPoint của Chuyên viên. Không dùng nó làm điểm Lãnh đạo.
  // Điểm Lãnh đạo chỉ hiển thị khi người dùng đã nhập ở phiên làm việc này.
  const leaderScoreFor = (result?: SubmissionResultItem) => (result ? drafts[result.id] : undefined);

  const copyProposedScores = () => {
    if (!canProcess) {
      toast.info('Hồ sơ đã chuyển bước nên không thể cập nhật điểm Lãnh đạo.');
      return;
    }
    const nextDrafts: Record<string, LeaderScoreDraft> = {};
    for (const { criterion, result } of resultItems) {
      if (!result || criterion.type === 'Supplementary') continue;
      nextDrafts[result.id] = { point: result.point, bonusPoint: result.bonusPoint, reason: '' };
    }
    setDrafts((current) => ({ ...current, ...nextDrafts }));
    setSavedDraftIds(new Set());
    toast.success('Đã sao chép toàn bộ điểm đề xuất sang điểm Lãnh đạo chấm.');
  };

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

  const saveAllScores = async (notifyWhenEmpty = true) => {
    if (!validateLeaderDrafts()) return false;
    const dirtyItems = resultItems.flatMap(({ result }) => {
      if (!result || !drafts[result.id] || savedDraftIds.has(result.id)) return [];
      const draft = drafts[result.id];
      return [{ submissionResultId: result.id, point: draft.point, bonusPoint: draft.bonusPoint, reason: draft.reason || null }];
    });
    if (!dirtyItems.length) {
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

  const approve = async ({ explanation }: { explanation: string }) => {
    try {
      const requiredItems = resultItems.filter(({ criterion }) => criterion.type !== 'Supplementary');
      const incompleteItem = requiredItems.find(({ result }) => !result || !drafts[result.id]);
      if (incompleteItem) {
        setSelectedCriteriaId(incompleteItem.criterion.id);
        throw new Error('Vui lòng chấm đủ điểm và điểm thưởng cho tất cả tiêu chí trước khi trình Hội đồng.');
      }
      if (!await saveAllScores(false)) throw new Error('Chưa thể lưu điểm Lãnh đạo trước khi chuyển hồ sơ.');
      const response = await specialistApi.approveSubmission(submission.id, explanation || 'Lãnh đạo ban đã thẩm định và duyệt hồ sơ.');
      if (!response.processed) throw new Error('API chưa xử lý duyệt hồ sơ.');
      const updatedSubmission = await specialistApi.getSubmission(submission.id);
      if (updatedSubmission.currentStage !== 'LeaderApproved') {
        throw new Error(`Trạng thái sau khi duyệt không hợp lệ: ${updatedSubmission.currentStage}.`);
      }
      await queryClient.invalidateQueries({ queryKey: ['leader-submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['leader-submissions-by-group'] });
      toast.success('Đã duyệt và trình hồ sơ lên Hội đồng.');
      navigate(backToList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể duyệt hồ sơ.');
      throw error;
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

    <section className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card [&_a]:min-w-0 [&_a]:break-all [&_p]:break-words [&_table]:min-w-[1680px] [&_table]:table-fixed [&_td]:min-w-0 [&_td]:whitespace-normal">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-5"><div><p className="flex items-center gap-2 text-base font-semibold"><FileText className="size-4 text-primary" />Chi tiết tiêu chí con</p><p className="mt-1 text-sm text-muted-foreground">Đối chiếu điểm đề xuất, điểm chuyên viên chấm và minh chứng trước khi phê duyệt.</p></div><span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">{criteria.length} tiêu chí</span></div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-card/95 px-4 py-3 sm:px-5">
        <TableColumnVisibility storageKey="leader-review-detail" columns={[{ id: 'criterion', label: 'Tiêu chí con' }, { id: 'evidence', label: 'Minh chứng' }, { id: 'proposed', label: 'Địa phương đề xuất' }, { id: 'specialist', label: 'Chuyên viên chấm' }, { id: 'leader', label: 'Lãnh đạo chấm' }, { id: 'explanation', label: 'Nội dung diễn giải' }]} />
        <Button variant="outline" disabled={!canProcess || resultItems.length === 0} disabledReason={!canProcess ? 'Hồ sơ đã chuyển bước nên không thể cập nhật điểm.' : 'Nhóm tiêu chí chưa có tiêu chí con.'} onClick={copyProposedScores}><Sparkles className="mr-1.5 size-4" />Cho điểm theo đề xuất</Button>
        {selectedResultItem?.result && selectedResultItem.criterion.type !== 'Supplementary' && <Button variant="outline" disabled={!canProcess} onClick={() => setScoreEditOpen(true)}><Edit3 className="mr-1.5 size-4" />Sửa điểm</Button>}
        <Button variant="outline" disabled={!canProcess || savingAll} disabledReason={!canProcess ? 'Hồ sơ đã chuyển bước nên không thể lưu điểm.' : undefined} onClick={() => { void saveAllScores(); }}><Save className="mr-1.5 size-4" />{savingAll ? 'Đang lưu…' : 'Lưu tất cả'}</Button>
        {selectedCriterion && <Button variant="outline" disabled={!canProcess} disabledReason={!canProcess ? 'Hồ sơ đã chuyển bước nên không thể yêu cầu chỉnh sửa.' : undefined} onClick={() => setRevisionOpen(true)}><MessageSquareWarning className="mr-1.5 size-4" />Yêu cầu chỉnh sửa</Button>}<Button disabled={!canProcess || savingAll} onClick={() => setApproveOpen(true)}><Send className="mr-1.5 size-4" />Duyệt &amp; trình Hội đồng</Button>
      </div>
      <div className="overflow-x-auto"><Table data-column-visibility-table="leader-review-detail" className="min-w-[1380px] table-fixed"><colgroup><col className="w-[21%]" /><col className="w-[13%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[18%]" /></colgroup><TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Minh chứng</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Địa phương đề xuất</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Chuyên viên chấm</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Lãnh đạo chấm</TableHead><TableHead className="bg-primary px-4 py-3 text-primary-foreground">Nội dung diễn giải</TableHead></TableRow></TableHeader><TableBody>
        {resultItems.map(({ criterion, result }) => { const leader = leaderScoreFor(result); return <TableRow key={criterion.id} aria-selected={selectedCriteriaId === criterion.id} onClick={() => setSelectedCriteriaId(criterion.id)} className={selectedCriteriaId === criterion.id ? 'cursor-pointer align-top bg-primary/[0.055] shadow-[inset_3px_0_0_#A8202C] hover:bg-primary/[0.07]' : 'cursor-pointer align-top hover:bg-muted/60'}><TableCell className="border-r border-primary/15 px-4 py-5"><p title={criterion.content} className="line-clamp-4 font-semibold leading-5">{criterion.content}</p></TableCell><TableCell className="border-r border-primary/15 px-4 py-5">{result?.files.length ? <div className="space-y-1">{result.files.map((file) => file.url ? <a key={file.id} href={file.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex items-center gap-1 text-sm text-primary hover:underline"><FileText className="size-4" />{file.originalName}</a> : <p key={file.id} className="flex items-center gap-1 text-sm text-muted-foreground"><FileText className="size-4" />{file.originalName}</p>)}</div> : <span className="text-xs text-muted-foreground">Chưa có minh chứng</span>}</TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreBox label="Điểm" value={result?.point ?? 0} maximum={criterion.maxPoint} /><ScoreBox label="Điểm thưởng" value={result?.bonusPoint ?? 0} maximum={criterion.maxBonusPoint} /></div></TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreBox label="Điểm" value={result?.officialPoint ?? result?.point ?? 0} maximum={criterion.maxPoint} /><ScoreBox label="Điểm thưởng" value={result?.officialBonusPoint ?? result?.bonusPoint ?? 0} maximum={criterion.maxBonusPoint} /></div></TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreBox label="Điểm" value={leader?.point ?? null} maximum={criterion.maxPoint} /><ScoreBox label="Điểm thưởng" value={leader?.bonusPoint ?? null} maximum={criterion.maxBonusPoint} /></div></TableCell><TableCell className="px-4 py-5 text-sm leading-6 text-muted-foreground">{result?.explanation || '—'}{leader?.reason && <p className="mt-2 border-t border-border pt-2"><span className="font-medium text-foreground">Lý do Lãnh đạo sửa điểm:</span> {leader.reason}</p>}</TableCell></TableRow>; })}
        {!resultItems.length && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}
      </TableBody></Table></div>
    </section>

    <ReviewScoreModal
      open={scoreEditOpen}
      onOpenChange={setScoreEditOpen}
      criterionName={selectedResultItem?.criterion.content}
      maxScoreOverride={selectedResultItem?.criterion.maxPoint}
      maxBonusOverride={selectedResultItem?.criterion.maxBonusPoint}
      referenceLabel="Điểm Chuyên viên chấm"
      referenceScore={selectedResultItem?.result?.officialPoint ?? selectedResultItem?.result?.point ?? 0}
      referenceBonusScore={selectedResultItem?.result?.officialBonusPoint ?? selectedResultItem?.result?.bonusPoint ?? 0}
      initialScore={selectedResultItem?.result ? leaderScoreFor(selectedResultItem.result)?.point : undefined}
      initialBonusScore={selectedResultItem?.result ? leaderScoreFor(selectedResultItem.result)?.bonusPoint : undefined}
      initialReason={selectedResultItem?.result ? leaderScoreFor(selectedResultItem.result)?.reason : undefined}
      title="Sửa điểm Lãnh đạo ban"
      onSave={({ score, bonusScore, reason }) => {
        const result = selectedResultItem?.result;
        if (!result) return false;
        setDrafts((current) => ({ ...current, [result.id]: { point: score, bonusPoint: bonusScore, reason: reason ?? '' } }));
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
    <ForwardSubmissionDialog
      open={approveOpen}
      onOpenChange={setApproveOpen}
      localityName={localityName}
      groupName={groupQuery.data.name}
      submissionId={submission.id}
      targetLabel="Hội đồng Thi đua - Khen thưởng"
      explanationLabel="Diễn giải hồ sơ từ Lãnh đạo ban"
      onConfirm={approve}
    />
  </div>;
}
