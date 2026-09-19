import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { CouncilSubmissionDetailDialog } from '@/features/duyet/components/CouncilSubmissionDetailDialog';

const COUNCIL_STAGE = 'LeaderApproved' as const;

interface CouncilCriteriaGroupRow {
  groupId: string;
  groupName: string;
  groupContent: string;
  submission: SubmissionApi;
  proposedScore: number;
  proposedBonus: number;
  leaderScore: number;
  leaderBonus: number;
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

  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

function getLocalityCode(localityId: string) {
  return localityId.startsWith('loc-') ? localityId.slice(4) : localityId;
}

function getRowTotals(submission: SubmissionApi) {
  return submission.results.reduce((totals, result) => ({
    proposedScore: totals.proposedScore + result.point,
    proposedBonus: totals.proposedBonus + result.bonusPoint,
    leaderScore: totals.leaderScore + (result.officialPoint ?? result.point),
    leaderBonus: totals.leaderBonus + (result.officialBonusPoint ?? result.bonusPoint),
  }), { proposedScore: 0, proposedBonus: 0, leaderScore: 0, leaderBonus: 0 });
}

/** Lớp 2 read-only của Hội đồng; dữ liệu lấy từ các submission LeaderApproved. */
export default function CouncilCriteriaGroupsPage() {
  const { localityId } = useParams<{ localityId?: string }>();
  const [selectedRow, setSelectedRow] = useState<CouncilCriteriaGroupRow | null>(null);
  const [viewing, setViewing] = useState<CouncilCriteriaGroupRow | null>(null);

  const submissionsQuery = useQuery({
    queryKey: ['council-submissions', { stage: COUNCIL_STAGE }],
    queryFn: listEveryCouncilSubmission,
  });
  const groupsQuery = useQuery({
    queryKey: ['council-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  const localityCode = localityId ? getLocalityCode(localityId) : '';
  const localitySubmissions = useMemo(
    () => (submissionsQuery.data?.items ?? []).filter((submission) => (submission.createdByWardCode ?? submission.createdBy ?? '') === localityCode),
    [localityCode, submissionsQuery.data],
  );
  const groupById = useMemo(() => new Map((groupsQuery.data?.items ?? []).map((group) => [group.id, group])), [groupsQuery.data]);
  const localityName = localitySubmissions[0]?.localityFullName ?? localitySubmissions[0]?.createdByUsername ?? localityCode;

  const rows = useMemo<CouncilCriteriaGroupRow[]>(() => localitySubmissions.map((submission) => {
    const group = groupById.get(submission.criteriaGroupId);
    return {
      groupId: submission.criteriaGroupId,
      groupName: submission.criteriaGroupName ?? group?.name ?? submission.criteriaGroupId,
      groupContent: group?.content ?? '',
      submission,
      ...getRowTotals(submission),
    };
  }), [groupById, localitySubmissions]);

  const columns = useMemo<ColumnDef<CouncilCriteriaGroupRow>[]>(() => [
    { accessorFn: (row) => row.groupName, header: 'Nhóm tiêu chí', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.groupName}</p><p className="mt-1 text-xs text-muted-foreground">{row.original.groupId}</p></div>, meta: { list: { width: 'minmax(240px,1.1fr)' } } },
    { accessorFn: (row) => row.groupContent, header: 'Nội dung', cell: ({ row }) => <p className="line-clamp-2 text-sm text-muted-foreground">{row.original.groupContent || '—'}</p>, meta: { list: { width: 'minmax(260px,1.3fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Điểm địa phương đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.leaderScore, header: 'Điểm lãnh đạo ban chấm', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.leaderScore}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.85fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.leaderBonus, header: 'Điểm thưởng lãnh đạo ban', cell: ({ row }) => <span className="tabular-nums">{row.original.leaderBonus}</span>, meta: { align: 'right', list: { width: 'minmax(170px,.9fr)' } } },
    { id: 'state', accessorFn: () => COUNCIL_STAGE, header: 'Trạng thái', cell: () => <ScoreStateBadge state="CHO_DUYET_HOI_DONG" />, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);

  if (!localityId) return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không hợp lệ." />;
  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải hồ sơ và nhóm tiêu chí…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />;
  if (!localitySubmissions.length) return <EmptyState title="Không tìm thấy hồ sơ" description={`Không có submission LeaderApproved cho địa phương ${localityCode}.`} />;

  return <div className="space-y-6">
    <PageHeader title={`Nhóm tiêu chí của ${localityName}`} description="Xem kết quả đã được lãnh đạo ban duyệt và chuyển Hội đồng thi đua." actions={<Button variant="outline" render={<Link to="/thi-dua/duyet/hoi-dong-tdkt" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên nhóm tiêu chí..." getRowId={(row) => row.groupId} selectedRowId={selectedRow?.groupId} onRowClick={setSelectedRow} toolbar={<Button variant="info" disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem thông tin." onClick={() => setViewing(selectedRow)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>} emptyState={{ title: 'Không có nhóm tiêu chí chờ duyệt', description: 'Địa phương này hiện không có nhóm tiêu chí ở bước Hội đồng.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách nhóm tiêu chí" stickyDescription={localityName} />
    <CouncilSubmissionDetailDialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} submission={viewing?.submission ?? null} group={viewing ? groupById.get(viewing.groupId) : undefined} />
  </div>;
}
