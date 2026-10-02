import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search } from 'lucide-react';
// import { Send, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, RejectDialog, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
// import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
// import { resultPublicationApi } from '../api/resultPublicationApi';
// import { ResultPublicationDialog } from '../components/ResultPublicationDialog';

const PENDING_COMMITTEE_STAGE = 'CouncilApproved' as const;
const APPROVED_COMMITTEE_STAGE = 'CommitteeFinalized' as const;
// Các cấp giữa không duyệt/chuyển hồ sơ — Ban thường trực xem và nhận xét ngay
// hồ sơ chuyên viên đã duyệt (SpecialistApproved) thay vì chờ Hội đồng trình lên.
const COMMITTEE_VISIBLE_STAGES = ['SpecialistApproved', 'LeaderApproved', PENDING_COMMITTEE_STAGE, APPROVED_COMMITTEE_STAGE] as const;

interface LocalitySummary {
  id: string;
  name: string;
  fullName: string;
  region: string;
}

interface LocalityReviewRow {
  locality: LocalitySummary;
  submissions: SubmissionApi[];
  proposedScore: number;
  proposedBonus: number;
  councilScore: number;
  councilBonus: number;
  latestUpdatedAt: string | null;
  latestUpdatedBy: string | null;
}

// Gọi API y hệt trang /chuyen-vien/duyet: một endpoint /api/v1/submissions,
// includeUnsubmitted=true để địa phương chưa nộp vẫn xuất hiện, gộp tất cả trang.
async function listEveryCommitteeSubmission() {
  const firstPage = await specialistApi.listAllSubmissions({
    includeUnsubmitted: true,
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listAllSubmissions({
      includeUnsubmitted: true,
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );
  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

/** URL dùng mã số (vd. 26122), trong khi một số response trả `loc-26122`. */
function getSubmissionLocalityCode(submission: SubmissionApi) {
  const rawCode = submission.createdByWardCode ?? submission.createdBy ?? 'unknown';
  return rawCode.replace(/^loc-/i, '');
}

function getResultTotals(submissions: SubmissionApi[]) {
  return submissions.reduce((totals, submission) => submission.results.filter((result) => result.criteriaStatus !== 'Deleted').reduce((resultTotals, result) => ({
    proposedScore: resultTotals.proposedScore + result.point,
    proposedBonus: resultTotals.proposedBonus + result.bonusPoint,
    councilScore: resultTotals.councilScore + (result.officialPoint ?? result.point),
    councilBonus: resultTotals.councilBonus + (result.officialBonusPoint ?? result.bonusPoint),
  }), totals), { proposedScore: 0, proposedBonus: 0, councilScore: 0, councilBonus: 0 });
}

/** Danh sách hồ sơ đã được Hội đồng thi đua duyệt và chuyển Ban Thường trực công bố. */
export default function CommitteeApprovalPage() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<LocalityReviewRow | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const queryClient = useQueryClient();
  // const [requestRow, setRequestRow] = useState<LocalityReviewRow | null>(null);
  // const [publishOpen, setPublishOpen] = useState(false);

  // Backend là nguồn sự thật: chỉ công bố được khi mọi địa phương đã nộp và
  // hoàn tất mọi nhóm tiêu chí.
  // const publicationPreviewQuery = useQuery({
  //   queryKey: ['result-publication-preview'],
  //   queryFn: resultPublicationApi.getPreview,
  // });
  // const canPublish = publicationPreviewQuery.data?.canPublish === true;

  // const requestRevisionMutation = useMutation({
  //   mutationFn: async ({ row, reason }: { row: LocalityReviewRow; reason: string }) => {
  //     await Promise.all(row.submissions.map((submission) => specialistApi.requestRevision({ submissionId: submission.id, reason })));
  //   },
  //   onSuccess: async () => {
  //     await queryClient.invalidateQueries({ queryKey: ['committee-submissions'] });
  //     toast.success('Đã gửi yêu cầu đến Chuyên viên.');
  //     setRequestRow(null);
  //   },
  //   onError: () => toast.error('Không thể gửi yêu cầu bổ sung. Vui lòng thử lại.'),
  // });
  // const approveMutation = useMutation({
  //   mutationFn: async (row: LocalityReviewRow) => {
  //     await Promise.all(row.submissions.filter((submission) => submission.currentStage === PENDING_COMMITTEE_STAGE).map((submission) => specialistApi.finalizeSubmission(submission.id)));
  //   },
  //   onSuccess: async () => {
  //     await queryClient.invalidateQueries({ queryKey: ['committee-submissions'] });
  //     toast.success('Đã duyệt hồ sơ.');
  //   },
  //   onError: () => toast.error('Không thể duyệt hồ sơ. Vui lòng thử lại.'),
  // });

  const submissionsQuery = useQuery({
    queryKey: ['committee-submissions', { includeUnsubmitted: true }],
    queryFn: listEveryCommitteeSubmission,
  });

  const groupsQuery = useQuery({
    queryKey: ['committee-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  const totalAppliedGroups = useMemo(
    () => (groupsQuery.data?.items ?? []).filter((g) => g.status === 'Applied' || g.status === 'Published').length,
    [groupsQuery.data],
  );

  // Nhóm tiêu chí đã công bố (status Published) → hồ sơ khóa, không nhận xét thêm.
  const publishedGroupIds = useMemo(
    () => new Set((groupsQuery.data?.items ?? []).filter((group) => group.status === 'Published').map((group) => group.id)),
    [groupsQuery.data],
  );
  // Cũ: chỉ hồ sơ CouncilApproved mới cho nhận xét — submission.currentStage === PENDING_COMMITTEE_STAGE.
  // Sau đó: mọi stage khác CommitteeFinalized. Giờ thêm loại nhóm đã công bố.
  const canCommentSubmission = (submission: SubmissionApi) =>
    submission.currentStage !== APPROVED_COMMITTEE_STAGE && !publishedGroupIds.has(submission.criteriaGroupId ?? '');
  const canCommentSelected = selectedRow?.submissions.some(canCommentSubmission) ?? false;
  const saveComment = async (comment: string) => {
    if (!selectedRow) return;
    setActionPending(true);
    try {
      for (const submission of selectedRow.submissions.filter(canCommentSubmission)) {
        await specialistApi.comment({ submissionId: submission.id, reason: comment });
      }
      await queryClient.invalidateQueries({ queryKey: ['committee-submissions'] });
      setSelectedRow(null);
      toast.success('Đã lưu nhận xét của Ban thường trực vào lịch sử hồ sơ.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu nhận xét. Vui lòng thử lại.');
      throw error;
    } finally {
      setActionPending(false);
    }
  };

  const rows = useMemo<LocalityReviewRow[]>(() => {
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const submission of submissionsQuery.data?.items ?? []) {
      const localityId = getSubmissionLocalityCode(submission);
      byLocality.set(localityId, [...(byLocality.get(localityId) ?? []), submission]);
    }

    return Array.from(byLocality.entries()).map(([localityId, allSubmissions]) => {
      // Hồ sơ chuyên viên đã duyệt (SpecialistApproved) trở lên tính là đã nộp;
      // còn lại (Draft, LocalSubmitted, ScorerSubmitted, …, row tổng hợp) hiển thị như chưa nộp.
      const submissions = allSubmissions
        .filter(isRealSubmission)
        .filter((submission) => (COMMITTEE_VISIBLE_STAGES as readonly string[]).includes(submission.currentStage));
      // Cũ — chỉ hồ sơ đã tới cấp Ban thường trực:
      // .filter((submission) => submission.currentStage === PENDING_COMMITTEE_STAGE || submission.currentStage === APPROVED_COMMITTEE_STAGE);
      const totals = getResultTotals(submissions);
      const latestSubmission = submissions
        .slice()
        .sort((left, right) => +new Date(right.updatedAt ?? right.submittedAt ?? right.createdAt) - +new Date(left.updatedAt ?? left.submittedAt ?? left.createdAt))[0];

      return {
        locality: {
          id: `loc-${localityId}`,
          name: allSubmissions[0]?.localityFullName ?? allSubmissions[0]?.createdByUsername ?? localityId,
          fullName: allSubmissions[0]?.localityFullName ?? localityId,
          region: submissions[0]?.createdByWardCode ?? '',
        },
        submissions,
        ...totals,
        latestUpdatedAt: latestSubmission?.updatedAt ?? latestSubmission?.submittedAt ?? latestSubmission?.createdAt ?? null,
        latestUpdatedBy: latestSubmission?.createdByUsername ?? null,
      };
    });
  }, [submissionsQuery.data]);

  const visibleRows = useMemo(() => rows
    .filter((row) => !fromDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) <= new Date(`${toDate}T23:59:59`)), [fromDate, rows, toDate]);

  const columns = useMemo<ColumnDef<LocalityReviewRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.locality.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(220px,1.25fr)' } } },
    { id: 'submissionCount', accessorFn: (row) => row.submissions.length, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.submissions.length}/{totalAppliedGroups}</span>, meta: { align: 'center', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.councilScore, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.councilScore}</span>, meta: { align: 'right', list: { width: 'minmax(130px,.8fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.9fr)' } } },
    { accessorFn: (row) => row.councilBonus, header: 'Tổng điểm thưởng', cell: ({ row }) => <span className="tabular-nums">{row.original.councilBonus}</span>, meta: { align: 'right', list: { width: 'minmax(155px,.85fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Tổng điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(205px,1fr)' } } },
    { id: 'state', accessorFn: (row) => row.submissions.length === 0 ? 'Chưa nộp' : row.submissions.every((submission) => submission.currentStage === APPROVED_COMMITTEE_STAGE) ? 'Đã duyệt' : 'Chờ duyệt', header: 'Trạng thái', cell: ({ row }) => row.original.submissions.length === 0 ? <Badge variant="outline" className="text-muted-foreground">Chưa nộp</Badge> : row.original.submissions.every((submission) => submission.currentStage === APPROVED_COMMITTEE_STAGE) ? <Badge variant="success">Đã duyệt</Badge> : <ScoreStateBadge state="CHO_DUYET_BTT" />, meta: { align: 'center', list: { width: 'minmax(155px,.85fr)' } } },
  ], [totalAppliedGroups]);
  // const selectedRowApproved = Boolean(selectedRow && selectedRow.submissions.length > 0 && selectedRow.submissions.every((submission) => submission.currentStage === APPROVED_COMMITTEE_STAGE));

  const activeFilters = [
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải danh sách địa phương…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được hồ sơ" description={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Vui lòng thử lại sau.'} />;

  return <div className="space-y-6">
    <PageHeader title="Duyệt tiêu chí theo địa phương" description="Rà soát hồ sơ do chuyên viên trưởng duyệt và nhận xét trước khi công bố kết quả." />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-2"><Input type="date" aria-label="Từ ngày cập nhật" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày cập nhật" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => { setFromDate(''); setToDate(''); }} toolbar={<div className="flex flex-wrap gap-2"><Button disabled={!selectedRow} disabledReason="Chọn một địa phương để xem các nhóm tiêu chí." onClick={() => selectedRow && navigate(`/thi-dua/duyet/ban-thuong-truc/${selectedRow.locality.id}`)}><Search className="mr-1.5 size-4" />Xem nhóm tiêu chí</Button><Button variant="outline" disabled={!selectedRow || !canCommentSelected || actionPending} disabledReason={!selectedRow ? 'Chọn một địa phương để nhận xét.' : !canCommentSelected ? 'Hồ sơ đã chốt hoặc đã công bố nên không thể nhận xét.' : undefined} onClick={() => setCommentOpen(true)}><MessageSquare className="mr-1.5 size-4" />Nhận xét</Button>{/* {selectedRow && <Button disabled={selectedRowApproved || approveMutation.isPending} disabledReason={selectedRowApproved ? 'Hồ sơ đã được Ban Thường trực duyệt.' : undefined} onClick={() => approveMutation.mutate(selectedRow)}><Send className="mr-1.5 size-4" />{approveMutation.isPending ? 'Đang duyệt…' : 'Duyệt'}</Button>}<Button variant="warning" disabled={!selectedRow || selectedRowApproved || requestRevisionMutation.isPending} disabledReason={!selectedRow ? 'Chọn một địa phương để yêu cầu Chuyên viên bổ sung.' : selectedRowApproved ? 'Hồ sơ đã duyệt nên không thể yêu cầu chỉnh sửa.' : undefined} onClick={() => selectedRow && setRequestRow(selectedRow)}><Send className="mr-1.5 size-4" />Yêu cầu chỉnh sửa</Button><Button disabled={!canPublish} disabledReason={!canPublish ? (publicationPreviewQuery.data?.message ?? 'Chỉ có thể công bố khi tất cả hồ sơ của tất cả địa phương đã được hội đồng chấm.') : undefined} onClick={() => setPublishOpen(true)}><Trophy className="mr-1.5 size-4" />Công bố kết quả</Button> */}</div>} emptyState={{ title: 'Không có hồ sơ chờ Ban Thường trực duyệt', description: 'Hiện chưa có submission nào được Hội đồng chuyển đến.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ hoặc đã được Ủy ban thường trực duyệt" />
    <RejectDialog open={commentOpen} onOpenChange={setCommentOpen} localityName={selectedRow?.locality.name} state="CHO_DUYET_BTT" title="Nhận xét địa phương" confirmLabel="Gửi nhận xét" confirmVariant="default" submitAction="approve" description="Nhận xét được lưu vào lịch sử hồ sơ và không làm thay đổi điểm hoặc trạng thái duyệt." reasonLabel="Nội dung nhận xét" reasonPlaceholder="Nhập nhận xét của Ban thường trực về hồ sơ địa phương." onConfirm={saveComment} />
    {/* <RequestSpecialistDialog open={Boolean(requestRow)} onOpenChange={(open) => { if (!open) setRequestRow(null); }} localityName={requestRow?.locality.name} requesterLabel="Ủy ban thường trực" onConfirm={({ reason }) => requestRow ? requestRevisionMutation.mutateAsync({ row: requestRow, reason }) : Promise.resolve()} />
    <ResultPublicationDialog open={publishOpen} onOpenChange={setPublishOpen} /> */}
  </div>;
}
