import { useMemo, useState } from 'react';
import { ArrowLeft, Download, Eye, FileText, History, MessageSquareWarning, Paperclip, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, ConfirmDialog, EmptyState, FilePreviewDialog, ListDialog, PageHeader, PageLoading, RejectDialog, TableColumnVisibility, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { specialistApi, type ApprovalHistoryApi, type SubmissionApi, type SubmissionResultFile, type SubmissionResultItem, type SubmissionStage } from '@/features/cham-diem/api/specialistApi';
import { downloadFile } from '@/features/files/api/filesApi';
import { OfficialScoreRevisionDialog } from '@/features/workflow/components';
import type { ScoreState } from '@/types/rbac';

type Reviewer = 'council' | 'committee';
type PreviewableFile = { id: string; displayName?: string | null; originalName?: string | null };

const REVIEWER_CONFIG: Record<Reviewer, {
  stage: SubmissionStage;
  state: ScoreState;
  label: string;
  listPath: string;
  historyPath: string;
  groupPath: (localityId: string) => string | null;
  description: string;
}> = {
  council: {
    stage: 'LeaderApproved', state: 'CHO_DUYET_HOI_DONG', label: 'Hội đồng thi đua',
    listPath: '/thi-dua/duyet/hoi-dong-tdkt', historyPath: '/hoi-dong/lich-su',
    groupPath: (localityId) => `/thi-dua/duyet/hoi-dong-tdkt/${localityId}`,
    description: 'Đối chiếu kết quả lãnh đạo ban đã duyệt trước khi xét duyệt hồ sơ.',
  },
  committee: {
    stage: 'CouncilApproved', state: 'CHO_DUYET_BTT', label: 'Ban thường trực',
    listPath: '/thi-dua/duyet/ban-thuong-truc', historyPath: '/uy-ban/lich-su', groupPath: () => null,
    description: 'Đối chiếu kết quả Hội đồng đã duyệt trước khi công bố kết quả.',
  },
};

function ScorePair({ point, bonus, maxPoint, maxBonus }: { point: number; bonus: number; maxPoint: number; maxBonus: number }) {
  return <div className="grid grid-cols-2 gap-2"><div className="rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{point}<span className="ml-1 text-xs font-medium text-success">/ {maxPoint}</span></p></div><div className="rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thưởng</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{bonus}<span className="ml-1 text-xs font-medium text-success">/ {maxBonus}</span></p></div></div>;
}

function ForwardingFilesSection({ specialistForwarding, leaderForwarding, onPreview }: { specialistForwarding?: ApprovalHistoryApi; leaderForwarding?: ApprovalHistoryApi; onPreview: (file: PreviewableFile) => void }) {
  const [open, setOpen] = useState(false);
  const groups = [
    { label: 'Hồ sơ Chuyên viên chuyển lên', explanationLabel: 'Diễn giải hồ sơ từ chuyên viên', history: specialistForwarding },
    { label: 'Hồ sơ Lãnh đạo ban chuyển lên', explanationLabel: 'Diễn giải hồ sơ từ lãnh đạo ban', history: leaderForwarding },
  ].filter((group) => group.history?.reason || group.history?.files.length);
  const total = groups.reduce((count, group) => count + (group.history?.files.length ?? 0), 0);
  if (groups.length === 0) return null;

  return <><div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setOpen(true)}><Paperclip className="size-4" />Xem hồ sơ chuyển cấp{total > 0 ? ` (${total} tệp)` : ''}</Button></div><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Hồ sơ đã chuyển cấp</DialogTitle><DialogDescription>Xem diễn giải và tệp đính kèm theo từng cấp chuyển hồ sơ.</DialogDescription></DialogHeader><div className="grid gap-3 md:grid-cols-2">{groups.map((group) => { const history = group.history!; return <section key={group.label} className="min-w-0 rounded-lg border border-primary/15 bg-primary/[0.03] p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-primary">{group.label}</h3>{history.files.length > 0 && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{history.files.length} tệp</span>}</div>{history.reason && <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">{group.explanationLabel}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{history.reason}</p></div>}{history.files.length > 0 && <div className="mt-4 space-y-2 border-t border-primary/15 pt-3">{history.files.map((file) => <button key={file.id} type="button" onClick={() => onPreview(file)} className="flex w-full min-w-0 items-center gap-2 rounded-md border border-primary/20 bg-card px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-primary/10"><FileText className="size-4 shrink-0" /><span className="min-w-0 break-all">{file.displayName || file.originalName}</span></button>)}</div>}</section>; })}</div></DialogContent></Dialog></>;
}

/** Lớp 3 dùng chung: Hội đồng/Ban thường trực xem hồ sơ trên trang, không dùng popup. */
export default function ReadOnlyApprovalDetailPage({ reviewer }: { reviewer: Reviewer }) {
  const { localityId, groupId } = useParams<{ localityId: string; groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [evidenceDialog, setEvidenceDialog] = useState<{ criterionName: string; files: SubmissionResultFile[] } | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [scoreRevisionResult, setScoreRevisionResult] = useState<SubmissionResultItem | null>(null);
  const config = REVIEWER_CONFIG[reviewer];
  const localityCode = localityId?.startsWith('loc-') ? localityId.slice(4) : localityId ?? '';
  const groupQuery = useQuery({ queryKey: ['approval-detail-group', groupId], queryFn: () => specialistApi.getCriteriaGroup(groupId!), enabled: Boolean(groupId) });
  const submissionsQuery = useQuery({ queryKey: ['approval-detail-submissions', reviewer, groupId, localityCode], queryFn: async () => { const page = await specialistApi.listSubmissionsByGroup(groupId!, { stage: config.stage, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }); return page.items.find((item) => (item.createdByWardCode ?? item.createdBy ?? '') === localityCode) ?? null; }, enabled: Boolean(groupId && localityCode) });
  const detailQuery = useQuery({ queryKey: ['approval-detail-submission', submissionsQuery.data?.id], queryFn: () => specialistApi.getSubmission(submissionsQuery.data!.id), enabled: Boolean(submissionsQuery.data?.id) });
  const approvalHistoriesQuery = useQuery({
    queryKey: ['approval-detail-forwarding-histories', submissionsQuery.data?.id],
    queryFn: () => specialistApi.listApprovalHistories(submissionsQuery.data!.id, { action: 'Approve', page: 1, pageSize: 100 }),
    enabled: Boolean(submissionsQuery.data?.id),
  });
  const submission = detailQuery.data ?? submissionsQuery.data;
  const criteria = useMemo(() => (groupQuery.data?.criteria ?? []).filter((criterion) => criterion.type !== 'Supplementary' || criterion.targetSubmissionId === submission?.id), [groupQuery.data, submission?.id]);
  const resultByCriterion = useMemo(() => new Map((submission?.results ?? []).map((result) => [result.criteriaId, result])), [submission]);

  if (!groupId || !localityId) return <EmptyState title="Không tìm thấy hồ sơ" description="Thiếu mã nhóm tiêu chí hoặc địa phương." />;
  if (groupQuery.isLoading || submissionsQuery.isLoading || detailQuery.isLoading) return <PageLoading label="Đang tải chi tiết hồ sơ…" />;
  if (groupQuery.isError || submissionsQuery.isError || detailQuery.isError) return <EmptyState variant="error" title="Không tải được chi tiết hồ sơ" description="Vui lòng thử lại sau." />;
  if (!submission || !groupQuery.data) return <EmptyState title="Không tìm thấy hồ sơ" description={`Hồ sơ không còn ở bước ${config.label}.`} />;

  const localityName = submission.localityFullName ?? submission.createdByUsername ?? localityCode;
  const forwardingHistories = approvalHistoriesQuery.data?.items ?? [];
  const specialistForwarding = forwardingHistories.find((history) => history.stageLevel === 'LocalSubmitted');
  const leaderForwarding = forwardingHistories.find((history) => history.stageLevel === 'SpecialistApproved');
  const groupPath = config.groupPath(localityId);
  const proposed = submission.results.reduce((total, item) => total + item.point, 0);
  const proposedBonus = submission.results.reduce((total, item) => total + item.bonusPoint, 0);
  const official = submission.results.reduce((total, item) => total + (item.officialPoint ?? item.point), 0);
  const officialBonus = submission.results.reduce((total, item) => total + (item.officialBonusPoint ?? item.bonusPoint), 0);

  const processSubmission = async (processor: (item: SubmissionApi) => Promise<unknown>, successMessage: string) => {
    setActionPending(true);
    try {
      await processor(submission);
      await queryClient.invalidateQueries({ queryKey: ['council-submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['approval-detail-submissions'] });
      toast.success(successMessage);
      if (!groupPath) { navigate(config.listPath); return; }
      const remaining = await specialistApi.listAllSubmissions({ stage: config.stage, page: 1, pageSize: 100 });
      const hasMore = remaining.items.some((item) => (item.createdByWardCode ?? item.createdBy ?? '') === localityCode);
      navigate(hasMore ? groupPath : config.listPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xử lý hồ sơ. Vui lòng thử lại.');
    } finally {
      setActionPending(false);
    }
  };

  const approveSubmission = () => processSubmission(
    (item) => specialistApi.approveSubmission(item.id, 'Hội đồng thi đua đã xem xét và duyệt hồ sơ.'),
    'Đã duyệt hồ sơ và chuyển sang Ban Thường trực.',
  );

  const requestRevision = (reason: string) => processSubmission(
    (item) => specialistApi.requestRevision({ submissionId: item.id, reason }),
    'Đã gửi yêu cầu chỉnh sửa về Chuyên viên.',
  );

  return <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 pb-6">
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><Link to={config.listPath} className="hover:text-primary">Danh sách địa phương</Link><span>/</span>{groupPath ? <Link to={groupPath} className="hover:text-primary">{localityName}</Link> : <span>{localityName}</span>}<span>/</span><span className="font-medium text-foreground">{groupQuery.data.name}</span></nav>
    <PageHeader title="Chi tiết kết quả tiêu chí" description={`${localityName} · ${config.label}`} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link to={config.historyPath} />} nativeButton={false}><History className="size-4" />Lịch sử</Button><Button variant="outline" render={<Link to={groupPath ?? config.listPath} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button></div>} />
    <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-5"><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Địa phương</p><p className="mt-1 truncate font-semibold">{localityName}</p></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Trạng thái</p><Badge className="mt-1 bg-warning/15 text-warning-foreground">Chờ {config.label} xử lý</Badge></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Điểm địa phương đề xuất</p><p className="mt-1 text-lg font-semibold tabular-nums">{proposed}</p></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Điểm thưởng đề xuất</p><p className="mt-1 text-lg font-semibold tabular-nums">{proposedBonus}</p></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Điểm đã thẩm định</p><p className="mt-1 text-lg font-semibold tabular-nums">{official + officialBonus}</p></div></div></section>
    <ForwardingFilesSection specialistForwarding={specialistForwarding} leaderForwarding={leaderForwarding} onPreview={setPreviewFile} />
    <FilePreviewDialog file={previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} />
    {submission.results.some((result) => result.officialReason !== null) && <section className="rounded-lg border border-border bg-card px-4 py-3 sm:px-5" aria-label="Điểm chuyên viên đã sửa"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Điểm chuyên viên đã sửa</h2><p className="mt-0.5 text-xs text-muted-foreground">Chọn tiêu chí để xem điểm, lý do và tệp đính kèm của lần điều chỉnh.</p></div><div className="flex flex-wrap gap-2">{submission.results.filter((result) => result.officialReason !== null).map((result) => <Button key={result.id} type="button" variant="outline" size="sm" onClick={() => setScoreRevisionResult(result)}><Eye className="size-4" />Xem điểm đã sửa</Button>)}</div></div></section>}
    <section className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5"><div><h2 className="flex items-center gap-2 text-base font-semibold"><FileText className="size-4 text-primary" />Chi tiết tiêu chí con</h2><p className="mt-1 text-sm text-muted-foreground">{config.description}</p></div><div className="flex items-center gap-2"><TableColumnVisibility storageKey={`readonly-approval-${reviewer}`} columns={[{ id: 'criterion', label: 'Tiêu chí con' }, { id: 'evidence', label: 'Minh chứng' }, { id: 'proposed', label: 'Địa phương đề xuất' }, { id: 'reviewed', label: 'Điểm đã thẩm định' }, { id: 'explanation', label: 'Nội dung diễn giải' }]} />{reviewer === 'council' && (<><Button type="button" variant="outline" size="sm" disabled={actionPending} className="border-[#D9773D]/70 text-[#9A481D] hover:bg-[#D9773D]/10" action="reject" state={config.state} onClick={() => setRevisionOpen(true)}><MessageSquareWarning className="size-4" />Yêu cầu chỉnh sửa</Button><Button type="button" size="sm" disabled={actionPending} action="approve" state={config.state} onClick={() => setApproveOpen(true)}><Send className="size-4" />Duyệt</Button></>)}</div></div><Table data-column-visibility-table={`readonly-approval-${reviewer}`} className="min-w-[1220px] table-fixed"><colgroup><col className="w-[25%]" /><col className="w-[13%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[26%]" /></colgroup><TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Minh chứng</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Địa phương đề xuất</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Điểm đã thẩm định</TableHead><TableHead className="bg-primary px-4 py-3 text-primary-foreground">Nội dung diễn giải</TableHead></TableRow></TableHeader><TableBody>{criteria.map((criterion) => { const result = resultByCriterion.get(criterion.id); return <TableRow key={criterion.id} className="align-top"><TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5"><TruncatedText as="p" value={criterion.content} maxLines={4} className="font-semibold leading-5" /><p className="mt-2 text-xs text-muted-foreground">{criterion.type === 'Supplementary' ? 'Tiêu chí bổ sung' : 'Tiêu chí chấm điểm'}</p></TableCell><TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5">{result?.files.length ? <Button type="button" variant="outline" className="w-full justify-center" onClick={() => setEvidenceDialog({ criterionName: criterion.content, files: result.files })}><FileText className="size-4" />Xem file ({result.files.length})</Button> : <span className="text-xs text-muted-foreground">Chưa có minh chứng</span>}</TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><ScorePair point={result?.point ?? 0} bonus={result?.bonusPoint ?? 0} maxPoint={criterion.maxPoint} maxBonus={criterion.maxBonusPoint} /></TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><ScorePair point={result?.officialPoint ?? result?.point ?? 0} bonus={result?.officialBonusPoint ?? result?.bonusPoint ?? 0} maxPoint={criterion.maxPoint} maxBonus={criterion.maxBonusPoint} /></TableCell><TableCell className="whitespace-normal px-4 py-5 text-sm leading-6 text-muted-foreground">{result?.explanation || '—'}{result?.officialReason && <p className="mt-2 border-t border-border pt-2"><span className="font-medium text-foreground">Lý do sửa điểm:</span> {result.officialReason}</p>}</TableCell></TableRow>; })}{criteria.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}</TableBody></Table></section>
    <OfficialScoreRevisionDialog open={Boolean(scoreRevisionResult)} onOpenChange={(open) => { if (!open) setScoreRevisionResult(null); }} result={scoreRevisionResult} criterionLabel={scoreRevisionResult?.criteriaContent ?? 'Tiêu chí con'} />
    <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Duyệt hồ sơ" description={`Duyệt và gửi hồ sơ "${groupQuery.data.name}" của ${localityName} lên Ủy ban thường trực?`} confirmLabel="Duyệt hồ sơ" cancelLabel="Đóng" action="approve" state={config.state} onConfirm={() => { void approveSubmission(); }} />
    <RejectDialog open={revisionOpen} onOpenChange={setRevisionOpen} localityName={localityName} state={config.state} title="Yêu cầu chỉnh sửa" confirmLabel="Gửi yêu cầu" confirmVariant="default" description="Yêu cầu sẽ được gửi về Chuyên viên để đối chiếu và xử lý hồ sơ." reasonLabel="Lý do yêu cầu chỉnh sửa" reasonPlaceholder="Ví dụ: Cần đối chiếu lại minh chứng và tổng điểm." onConfirm={requestRevision} />
    <ListDialog open={Boolean(evidenceDialog)} onOpenChange={(open) => { if (!open) setEvidenceDialog(null); }} title="Minh chứng đã nộp" description={evidenceDialog?.criterionName} items={(evidenceDialog?.files ?? []).map((file) => ({ id: file.id, label: file.displayName || file.originalName, description: `${Math.ceil(file.sizeBytes / 1024)} KB` }))} emptyText="Tiêu chí này chưa có file minh chứng." className="w-[min(96vw,1100px)] max-w-[calc(100%-1rem)] sm:max-w-[min(96vw,1100px)]" maxItemsVisible={10} renderItem={(item) => { const file = evidenceDialog?.files.find((candidate) => candidate.id === item.id); return <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2.5"><FileText className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 break-all text-sm font-medium">{item.label}</span><span className="flex shrink-0 items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { if (file) setPreviewFile(file); }}><Eye className="size-4" />Xem</Button><Button type="button" variant="outline" size="sm" onClick={() => { if (file) void downloadFile(file.id, file.displayName || file.originalName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.')); }}><Download className="size-4" />Tải về</Button></span></div>; }} />
  </div>;
}
