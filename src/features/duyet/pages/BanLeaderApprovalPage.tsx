import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1CriteriaGroupsQueryKey } from '@/api/endpoints/criteria-groups';
import { getGetApiV1PeriodsQueryKey } from '@/api/endpoints/periods';
import { getGetApiV1SubmissionsQueryKey } from '@/api/endpoints/submissions';
import { dataQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';
import { Eye, MessageSquare, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, PeriodSelect, RejectDialog } from '@/components/core';
// import { ScoreStateBadge } from '@/components/core'; // tạm ẩn cùng cột Trạng thái duyệt
import { Button } from '@/components/core';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge'; // tạm ẩn cùng cột Trạng thái duyệt
import { isRealSubmission, specialistApi, type SubmissionApi, type SubmissionStage } from '@/features/cham-diem/api/specialistApi';
import { periodsApi } from '@/features/admin/api/periodsApi';
import { usePeriodStore } from '@/store/periodStore';

const LEADER_STAGE = 'SpecialistApproved' as const;
const LEADER_VISIBLE_STAGES = [LEADER_STAGE, 'LeaderApproved', 'CouncilApproved', 'CommitteeFinalized'] as const;

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
  specialistScore: number;
  specialistBonus: number;
  latestUpdatedAt: string | null;
  latestStage: SubmissionStage | null;
}

