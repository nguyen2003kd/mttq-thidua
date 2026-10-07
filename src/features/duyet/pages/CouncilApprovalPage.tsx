import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1CriteriaGroupsQueryKey } from '@/api/endpoints/criteria-groups';
import { getGetApiV1SubmissionsQueryKey } from '@/api/endpoints/submissions';
import { dataQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';
import { Eye, MessageSquare, Search } from 'lucide-react';
// import { History } from 'lucide-react'; // tạm ẩn cùng nút Lịch sử duyệt
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryFilters } from '@/hooks/useQueryFilters';
// import { Link } from 'react-router-dom'; // tạm ẩn cùng nút Lịch sử duyệt
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading } from '@/components/core';
import { RejectDialog } from '@/components/core';
// import { ScoreStateBadge } from '@/components/core'; // tạm ẩn cùng cột Trạng thái duyệt
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // tạm ẩn cùng bộ lọc trạng thái
// import { Badge } from '@/components/ui/badge'; // tạm ẩn cùng cột Trạng thái duyệt
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { buildCouncilPeriodUrl } from '../councilPeriodNavigation';
import { toast } from 'sonner';

// Hội đồng không cần chờ Lãnh đạo ban duyệt — xem và nhận xét ngay hồ sơ chuyên viên đã duyệt
// (SpecialistApproved). Hồ sơ đã CommitteeFinalized khóa vĩnh viễn nên không hiện trong danh sách.
const COUNCIL_COMMENT_STAGES = ['SpecialistApproved', 'LeaderApproved'] as const;
const COUNCIL_VISIBLE_STAGES = [...COUNCIL_COMMENT_STAGES, 'CouncilApproved'] as const;
// Luồng cũ — Hội đồng chờ Lãnh đạo ban duyệt lên (LeaderApproved) mới thấy hồ sơ:
// const COUNCIL_STAGE = 'LeaderApproved' as const;
// const COUNCIL_VISIBLE_STAGES = [COUNCIL_STAGE, 'CouncilApproved', 'CommitteeFinalized'] as const;
// type CouncilStatusFilter = 'ALL' | 'CHO_DUYET_HOI_DONG'; // tạm ẩn cùng bộ lọc trạng thái

interface LocalitySummary {
  id: string;
  name: string;
  fullName: string;
  region: string;
}

interface LocalityReviewRow {
  locality: LocalitySummary;
  submissions: SubmissionApi[];
  /** Địa phương đã có hồ sơ công bố — nếu không còn hồ sơ nào trong tầm Hội đồng thì ẩn khỏi danh sách. */
  hasFinalized: boolean;
  maximumScore: number;
  proposedTotal: number;
  latestUpdatedAt: string | null;
  latestStage: SubmissionApi['currentStage'];
}

// Gọi API y hệt trang /chuyen-vien/duyet: một endpoint /api/v1/submissions,
// includeUnsubmitted=true để địa phương chưa nộp vẫn xuất hiện, gộp tất cả trang.
async function listEveryCouncilSubmission(periodId?: string) {
  const firstPage = await specialistApi.listAllSubmissions({
    includeUnsubmitted: true,
    periodId,
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
      periodId,
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );
  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

async function listEveryCouncilCriteriaGroup(periodId?: string) {
  const firstPage = await specialistApi.listCriteriaGroups({ periodId, page: 1, pageSize: 100 });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listCriteriaGroups({ periodId, page: index + 2, pageSize: 100 })),
  );
  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

/** URL dùng mã số (vd. 26122), trong khi một số response trả `loc-26122`. */
function getSubmissionLocalityCode(submission: SubmissionApi) {
  const rawCode = submission.createdByWardCode ?? submission.createdBy ?? 'unknown';
  return rawCode.replace(/^loc-/i, '');
}

function formatUpdated(row: LocalityReviewRow) {
  if (!row.latestUpdatedAt) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.latestUpdatedAt));
}

function getResultTotals(submissions: SubmissionApi[]) {
  return submissions.reduce((totals, submission) => submission.results.filter((result) => result.criteriaStatus !== 'Deleted').reduce((resultTotals, result) => ({
    maximumScore: resultTotals.maximumScore + result.snapshotMaxPoint + result.snapshotMaxBonusPoint,
    proposedTotal: resultTotals.proposedTotal + result.point + result.bonusPoint,
  }), totals), { maximumScore: 0, proposedTotal: 0 });
}

