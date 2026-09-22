import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge, TruncatedText } from '@/components/core';
import { Button } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';

const COUNCIL_STAGE = 'LeaderApproved' as const;
const COUNCIL_VISIBLE_STAGES = [COUNCIL_STAGE, 'CouncilApproved', 'CommitteeFinalized'] as const;

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
  const pages = await Promise.all(COUNCIL_VISIBLE_STAGES.map((stage) => specialistApi.listAllSubmissions({ stage, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' })));
  return { items: pages.flatMap((page) => page.items).filter(isRealSubmission) };
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
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<CouncilCriteriaGroupRow | null>(null);

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
    { accessorFn: (row) => row.groupName, header: 'Nhóm tiêu chí', cell: ({ row }) => <TruncatedText as="p" value={row.original.groupName} maxLines={2} className="font-semibold leading-5 text-foreground" />, meta: { list: { width: 'minmax(240px,1.1fr)' }, disableTooltip: true } },
    { accessorFn: (row) => row.groupContent, header: 'Nội dung', cell: ({ row }) => <TruncatedText as="p" value={row.original.groupContent || '—'} maxLines={2} className="text-sm leading-5 text-muted-foreground" />, meta: { list: { width: 'minmax(260px,1.3fr)' }, disableTooltip: true } },
    { accessorFn: (row) => row.proposedScore, header: 'Điểm địa phương đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.leaderScore, header: 'Điểm lãnh đạo ban chấm', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.leaderScore}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.85fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.leaderBonus, header: 'Điểm thưởng lãnh đạo ban', cell: ({ row }) => <span className="tabular-nums">{row.original.leaderBonus}</span>, meta: { align: 'right', list: { width: 'minmax(170px,.9fr)' } } },
    { id: 'state', accessorFn: (row) => row.submission.currentStage === COUNCIL_STAGE ? 'Chờ duyệt' : 'Đã duyệt', header: 'Trạng thái', cell: ({ row }) => row.original.submission.currentStage === COUNCIL_STAGE ? <ScoreStateBadge state="CHO_DUYET_HOI_DONG" /> : <Badge variant="success">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);

  if (!localityId) return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không hợp lệ." />;
  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải hồ sơ và nhóm tiêu chí…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />;
  if (!localitySubmissions.length) return <EmptyState title="Không có hồ sơ" description="Địa phương này chưa có nhóm tiêu chí để Hội đồng theo dõi." />;

  return <div className="space-y-6">
    <PageHeader title={`Nhóm tiêu chí của ${localityName}`} description="Xem kết quả đã được lãnh đạo ban duyệt và chuyển Hội đồng thi đua." actions={<Button variant="outline" render={<Link to="/thi-dua/duyet/hoi-dong-tdkt" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên nhóm tiêu chí..." getRowId={(row) => row.groupId} selectedRowId={selectedRow?.groupId} onRowClick={setSelectedRow} onRowDoubleClick={(row) => navigate(`/thi-dua/duyet/hoi-dong-tdkt/${localityId}/${row.groupId}`)} toolbar={<Button variant="info" disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem thông tin." onClick={() => selectedRow && navigate(`/thi-dua/duyet/hoi-dong-tdkt/${localityId}/${selectedRow.groupId}`)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>} emptyState={{ title: 'Không có nhóm tiêu chí', description: 'Địa phương này hiện chưa có nhóm tiêu chí để Hội đồng theo dõi.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách nhóm tiêu chí" stickyDescription={localityName} />
  </div>;
}