// Gọi API y hệt trang /chuyen-vien/duyet: một endpoint /api/v1/submissions,
// includeUnsubmitted=true để địa phương chưa nộp vẫn xuất hiện, gộp tất cả trang.
async function listEveryLeaderSubmission(periodId?: string) {
  const firstPage = await specialistApi.listAllSubmissions({
    includeUnsubmitted: true,
    periodId: periodId || undefined,
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
      periodId: periodId || undefined,
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

function formatUpdated(row: LocalityReviewRow) {
  if (!row.latestUpdatedAt) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.latestUpdatedAt));
}

function getResultTotals(submissions: SubmissionApi[]) {
  return submissions.reduce((totals, submission) => submission.results.filter((result) => result.criteriaStatus !== 'Deleted').reduce((resultTotals, result) => ({
    proposedScore: resultTotals.proposedScore + result.point,
    proposedBonus: resultTotals.proposedBonus + result.bonusPoint,
    specialistScore: resultTotals.specialistScore + (result.officialPoint ?? result.point),
    specialistBonus: resultTotals.specialistBonus + (result.officialBonusPoint ?? result.bonusPoint),
  }), totals), { proposedScore: 0, proposedBonus: 0, specialistScore: 0, specialistBonus: 0 });
}

/** Danh sách hồ sơ đã được chuyên viên duyệt và chuyển lên lãnh đạo ban. */
export default function BanLeaderApprovalPage() {
  const { banId = 'ban1' } = useParams<{ banId?: string }>();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<LocalityReviewRow | null>(null);
  const {
    filters: { fromDate, toDate },
    setters: { fromDate: setFromDate, toDate: setToDate },
    setFilters: setQueryFilters,
  } = useQueryFilters({ fromDate: '', toDate: '' });
  const [commentOpen, setCommentOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const queryClient = useQueryClient();
  // Filter kỳ thi đua — dùng chung store kỳ với các trang khác; BE lọc server-side qua periodId.
  const selectedPeriodId = usePeriodStore((state) => state.selectedPeriodId);
  const setSelectedPeriod = usePeriodStore((state) => state.setSelectedPeriod);
  const periodsQuery = useQuery({ queryKey: dataQueryKey(getGetApiV1PeriodsQueryKey(), 'options'), queryFn: periodsApi.listAll });
  const periodOptions = (periodsQuery.data ?? [])
    .filter((period) => period.status !== 'Draft')
    .map((period) => ({ value: period.id, label: period.name }));

  const submissionsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1SubmissionsQueryKey(), { view: 'all', includeUnsubmitted: true, periodId: selectedPeriodId || undefined, sortBy: 'createdAt', sortOrder: 'desc' }),
    queryFn: () => listEveryLeaderSubmission(selectedPeriodId || undefined),
  });

  const groupsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1CriteriaGroupsQueryKey(), { view: 'list', page: 1, pageSize: 100 }),
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  const totalAppliedGroups = useMemo(
    () => (groupsQuery.data?.items ?? [])
      .filter((g) => (g.status === 'Applied' || g.status === 'Published') && (!selectedPeriodId || g.periodId === selectedPeriodId))
      .length,
    [groupsQuery.data, selectedPeriodId],
  );

  const rows = useMemo<LocalityReviewRow[]>(() => {
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const submission of submissionsQuery.data?.items ?? []) {
      const localityId = getSubmissionLocalityCode(submission);
      byLocality.set(localityId, [...(byLocality.get(localityId) ?? []), submission]);
    }

    return Array.from(byLocality.entries()).map(([localityId, allSubmissions]) => {
      // Chỉ hồ sơ đã tới cấp lãnh đạo ban mới tính là đã nộp; còn lại (Draft,
      // LocalSubmitted, row tổng hợp hasSubmission=false) hiển thị như chưa nộp.
      const submissions = allSubmissions
        .filter(isRealSubmission)
        .filter((submission) => (LEADER_VISIBLE_STAGES as readonly string[]).includes(submission.currentStage));
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
        latestStage: latestSubmission?.currentStage ?? null,
      };
    });
  }, [submissionsQuery.data]);

  const visibleRows = useMemo(() => rows
    .filter((row) => !fromDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) <= new Date(`${toDate}T23:59:59`)), [fromDate, rows, toDate]);

  const columns = useMemo<ColumnDef<LocalityReviewRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.locality.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(220px,1.25fr)' } } },
    { id: 'submissionCount', accessorFn: (row) => row.submissions.length, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.submissions.length}/{totalAppliedGroups}</span>, meta: { align: 'center', list: { width: 'minmax(140px,.8fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Điểm địa phương đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', headerClassName: 'w-full whitespace-normal text-center leading-4', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.specialistScore, header: 'Điểm chuyên viên chấm', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.specialistScore}</span>, meta: { align: 'right', headerClassName: 'w-full whitespace-normal text-center leading-4', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', headerClassName: 'w-full whitespace-normal text-center leading-4', list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.specialistBonus, header: 'Điểm thưởng chuyên viên', cell: ({ row }) => <span className="tabular-nums">{row.original.specialistBonus}</span>, meta: { align: 'right', headerClassName: 'w-full whitespace-normal text-center leading-4', list: { width: 'minmax(160px,.85fr)' } } },
    { id: 'specialistTotal', accessorFn: (row) => row.specialistScore + row.specialistBonus, header: 'Tổng điểm chuyên viên', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.specialistScore + row.original.specialistBonus}</span>, meta: { align: 'right', headerClassName: 'w-full whitespace-normal text-center leading-4', list: { width: 'minmax(170px,.9fr)' } } },
    { id: 'proposedTotal', accessorFn: (row) => row.proposedScore + row.proposedBonus, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.proposedScore + row.original.proposedBonus}</span>, meta: { align: 'right', headerClassName: 'w-full whitespace-normal text-center leading-4', list: { width: 'minmax(140px,.8fr)' } } },
    { id: 'updatedAt', accessorFn: formatUpdated, header: 'Cập nhật lần cuối', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatUpdated(row.original)}</span>, meta: { list: { width: 'minmax(180px,1fr)' } } },
    // Tạm ẩn cột Trạng thái duyệt — Lãnh đạo ban chỉ xem hồ sơ; khôi phục cùng import ScoreStateBadge + Badge.
    // { id: 'state', accessorFn: (row) => row.submissions.length === 0 ? 'Chưa nộp' : row.latestStage === LEADER_STAGE ? 'Chờ duyệt' : 'Đã duyệt', header: 'Trạng thái duyệt', cell: ({ row }) => row.original.submissions.length === 0 ? <Badge variant="outline" className="text-muted-foreground">Chưa nộp</Badge> : row.original.latestStage === LEADER_STAGE ? <ScoreStateBadge state="CHO_DUYET_BAN" /> : <Badge variant="success">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(155px,.85fr)' } } },
    ], [totalAppliedGroups]);

  const openGroups = () => selectedRow && navigate(`/thi-dua/duyet/lanh-dao-ban/${banId}/${selectedRow.locality.id}`);
  // Nhóm tiêu chí đã công bố (status Published) → hồ sơ khóa, không nhận xét thêm.
  const publishedGroupIds = useMemo(
    () => new Set((groupsQuery.data?.items ?? []).filter((group) => group.status === 'Published').map((group) => group.id)),
    [groupsQuery.data],
  );
  // Cũ: chỉ kiểm tra stage — submission.currentStage === LEADER_STAGE.
  const canCommentSubmission = (submission: SubmissionApi) =>
    submission.currentStage === LEADER_STAGE && !publishedGroupIds.has(submission.criteriaGroupId ?? '');
  const canCommentSelected = selectedRow?.submissions.some(canCommentSubmission) ?? false;
  const saveComment = async (comment: string) => {
    if (!selectedRow) return;
    setActionPending(true);
    try {
      for (const submission of selectedRow.submissions.filter(canCommentSubmission)) {
        await specialistApi.comment({ submissionId: submission.id, reason: comment });
      }
      await invalidateQueryResources(queryClient, [getGetApiV1SubmissionsQueryKey()]);
      setSelectedRow(null);
      toast.success('Đã lưu nhận xét của Lãnh đạo ban vào lịch sử hồ sơ.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu nhận xét. Vui lòng thử lại.');
      throw error;
    } finally {
      setActionPending(false);
    }
  };
  const activeFilters = [
    ...(selectedPeriodId ? [{ label: 'Kỳ thi đua', value: periodsQuery.data?.find((period) => period.id === selectedPeriodId)?.name ?? selectedPeriodId, onClear: () => setSelectedPeriod(null) }] : []),
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  const periodSelector = (
    <PeriodSelect
      value={selectedPeriodId ?? ''}
      onChange={(value) => setSelectedPeriod(value || null)}
      options={periodOptions}
    />
  );

  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải danh sách địa phương…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được hồ sơ" description={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Vui lòng thử lại sau.'} />;

  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ do chuyên viên chuyển lãnh đạo ban thẩm định." actions={periodSelector} />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-2"><Input type="date" aria-label="Từ ngày cập nhật" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày cập nhật" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => setQueryFilters({ fromDate: '', toDate: '' })} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" hideWhen={!selectedRow} disabled={!selectedRow} disabledReason="Chọn một địa phương để xem các nhóm tiêu chí." onClick={openGroups}><Eye className="mr-1.5 size-4" />Xem nhóm tiêu chí</Button><Button variant="outline" hideWhen={!selectedRow} disabled={!selectedRow || !canCommentSelected || actionPending} disabledReason={!selectedRow ? 'Chọn một địa phương để nhận xét.' : !canCommentSelected ? 'Hồ sơ đã chuyển cấp hoặc đã công bố nên không thể nhận xét.' : undefined} onClick={() => setCommentOpen(true)}><MessageSquare className="mr-1.5 size-4" />Nhận xét</Button></div>} emptyState={{ title: 'Không có địa phương', description: 'Chưa có địa phương nào trong dữ liệu.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ SpecialistApproved chờ lãnh đạo ban thẩm định" />
    <RejectDialog open={commentOpen} onOpenChange={setCommentOpen} localityName={selectedRow?.locality.name} state="CHO_DUYET_BAN" title="Nhận xét địa phương" confirmLabel="Gửi nhận xét" confirmVariant="default" submitAction="approve" description="Nhận xét được lưu vào lịch sử hồ sơ và không làm thay đổi điểm hoặc trạng thái duyệt." reasonLabel="Nội dung nhận xét" reasonPlaceholder="Nhập nhận xét của Lãnh đạo ban về hồ sơ địa phương." onConfirm={saveComment} />
  </div>;
}