/** Danh sách hồ sơ đã được lãnh đạo ban duyệt và chuyển Hội đồng thi đua xem xét. */
export default function CouncilApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get('periodId') ?? '';
  const withCouncilPeriod = (path: string) => periodId ? buildCouncilPeriodUrl(path, periodId) : path;
  const queryClient = useQueryClient();
  const [selectedRow, setSelectedRow] = useState<LocalityReviewRow | null>(null);
  const {
    filters: { fromDate, toDate },
    setters: { fromDate: setFromDate, toDate: setToDate },
    setFilters: setQueryFilters,
  } = useQueryFilters({ fromDate: '', toDate: '' });
  // const [statusFilter, setStatusFilter] = useState<CouncilStatusFilter>('ALL'); // tạm ẩn cùng bộ lọc trạng thái
  const [commentOpen, setCommentOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const submissionsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1SubmissionsQueryKey(), { view: 'all', periodId: periodId || undefined, includeUnsubmitted: true, sortBy: 'createdAt', sortOrder: 'desc' }),
    queryFn: () => listEveryCouncilSubmission(periodId || undefined),
  });

  const groupsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1CriteriaGroupsQueryKey(), { view: 'list', periodId: periodId || undefined, page: 1, pageSize: 100 }),
    queryFn: () => listEveryCouncilCriteriaGroup(periodId || undefined),
  });

  const totalAppliedGroups = useMemo(
    () => (groupsQuery.data?.items ?? []).filter((g) => g.status === 'Applied' || g.status === 'Published').length,
    [groupsQuery.data],
  );

  const rows = useMemo<LocalityReviewRow[]>(() => {
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const submission of submissionsQuery.data?.items ?? []) {
      const localityId = getSubmissionLocalityCode(submission);
      byLocality.set(localityId, [...(byLocality.get(localityId) ?? []), submission]);
    }

    return Array.from(byLocality.entries()).map(([localityId, allSubmissions]) => {
      // Hồ sơ chuyên viên đã duyệt (SpecialistApproved) trở lên tính là đã nộp;
      // còn lại (Draft, LocalSubmitted, row tổng hợp) hiển thị như chưa nộp.
      const submissions = allSubmissions
        .filter(isRealSubmission)
        .filter((submission) => (COUNCIL_VISIBLE_STAGES as readonly string[]).includes(submission.currentStage));
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
        hasFinalized: allSubmissions.some((submission) => isRealSubmission(submission) && submission.currentStage === 'CommitteeFinalized'),
        ...totals,
        latestUpdatedAt: latestSubmission?.updatedAt ?? latestSubmission?.submittedAt ?? latestSubmission?.createdAt ?? null,
        latestStage: latestSubmission?.currentStage ?? null,
      };
    });
  }, [submissionsQuery.data]);

  const visibleRows = useMemo(() => rows
    // Địa phương đã công bố và không còn hồ sơ nào trong tầm Hội đồng thì ẩn hẳn,
    // tránh hiển thị nhầm thành "chưa nộp" (0/32).
    .filter((row) => row.submissions.length > 0 || !row.hasFinalized)
    // Tạm ẩn lọc theo trạng thái duyệt — Hội đồng chỉ xem hồ sơ.
    // .filter((row) => statusFilter === 'ALL' || row.latestStage === COUNCIL_STAGE)
    .filter((row) => !fromDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) <= new Date(`${toDate}T23:59:59`)), [fromDate, rows, toDate]);

  const columns = useMemo<ColumnDef<LocalityReviewRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.locality.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(220px,1.25fr)' } } },
    { id: 'submissionCount', accessorFn: (row) => row.submissions.length, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.submissions.length}/{totalAppliedGroups}</span>, meta: { align: 'center', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.maximumScore, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.maximumScore}</span>, meta: { align: 'right', sortable: true, list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.proposedTotal, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.proposedTotal}</span>, meta: { align: 'right', sortable: true, list: { width: 'minmax(160px,.9fr)' } } },
    { id: 'updatedAt', accessorFn: (row) => row.latestUpdatedAt ?? '', header: 'Cập nhật lần cuối', sortDescFirst: true, cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatUpdated(row.original)}</span>, meta: { sortable: true, list: { width: 'minmax(180px,1fr)' } } }
    // Tạm ẩn cột Trạng thái duyệt — Hội đồng chỉ xem hồ sơ; khôi phục cùng import ScoreStateBadge + Badge.
    // { id: 'state', accessorFn: (row) => row.submissions.length === 0 ? 'Chưa nộp' : row.latestStage === COUNCIL_STAGE ? 'Chờ duyệt' : 'Đã duyệt', header: 'Trạng thái duyệt', cell: ({ row }) => row.original.submissions.length === 0 ? <Badge variant="outline" className="text-muted-foreground">Chưa nộp</Badge> : row.original.latestStage === COUNCIL_STAGE ? <ScoreStateBadge state="CHO_DUYET_HOI_DONG" /> : <Badge variant="success">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(170px,.9fr)' } } },
  ], [totalAppliedGroups]);

  const openGroups = () => selectedRow && navigate(withCouncilPeriod(`/thi-dua/duyet/hoi-dong-tdkt/${selectedRow.locality.id}`));
  // Nhóm tiêu chí đã công bố (status Published) → hồ sơ khóa, không nhận xét thêm.
  const publishedGroupIds = useMemo(
    () => new Set((groupsQuery.data?.items ?? []).filter((group) => group.status === 'Published').map((group) => group.id)),
    [groupsQuery.data],
  );
  // Cũ: chỉ hồ sơ ở LeaderApproved mới cho nhận xét — submission.currentStage === COUNCIL_STAGE.
  const canCommentSubmission = (submission: SubmissionApi) =>
    (COUNCIL_COMMENT_STAGES as readonly string[]).includes(submission.currentStage) && !publishedGroupIds.has(submission.criteriaGroupId ?? '');
  const canProcessSelected = selectedRow?.submissions.some(canCommentSubmission) ?? false;
  const processSelectedSubmissions = async (processor: (submission: SubmissionApi) => Promise<unknown>, successMessage: string) => {
    if (!selectedRow) return;
    setActionPending(true);
    try {
      for (const submission of selectedRow.submissions.filter(canCommentSubmission)) await processor(submission);
      await invalidateQueryResources(queryClient, [getGetApiV1SubmissionsQueryKey()]);
      setSelectedRow(null);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xử lý hồ sơ đã chọn.');
    } finally {
      setActionPending(false);
    }
  };

  const saveComment = (comment: string) => processSelectedSubmissions(
    (submission) => specialistApi.comment({ submissionId: submission.id, reason: comment }),
    'Đã lưu nhận xét của Hội đồng vào lịch sử hồ sơ.',
  );

  const activeFilters = [
    // statusFilter !== 'ALL' ? { label: 'Trạng thái', value: 'Chờ Hội đồng duyệt', onClear: () => setStatusFilter('ALL') } : null, // tạm ẩn cùng bộ lọc trạng thái
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải danh sách địa phương…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được hồ sơ" description={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Vui lòng thử lại sau.'} />;

  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ do chuyên viên trưởng duyệt, Hội đồng thi đua xem xét và nhận xét." /* Tạm ẩn nút Lịch sử duyệt — Hội đồng chỉ xem hồ sơ. actions={<Button variant="outline" render={<Link to="/hoi-dong/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử duyệt</Button>} */ />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-2">{/* Tạm ẩn bộ lọc trạng thái duyệt — Hội đồng chỉ xem hồ sơ.<Select value={statusFilter} onValueChange={(value) => setStatusFilter((value ?? 'ALL') as CouncilStatusFilter)}><SelectTrigger aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="CHO_DUYET_HOI_DONG">Chờ Hội đồng duyệt</SelectItem></SelectContent></Select> */}<Input type="date" aria-label="Từ ngày duyệt" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày duyệt" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => setQueryFilters({ fromDate: '', toDate: '' })} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" hideWhen={!selectedRow} disabled={!selectedRow || actionPending} disabledReason="Chọn một địa phương để xem chi tiết." onClick={openGroups}><Eye className="mr-1.5 size-4" />Xem</Button><Button variant="outline" hideWhen={!selectedRow} disabled={!selectedRow || !canProcessSelected || actionPending} disabledReason={!selectedRow ? 'Chọn một địa phương để nhận xét.' : !canProcessSelected ? 'Hồ sơ đã chuyển cấp hoặc đã công bố nên không thể nhận xét.' : undefined} onClick={() => setCommentOpen(true)}><MessageSquare className="mr-1.5 size-4" />Nhận xét</Button>{/* Tạm ẩn nút Lịch sử — Hội đồng chỉ xem hồ sơ.<Button variant="outline" disabled={!selectedRow || actionPending} disabledReason="Chọn một địa phương để xem lịch sử duyệt." onClick={() => selectedRow && navigate('/hoi-dong/lich-su')}><History className="mr-1.5 size-4" />Lịch sử</Button> */}</div>} emptyState={{ title: 'Không có hồ sơ', description: 'Hiện chưa có hồ sơ được chuyển đến Hội đồng.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ hoặc đã được Hội đồng thi đua duyệt" />
    <RejectDialog open={commentOpen} onOpenChange={setCommentOpen} localityName={selectedRow?.locality.name} state="CHO_DUYET_HOI_DONG" title="Nhận xét địa phương" confirmLabel="Gửi nhận xét" confirmVariant="default" submitAction="approve" description="Nhận xét được lưu vào lịch sử hồ sơ và không làm thay đổi điểm hoặc trạng thái duyệt." reasonLabel="Nội dung nhận xét" reasonPlaceholder="Nhập nhận xét của Hội đồng về hồ sơ địa phương." onConfirm={saveComment} />
  </div>;
}
