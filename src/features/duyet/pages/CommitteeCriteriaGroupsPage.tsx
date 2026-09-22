import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Button, DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge, TruncatedText } from '@/components/core';
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';

const COMMITTEE_STAGE = 'CouncilApproved' as const;

interface CommitteeCriteriaGroupRow {
  groupId: string;
  groupName: string;
  groupContent: string;
  submission: SubmissionApi;
  proposedScore: number;
  proposedBonus: number;
  officialScore: number;
  officialBonus: number;
}

async function listEveryCommitteeSubmission() {
  const firstPage = await specialistApi.listAllSubmissions({ stage: COMMITTEE_STAGE, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;
  const pages = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listAllSubmissions({ stage: COMMITTEE_STAGE, page: index + 2, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' })));
  return { ...firstPage, items: [firstPage.items, ...pages.flatMap((page) => page.items)].flat().filter(isRealSubmission) };
}

function getLocalityCode(localityId: string) { return localityId.startsWith('loc-') ? localityId.slice(4) : localityId; }

function getTotals(submission: SubmissionApi) {
  return submission.results.reduce((totals, result) => ({
    proposedScore: totals.proposedScore + result.point,
    proposedBonus: totals.proposedBonus + result.bonusPoint,
    officialScore: totals.officialScore + (result.officialPoint ?? result.point),
    officialBonus: totals.officialBonus + (result.officialBonusPoint ?? result.bonusPoint),
  }), { proposedScore: 0, proposedBonus: 0, officialScore: 0, officialBonus: 0 });
}

/** Lớp 2 COL.01.11: mỗi nhóm tiêu chí được xem trước khi Ban Thường trực công bố. */
export default function CommitteeCriteriaGroupsPage() {
  const { localityId } = useParams<{ localityId?: string }>();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<CommitteeCriteriaGroupRow | null>(null);
  const submissionsQuery = useQuery({ queryKey: ['committee-submissions', { stage: COMMITTEE_STAGE }], queryFn: listEveryCommitteeSubmission });
  const groupsQuery = useQuery({ queryKey: ['committee-criteria-groups'], queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }) });
  const localityCode = localityId ? getLocalityCode(localityId) : '';
  const submissions = useMemo(() => (submissionsQuery.data?.items ?? []).filter((item) => (item.createdByWardCode ?? item.createdBy ?? '') === localityCode), [localityCode, submissionsQuery.data]);
  const groups = useMemo(() => new Map((groupsQuery.data?.items ?? []).map((group) => [group.id, group])), [groupsQuery.data]);
  const localityName = submissions[0]?.localityFullName ?? submissions[0]?.createdByUsername ?? localityCode;
  const rows = useMemo<CommitteeCriteriaGroupRow[]>(() => submissions.map((submission) => {
    const group = groups.get(submission.criteriaGroupId);
    return { groupId: submission.criteriaGroupId, groupName: submission.criteriaGroupName ?? group?.name ?? submission.criteriaGroupId, groupContent: group?.content ?? '', submission, ...getTotals(submission) };
  }), [groups, submissions]);
  const columns = useMemo<ColumnDef<CommitteeCriteriaGroupRow>[]>(() => [
    { accessorFn: (row) => row.groupName, header: 'Nhóm tiêu chí', cell: ({ row }) => <TruncatedText as="p" value={row.original.groupName} maxLines={2} className="font-semibold leading-5" />, meta: { list: { width: 'minmax(250px,1.15fr)' }, disableTooltip: true } },
    { accessorFn: (row) => row.groupContent, header: 'Nội dung', cell: ({ row }) => <TruncatedText as="p" value={row.original.groupContent || '—'} maxLines={2} className="text-sm leading-5 text-muted-foreground" />, meta: { list: { width: 'minmax(280px,1.3fr)' }, disableTooltip: true } },
    { accessorFn: (row) => row.proposedScore, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.officialScore, header: 'Tổng điểm thực tế', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.officialScore}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.officialBonus, header: 'Tổng điểm thưởng', cell: ({ row }) => <span className="tabular-nums">{row.original.officialBonus}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { id: 'state', header: 'Trạng thái', cell: () => <ScoreStateBadge state="CHO_DUYET_BTT" />, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);
  if (!localityId) return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không hợp lệ." />;
  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải các nhóm tiêu chí…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />;
  if (!submissions.length) return <EmptyState title="Không tìm thấy hồ sơ" description="Địa phương này chưa có nhóm tiêu chí chờ công bố." />;
  const openDetail = (row: CommitteeCriteriaGroupRow) => navigate(`/thi-dua/duyet/ban-thuong-truc/${localityId}/${row.groupId}`);
  return <div className="space-y-6">
    <PageHeader title={`Nhóm tiêu chí của ${localityName}`} description="Chọn một nhóm để đối chiếu chi tiết các tiêu chí con trước khi công bố." actions={<Button variant="outline" render={<Link to="/thi-dua/duyet/ban-thuong-truc" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên nhóm tiêu chí..." getRowId={(row) => row.groupId} selectedRowId={selectedRow?.groupId} onRowClick={setSelectedRow} onRowDoubleClick={openDetail} toolbar={<Button variant="info" disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem chi tiết." onClick={() => selectedRow && openDetail(selectedRow)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>} emptyState={{ title: 'Không có nhóm tiêu chí', description: 'Không có nhóm nào ở bước chờ công bố.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách nhóm tiêu chí" stickyDescription={localityName} />
  </div>;
}
