import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, History, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isRealSubmission, specialistApi, type SubmissionApi, type SubmissionStage } from '@/features/cham-diem/api/specialistApi';

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
async function listEveryLeaderSubmission() {
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

function formatUpdated(row: LocalityReviewRow) {
  if (!row.latestUpdatedAt) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.latestUpdatedAt));
}

function getResultTotals(submissions: SubmissionApi[]) {
  return submissions.reduce((totals, submission) => submission.results.reduce((resultTotals, result) => ({
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const submissionsQuery = useQuery({
    queryKey: ['leader-submissions', { includeUnsubmitted: true }],
    queryFn: listEveryLeaderSubmission,
  });

  const groupsQuery = useQuery({
    queryKey: ['leader-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
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
    { id: 'state', accessorFn: (row) => row.submissions.length === 0 ? 'Chưa nộp' : row.latestStage === LEADER_STAGE ? 'Chờ duyệt' : 'Đã duyệt', header: 'Trạng thái duyệt', cell: ({ row }) => row.original.submissions.length === 0 ? <Badge variant="outline" className="text-muted-foreground">Chưa nộp</Badge> : row.original.latestStage === LEADER_STAGE ? <ScoreStateBadge state="CHO_DUYET_BAN" /> : <Badge variant="success">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(155px,.85fr)' } } },
    ], [totalAppliedGroups]);

  const openGroups = () => selectedRow && navigate(`/thi-dua/duyet/lanh-dao-ban/${banId}/${selectedRow.locality.id}`);
  const activeFilters = [
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải danh sách địa phương…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được hồ sơ" description={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Vui lòng thử lại sau.'} />;

  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ do chuyên viên chuyển lãnh đạo ban thẩm định." actions={<Button variant="outline" render={<Link to={`/thi-dua/duyet/lanh-dao-ban/${banId}/lich-su`} />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử duyệt</Button>} />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-2"><Input type="date" aria-label="Từ ngày cập nhật" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày cập nhật" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => { setFromDate(''); setToDate(''); }} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" disabled={!selectedRow} disabledReason="Chọn một địa phương để xem các nhóm tiêu chí." onClick={openGroups}><Eye className="mr-1.5 size-4" />Xem nhóm tiêu chí</Button><Button variant="outline" disabled={!selectedRow} disabledReason="Chọn một địa phương để xem lịch sử duyệt." onClick={() => selectedRow && navigate(`/thi-dua/duyet/lanh-dao-ban/${banId}/lich-su`)}><History className="mr-1.5 size-4" />Lịch sử</Button></div>} emptyState={{ title: 'Không có địa phương', description: 'Chưa có địa phương nào trong dữ liệu.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ SpecialistApproved chờ lãnh đạo ban thẩm định" />
  </div>;
}
