import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';

const LEADER_STAGE = 'SpecialistApproved' as const;
const LEADER_VISIBLE_STAGES = [LEADER_STAGE, 'LeaderApproved', 'CouncilApproved', 'CommitteeFinalized'] as const;

interface LeaderCriteriaGroupRow {
  groupId: string;
  groupName: string;
  groupContent: string;
  submission: SubmissionApi;
  proposedScore: number;
  proposedBonus: number;
  specialistScore: number;
  specialistBonus: number;
}

async function listEveryLeaderSubmission() {
  const pages = await Promise.all(LEADER_VISIBLE_STAGES.map((stage) => specialistApi.listAllSubmissions({ stage, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' })));
  return { items: pages.flatMap((page) => page.items).filter(isRealSubmission) };
}

function getLocalityCode(localityId: string) {
  return localityId.startsWith('loc-') ? localityId.slice(4) : localityId;
}

function getRowTotals(submission: SubmissionApi) {
  return submission.results.filter((result) => result.criteriaStatus !== 'Deleted').reduce((totals, result) => ({
    proposedScore: totals.proposedScore + result.point,
    proposedBonus: totals.proposedBonus + result.bonusPoint,
    specialistScore: totals.specialistScore + (result.officialPoint ?? result.point),
    specialistBonus: totals.specialistBonus + (result.officialBonusPoint ?? result.bonusPoint),
  }), { proposedScore: 0, proposedBonus: 0, specialistScore: 0, specialistBonus: 0 });
}

export default function BanLeaderCriteriaGroupsPage() {
  const { banId = 'ban1', localityId } = useParams<{ banId?: string; localityId?: string }>();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<LeaderCriteriaGroupRow | null>(null);

  const submissionsQuery = useQuery({
    queryKey: ['leader-submissions', { stage: LEADER_STAGE }],
    queryFn: listEveryLeaderSubmission,
  });
  const groupsQuery = useQuery({
    queryKey: ['leader-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  const localityCode = localityId ? getLocalityCode(localityId) : '';
  const localitySubmissions = useMemo(
    () => (submissionsQuery.data?.items ?? []).filter((submission) => (submission.createdByWardCode ?? submission.createdBy ?? '') === localityCode),
    [localityCode, submissionsQuery.data],
  );
  const groupById = useMemo(() => new Map((groupsQuery.data?.items ?? []).map((group) => [group.id, group])), [groupsQuery.data]);
  const localityName = localitySubmissions[0]?.localityFullName ?? localitySubmissions[0]?.createdByUsername ?? localityCode;

  const rows = useMemo<LeaderCriteriaGroupRow[]>(() => localitySubmissions.map((submission) => {
    const group = groupById.get(submission.criteriaGroupId);
    return {
      groupId: submission.criteriaGroupId,
      groupName: submission.criteriaGroupName ?? group?.name ?? submission.criteriaGroupId,
      groupContent: group?.content ?? '',
      submission,
      ...getRowTotals(submission),
    };
  }), [groupById, localitySubmissions]);

  const columns = useMemo<ColumnDef<LeaderCriteriaGroupRow>[]>(() => [
    { accessorFn: (row) => row.groupName, header: 'Nhóm tiêu chí', cell: ({ row }) => <p className="font-semibold text-foreground">{row.original.groupName}</p>, meta: { list: { width: 'minmax(240px,1.1fr)' } } },
    { accessorFn: (row) => row.groupContent, header: 'Nội dung', cell: ({ row }) => <p className="line-clamp-2 text-sm text-muted-foreground">{row.original.groupContent || '—'}</p>, meta: { list: { width: 'minmax(260px,1.3fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Điểm địa phương đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.specialistScore, header: 'Điểm chuyên viên chấm', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.specialistScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.specialistBonus, header: 'Điểm thưởng chuyên viên', cell: ({ row }) => <span className="tabular-nums">{row.original.specialistBonus}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { id: 'status', accessorFn: (row) => row.submission.currentStage === LEADER_STAGE ? 'Chờ duyệt' : 'Đã duyệt', header: 'Trạng thái', cell: ({ row }) => row.original.submission.currentStage === LEADER_STAGE ? <ScoreStateBadge state="CHO_DUYET_BAN" /> : <Badge variant="success">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);

  if (!localityId) return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không hợp lệ." />;
  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải hồ sơ và nhóm tiêu chí…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />;
  if (!localitySubmissions.length) return <EmptyState title="Không tìm thấy hồ sơ" description={`Không có submission SpecialistApproved cho địa phương ${localityCode}.`} />;

  const backToList = `/thi-dua/duyet/lanh-dao-ban/${banId}`;
  const openDetail = () => selectedRow && navigate(`${backToList}/chi-tiet/${selectedRow.groupId}/${localityId}`);

  return <div className="space-y-6">
    <PageHeader title={`Nhóm tiêu chí của ${localityName}`} description="Xem kết quả chấm điểm đã được chuyên viên chuyển lên lãnh đạo ban." actions={<Button variant="outline" render={<Link to={backToList} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên nhóm tiêu chí..." getRowId={(row) => row.groupId} selectedRowId={selectedRow?.groupId} onRowClick={setSelectedRow} toolbar={<div className="flex flex-wrap items-center gap-2"><Button disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem chi tiết." onClick={openDetail}><Eye className="mr-1.5 size-4" />Xem chi tiết chấm điểm</Button></div>} emptyState={{ title: 'Không có nhóm tiêu chí', description: 'Địa phương chưa có hồ sơ để hiển thị.', icon: <Search className="size-8" /> }} stickyTitle="Nhóm tiêu chí thi đua" stickyDescription={localityName} />
  </div>;
}
