import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button, DataTable, EmptyState, PageHeader, PageLoading } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { isRealSubmission, specialistApi, type SubmissionApi, type SubmissionStage } from '@/features/cham-diem/api/specialistApi';
import type { CriteriaGroupApi } from '@/features/admin/api/criteriaGroupsApi';

const STAGE_BADGE: Record<SubmissionStage, { label: string; variant: 'outline' | 'warning' | 'destructive' | 'info' | 'success' }> = {
  Draft: { label: 'Nháp', variant: 'outline' },
  LocalSubmitted: { label: 'Chờ chấm', variant: 'warning' },
  ScorerSubmitted: { label: 'Chờ review', variant: 'warning' },
  ReviewerApproved: { label: 'Đã review', variant: 'info' },
  RequiresRevision: { label: 'Yêu cầu chỉnh sửa', variant: 'destructive' },
  SpecialistApproved: { label: 'Đã chuyển lãnh đạo', variant: 'info' },
  LeaderApproved: { label: 'Đã chuyển hội đồng', variant: 'info' },
  CouncilApproved: { label: 'Đã chuyển ủy ban', variant: 'info' },
  CommitteeFinalized: { label: 'Đã duyệt', variant: 'success' },
};

interface LocalityScoreRow {
  code: string;
  name: string;
  submission: SubmissionApi;
  totalScore: number;
}

/** Lấy hết submissions của một nhóm tiêu chí, gộp mọi trang. */
async function listEverySubmissionByGroup(groupId: string) {
  const firstPage = await specialistApi.listSubmissionsByGroup(groupId, {
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listSubmissionsByGroup(groupId, {
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );
  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

/** Tầng 1: chọn nhóm tiêu chí. Tầng 2 (có :id): liệt kê địa phương đã nộp nhóm đó. */
export default function ScoreByCriteriaPage() {
  const { id: groupId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<LocalityScoreRow | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CriteriaGroupApi | null>(null);

  const groupsQuery = useQuery({
    queryKey: ['score-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
    enabled: !groupId,
  });
  const groupQuery = useQuery({
    queryKey: ['score-criteria-group', groupId],
    queryFn: () => specialistApi.getCriteriaGroup(groupId!),
    enabled: Boolean(groupId),
    retry: false,
  });
  const submissionsQuery = useQuery({
    queryKey: ['score-group-submissions', groupId],
    queryFn: () => listEverySubmissionByGroup(groupId!),
    enabled: Boolean(groupId) && groupQuery.isSuccess,
  });

  const groupColumns = useMemo<ColumnDef<CriteriaGroupApi>[]>(() => [
    { accessorFn: (group) => group.name, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorFn: (group) => group.status, header: 'Trạng thái', cell: ({ row }) => <Badge variant={row.original.status === 'Applied' || row.original.status === 'Published' ? 'success' : 'outline'}>{row.original.status}</Badge>, meta: { align: 'center', list: { width: 'minmax(140px,.7fr)' } } },
  ], []);

  const rows = useMemo<LocalityScoreRow[]>(() => (submissionsQuery.data?.items ?? [])
    .filter(isRealSubmission)
    .map((submission) => ({
      code: (submission.createdByWardCode ?? submission.createdBy ?? '').replace(/^loc-/i, ''),
      name: submission.localityFullName ?? submission.createdByUsername ?? 'Địa phương',
      submission,
      totalScore: submission.totalFinalPoint || submission.totalProposedPoint,
    })), [submissionsQuery.data]);

  const columns = useMemo<ColumnDef<LocalityScoreRow>[]>(() => [
    { accessorFn: (row) => row.name, header: 'Địa phương', cell: ({ row }) => <span className="font-medium">{row.original.name}</span>, meta: { list: { width: 'minmax(240px,1.4fr)' } } },
    { accessorFn: (row) => row.code, header: 'Mã', meta: { list: { width: 'minmax(120px,.7fr)' } } },
    { accessorFn: (row) => row.totalScore, header: 'Tổng điểm hiện tại', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.totalScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { id: 'stage', accessorFn: (row) => row.submission.currentStage, header: 'Trạng thái', cell: ({ row }) => { const badge = STAGE_BADGE[row.original.submission.currentStage]; return <Badge variant={badge.variant}>{badge.label}</Badge>; }, meta: { align: 'center', list: { width: 'minmax(190px,1fr)' } } },
  ], []);

  if (groupId ? groupQuery.isLoading : groupsQuery.isLoading) return <PageLoading label="Đang tải dữ liệu…" />;

  if (!groupId) {
    const groups = (groupsQuery.data?.items ?? []).filter((group) => group.status === 'Applied' || group.status === 'Published');
    return (
      <div className="space-y-6">
        <PageHeader title="Chấm điểm theo nhóm tiêu chí" description="Chọn một nhóm tiêu chí để xem danh sách địa phương đã nộp hồ sơ." />
        <DataTable
          data={groups}
          columns={groupColumns}
          pageSize={10}
          variant="list"
          searchable
          searchPlaceholder="Tìm tên nhóm tiêu chí..."
          getRowId={(group) => group.id}
          selectedRowId={selectedGroup?.id}
          onRowClick={setSelectedGroup}
          onRowDoubleClick={(group) => navigate(`/thi-dua/cham-diem/theo-tieu-chi/${group.id}`)}
          toolbar={<Button variant="info" disabled={!selectedGroup} disabledReason="Chọn một nhóm tiêu chí để xem địa phương." onClick={() => selectedGroup && navigate(`/thi-dua/cham-diem/theo-tieu-chi/${selectedGroup.id}`)}><Eye className="mr-1.5 size-4" />Xem địa phương</Button>}
          emptyState={{ title: 'Chưa có nhóm tiêu chí', description: 'Chưa có nhóm tiêu chí nào được áp dụng.', icon: <Search className="size-8" /> }}
          stickyTitle="Nhóm tiêu chí"
          stickyDescription="Chọn nhóm để xem địa phương"
        />
      </div>
    );
  }

  if (groupQuery.isError) {
    return <EmptyState
      title="Không tìm thấy nhóm tiêu chí"
      description="Nhóm tiêu chí này không tồn tại hoặc đã bị xóa."
      icon={<Search className="size-8" />}
      action={<Button variant="outline" render={<Link to="/thi-dua/cham-diem" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Về danh sách địa phương</Button>}
    />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={groupQuery.data?.name ?? 'Chấm điểm theo nhóm tiêu chí'}
        description="Chọn một địa phương để xem và chấm hồ sơ."
        actions={<Button variant="outline" render={<Link to="/thi-dua/cham-diem/theo-tieu-chi" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button>}
      />
      <DataTable
        data={rows}
        columns={columns}
        pageSize={10}
        variant="list"
        searchable
        searchPlaceholder="Tìm theo tên địa phương..."
        getRowId={(row) => row.code}
        selectedRowId={selectedRow?.code}
        onRowClick={setSelectedRow}
        onRowDoubleClick={(row) => navigate(`/thi-dua/cham-diem/${row.code}/${groupId}`)}
        toolbar={<Button variant="info" disabled={!selectedRow} disabledReason="Chọn một địa phương để xem và chấm hồ sơ." onClick={() => selectedRow && navigate(`/thi-dua/cham-diem/${selectedRow.code}/${groupId}`)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>}
        emptyState={{ title: 'Chưa có hồ sơ', description: 'Chưa có địa phương nào nộp hồ sơ cho nhóm tiêu chí này.', icon: <Search className="size-8" /> }}
        stickyTitle="Danh sách địa phương"
        stickyDescription={groupQuery.data?.name ?? ''}
      />
    </div>
  );
}
