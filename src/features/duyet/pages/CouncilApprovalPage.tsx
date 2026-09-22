import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, History, MessageSquare, MessageSquareWarning, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, RejectDialog, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { toast } from 'sonner';

const COUNCIL_STAGE = 'LeaderApproved' as const;
type CouncilStatusFilter = 'ALL' | 'CHO_DUYET_HOI_DONG';

interface LocalitySummary {
  id: string;
  name: string;
  fullName: string;
  region: string;
}

interface LocalityReviewRow {
  locality: LocalitySummary;
  submissions: SubmissionApi[];
  maximumScore: number;
  proposedTotal: number;
  latestUpdatedAt: string | null;
}

async function listEveryCouncilSubmission() {
  const firstPage = await specialistApi.listAllSubmissions({
    stage: COUNCIL_STAGE,
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listAllSubmissions({
      stage: COUNCIL_STAGE,
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );

  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat().filter(isRealSubmission) };
}

function formatUpdated(row: LocalityReviewRow) {
  if (!row.latestUpdatedAt) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.latestUpdatedAt));
}

function getResultTotals(submissions: SubmissionApi[]) {
  return submissions.reduce((totals, submission) => submission.results.reduce((resultTotals, result) => ({
    maximumScore: resultTotals.maximumScore + result.snapshotMaxPoint + result.snapshotMaxBonusPoint,
    proposedTotal: resultTotals.proposedTotal + result.point + result.bonusPoint,
  }), totals), { maximumScore: 0, proposedTotal: 0 });
}

/** Danh sách hồ sơ đã được lãnh đạo ban duyệt và chuyển Hội đồng thi đua xem xét. */
export default function CouncilApprovalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRow, setSelectedRow] = useState<LocalityReviewRow | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouncilStatusFilter>('CHO_DUYET_HOI_DONG');
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const submissionsQuery = useQuery({
    queryKey: ['council-submissions', { stage: COUNCIL_STAGE }],
    queryFn: listEveryCouncilSubmission,
  });

  const rows = useMemo<LocalityReviewRow[]>(() => {
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const submission of submissionsQuery.data?.items ?? []) {
      const localityId = submission.createdByWardCode ?? submission.createdBy ?? `submission:${submission.id}`;
      byLocality.set(localityId, [...(byLocality.get(localityId) ?? []), submission]);
    }

    return Array.from(byLocality.entries()).map(([localityId, submissions]) => {
      const totals = getResultTotals(submissions);
      const latestSubmission = submissions
        .slice()
        .sort((left, right) => +new Date(right.updatedAt ?? right.submittedAt ?? right.createdAt) - +new Date(left.updatedAt ?? left.submittedAt ?? left.createdAt))[0];

      return {
        locality: {
          id: submissions[0]?.createdByWardCode ? `loc-${localityId}` : localityId,
          name: submissions[0]?.localityFullName ?? submissions[0]?.createdByUsername ?? localityId,
          fullName: submissions[0]?.localityFullName ?? localityId,
          region: submissions[0]?.createdByWardCode ?? '',
        },
        submissions,
        ...totals,
        latestUpdatedAt: latestSubmission?.updatedAt ?? latestSubmission?.submittedAt ?? latestSubmission?.createdAt ?? null,
      };
    });
  }, [submissionsQuery.data]);

  const visibleRows = useMemo(() => rows
    .filter(() => statusFilter === 'ALL' || statusFilter === 'CHO_DUYET_HOI_DONG')
    .filter((row) => !fromDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) <= new Date(`${toDate}T23:59:59`)), [fromDate, rows, statusFilter, toDate]);

  const columns = useMemo<ColumnDef<LocalityReviewRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.locality.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(220px,1.25fr)' } } },
    { id: 'submissionCount', accessorFn: (row) => row.submissions.length, header: 'Số nhóm tiêu chí', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.submissions.length}</span>, meta: { align: 'center', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.maximumScore, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.maximumScore}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.proposedTotal, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.proposedTotal}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.9fr)' } } },
    { id: 'updatedAt', accessorFn: formatUpdated, header: 'Cập nhật lần cuối', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatUpdated(row.original)}</span>, meta: { list: { width: 'minmax(180px,1fr)' } } },
    { id: 'state', accessorFn: () => COUNCIL_STAGE, header: 'Trạng thái duyệt', cell: () => <ScoreStateBadge state="CHO_DUYET_HOI_DONG" />, meta: { align: 'center', list: { width: 'minmax(170px,.9fr)' } } },
  ], []);

  const openGroups = () => selectedRow && navigate(`/thi-dua/duyet/hoi-dong-tdkt/${selectedRow.locality.id}`);
  const processSelectedSubmissions = async (processor: (submission: SubmissionApi) => Promise<unknown>, successMessage: string) => {
    if (!selectedRow) return;
    setActionPending(true);
    try {
      for (const submission of selectedRow.submissions) await processor(submission);
      await queryClient.invalidateQueries({ queryKey: ['council-submissions'] });
      setSelectedRow(null);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xử lý hồ sơ đã chọn.');
    } finally {
      setActionPending(false);
    }
  };

  const requestRevision = (reason: string) => processSelectedSubmissions(
    (submission) => specialistApi.requestRevision({ submissionId: submission.id, reason }),
    'Đã gửi yêu cầu chỉnh sửa về Chuyên viên.',
  );

  const saveComment = (comment: string) => processSelectedSubmissions(
    (submission) => specialistApi.updateScores({
      submissionId: submission.id,
      reason: comment,
      scoreItems: submission.results.map((result) => ({
        submissionResultId: result.id,
        point: result.officialPoint ?? result.point,
        bonusPoint: result.officialBonusPoint ?? result.bonusPoint,
      })),
    }),
    'Đã lưu nhận xét của Hội đồng vào lịch sử hồ sơ.',
  );

  const activeFilters = [
    statusFilter !== 'ALL' ? { label: 'Trạng thái', value: 'Chờ Hội đồng duyệt', onClear: () => setStatusFilter('ALL') } : null,
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  if (submissionsQuery.isLoading) return <PageLoading label="Đang tải hồ sơ chờ Hội đồng duyệt…" />;
  if (submissionsQuery.isError) return <EmptyState variant="error" title="Không tải được hồ sơ" description={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Vui lòng thử lại sau.'} />;

  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ do lãnh đạo ban chuyển Hội đồng thi đua xem xét." actions={<Button variant="outline" render={<Link to="/hoi-dong/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử duyệt</Button>} />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-3"><Select value={statusFilter} onValueChange={(value) => setStatusFilter((value ?? 'ALL') as CouncilStatusFilter)}><SelectTrigger aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="CHO_DUYET_HOI_DONG">Chờ Hội đồng duyệt</SelectItem></SelectContent></Select><Input type="date" aria-label="Từ ngày duyệt" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày duyệt" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => { setStatusFilter('ALL'); setFromDate(''); setToDate(''); }} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" disabled={!selectedRow || actionPending} disabledReason="Chọn một địa phương để xem chi tiết." onClick={openGroups}><Eye className="mr-1.5 size-4" />Xem</Button><Button variant="outline" disabled={!selectedRow || actionPending} disabledReason="Chọn một địa phương để nhận xét." action="approve" state="CHO_DUYET_HOI_DONG" onClick={() => setCommentOpen(true)}><MessageSquare className="mr-1.5 size-4" />Nhận xét</Button><Button variant="outline" disabled={!selectedRow || actionPending} disabledReason="Chọn một địa phương để yêu cầu chỉnh sửa." className="border-[#D9773D]/70 text-[#9A481D] hover:bg-[#D9773D]/10" action="reject" state="CHO_DUYET_HOI_DONG" onClick={() => setRevisionOpen(true)}><MessageSquareWarning className="mr-1.5 size-4" />Yêu cầu chỉnh sửa</Button><Button variant="outline" disabled={!selectedRow || actionPending} disabledReason="Chọn một địa phương để xem lịch sử duyệt." onClick={() => selectedRow && navigate('/hoi-dong/lich-su')}><History className="mr-1.5 size-4" />Lịch sử</Button></div>} emptyState={{ title: 'Không có hồ sơ chờ Hội đồng duyệt', description: 'Hiện chưa có submission nào ở trạng thái LeaderApproved.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ LeaderApproved chờ Hội đồng thi đua xem xét" />
    <RejectDialog open={revisionOpen} onOpenChange={setRevisionOpen} localityName={selectedRow?.locality.name} state="CHO_DUYET_HOI_DONG" title="Yêu cầu chỉnh sửa" confirmLabel="Gửi yêu cầu" confirmVariant="default" description="Yêu cầu sẽ được gửi về Chuyên viên để đối chiếu và xử lý hồ sơ." reasonLabel="Lý do yêu cầu chỉnh sửa" reasonPlaceholder="Ví dụ: Cần đối chiếu lại minh chứng và tổng điểm." onConfirm={requestRevision} />
    <RejectDialog open={commentOpen} onOpenChange={setCommentOpen} localityName={selectedRow?.locality.name} state="CHO_DUYET_HOI_DONG" title="Nhận xét địa phương" confirmLabel="Gửi nhận xét" confirmVariant="default" submitAction="approve" description="Nhận xét được lưu vào lịch sử hồ sơ và không làm thay đổi điểm hoặc trạng thái duyệt." reasonLabel="Nội dung nhận xét" reasonPlaceholder="Nhập nhận xét của Hội đồng về hồ sơ địa phương." onConfirm={saveComment} />
  </div>;
}
