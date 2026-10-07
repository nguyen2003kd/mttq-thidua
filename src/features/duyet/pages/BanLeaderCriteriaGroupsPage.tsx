import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGetApiV1CriteriaGroupsQueryKey } from '@/api/endpoints/criteria-groups';
import { getGetApiV1PeriodsQueryKey } from '@/api/endpoints/periods';
import { getGetApiV1SubmissionsQueryKey } from '@/api/endpoints/submissions';
import { dataQueryKey } from '@/api/mutator/query-keys';
// import { useQueryClient } from '@tanstack/react-query'; // tạm ẩn cùng nút duyệt của Lãnh đạo ban
import { ArrowLeft, Eye, Search } from 'lucide-react';
// import { Send } from 'lucide-react'; // tạm ẩn cùng nút duyệt của Lãnh đạo ban
// import { toast } from 'sonner'; // tạm ẩn cùng nút duyệt của Lãnh đạo ban
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, PeriodSelect } from '@/components/core';
// import { ScoreStateBadge } from '@/components/core'; // tạm ẩn cùng cột Trạng thái
import { Button } from '@/components/core';
// import { Badge } from '@/components/ui/badge'; // tạm ẩn cùng cột Trạng thái
import { isRealSubmission, specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { periodsApi } from '@/features/admin/api/periodsApi';
import { usePeriodStore } from '@/store/periodStore';
// import { ForwardSubmissionDialog } from '@/features/workflow/components'; // tạm ẩn cùng nút duyệt của Lãnh đạo ban

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

async function listEveryLeaderSubmission(periodId?: string) {
  const pages = await Promise.all(LEADER_VISIBLE_STAGES.map((stage) => specialistApi.listAllSubmissions({ stage, periodId: periodId || undefined, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' })));
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
  // const queryClient = useQueryClient(); // tạm ẩn cùng nút duyệt của Lãnh đạo ban
  const [selectedRow, setSelectedRow] = useState<LeaderCriteriaGroupRow | null>(null);
  // const [forwardOpen, setForwardOpen] = useState(false); // tạm ẩn cùng nút duyệt của Lãnh đạo ban
  // Filter kỳ thi đua — dùng chung store kỳ với trang danh sách; BE lọc server-side qua periodId.
  const selectedPeriodId = usePeriodStore((state) => state.selectedPeriodId);
  const setSelectedPeriod = usePeriodStore((state) => state.setSelectedPeriod);
  const periodsQuery = useQuery({ queryKey: dataQueryKey(getGetApiV1PeriodsQueryKey(), 'options'), queryFn: periodsApi.listAll });
  const periodOptions = (periodsQuery.data ?? [])
    .filter((period) => period.status !== 'Draft')
    .map((period) => ({ value: period.id, label: period.name }));

  const submissionsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1SubmissionsQueryKey(), { view: 'leader-groups', stages: LEADER_VISIBLE_STAGES, periodId: selectedPeriodId || undefined }),
    queryFn: () => listEveryLeaderSubmission(selectedPeriodId || undefined),
  });
  const groupsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1CriteriaGroupsQueryKey(), { view: 'list', page: 1, pageSize: 100, periodId: selectedPeriodId || undefined }),
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100, periodId: selectedPeriodId || undefined }),
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
    { accessorFn: (row) => row.proposedScore, header: 'Điểm địa phương đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', sortable: true, list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.specialistScore, header: 'Điểm chuyên viên chấm', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.specialistScore}</span>, meta: { align: 'right', sortable: true, list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', sortable: true, list: { width: 'minmax(140px,.75fr)' } } },
    { accessorFn: (row) => row.specialistBonus, header: 'Điểm thưởng chuyên viên', cell: ({ row }) => <span className="tabular-nums">{row.original.specialistBonus}</span>, meta: { align: 'right', sortable: true, list: { width: 'minmax(150px,.8fr)' } } },
    // Tạm ẩn cột Trạng thái — Lãnh đạo ban chỉ xem hồ sơ; khôi phục cùng import ScoreStateBadge + Badge.
    // { id: 'status', accessorFn: (row) => row.submission.currentStage === LEADER_STAGE ? 'Chờ duyệt' : 'Đã duyệt', header: 'Trạng thái', cell: ({ row }) => row.original.submission.currentStage === LEADER_STAGE ? <ScoreStateBadge state="CHO_DUYET_BAN" /> : <Badge variant="success">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(150px,.8fr)' } } },
  ], []);

  if (!localityId) return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không hợp lệ." />;
  if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải hồ sơ và nhóm tiêu chí…" />;
  if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />;
  if (!localitySubmissions.length) return <EmptyState title="Không tìm thấy hồ sơ" description={`Không có submission SpecialistApproved cho địa phương ${localityCode}.`} />;

  const backToList = `/thi-dua/duyet/lanh-dao-ban/${banId}`;
  const openDetail = () => selectedRow && navigate(`${backToList}/chi-tiet/${selectedRow.groupId}/${localityId}`);

  /* Tạm ẩn hành động "Duyệt & trình Hội đồng" — Lãnh đạo ban chỉ xem hồ sơ.
   * Khôi phục: mở comment này, nút bấm + ForwardSubmissionDialog ở JSX,
   * state `forwardOpen`, `queryClient` và import Send/ForwardSubmissionDialog/toast/useQueryClient.
  const canForwardSelected = selectedRow?.submission.currentStage === LEADER_STAGE;
  const forwardToCouncil = async ({ explanation, files, onProgress }: { explanation: string; files: File[]; onProgress: (percent: number) => void }) => {
    if (!selectedRow) throw new Error('Vui lòng chọn một nhóm tiêu chí.');
    try {
      await specialistApi.forwardSubmission(selectedRow.submission.id, explanation, files, onProgress);
      const updatedSubmission = await specialistApi.getSubmission(selectedRow.submission.id);
      if (updatedSubmission.currentStage !== 'LeaderApproved') throw new Error(`Trạng thái sau khi duyệt không hợp lệ: ${updatedSubmission.currentStage}.`);
      await queryClient.invalidateQueries({ queryKey: ['leader-submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['leader-submissions-by-group'] });
      await queryClient.invalidateQueries({ queryKey: ['leader-approval-histories', selectedRow.submission.id] });
      toast.success('Đã duyệt và trình hồ sơ lên Hội đồng.');
      setForwardOpen(false);
      setSelectedRow(null);
      navigate(backToList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể duyệt hồ sơ.');
      throw error;
    }
  };
  */

  return <div className="space-y-6">
    <PageHeader title={`Nhóm tiêu chí của ${localityName}`} description="Xem kết quả chấm điểm đã được chuyên viên chuyển lên lãnh đạo ban." actions={<div className="flex flex-wrap items-center gap-2"><PeriodSelect value={selectedPeriodId ?? ''} onChange={(value) => setSelectedPeriod(value || null)} options={periodOptions} /><Button variant="back" render={<Link to={backToList} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button></div>} />
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm tên nhóm tiêu chí..." getRowId={(row) => row.groupId} selectedRowId={selectedRow?.groupId} onRowClick={setSelectedRow} toolbar={<div className="flex flex-wrap items-center gap-2"><Button variant="info" hideWhen={!selectedRow} disabled={!selectedRow} disabledReason="Chọn một nhóm tiêu chí để xem chi tiết." onClick={openDetail}><Eye className="mr-1.5 size-4" />Xem chi tiết chấm điểm</Button>{/* Tạm ẩn nút duyệt của Lãnh đạo ban.
{selectedRow && <Button disabled={!canForwardSelected} disabledReason="Hồ sơ đã chuyển cấp nên không thể duyệt lại." onClick={() => setForwardOpen(true)}><Send className="mr-1.5 size-4" />Duyệt &amp; trình Hội đồng</Button>} */}</div>} emptyState={{ title: 'Không có nhóm tiêu chí', description: 'Địa phương chưa có hồ sơ để hiển thị.', icon: <Search className="size-8" /> }} stickyTitle="Nhóm tiêu chí thi đua" stickyDescription={localityName} />
    {/* Tạm ẩn cùng nút duyệt của Lãnh đạo ban.
    <ForwardSubmissionDialog open={forwardOpen} onOpenChange={setForwardOpen} localityName={localityName} groupName={selectedRow?.groupName ?? ''} targetLabel="Hội đồng Thi đua - Khen thưởng" explanationLabel="Diễn giải hồ sơ từ Lãnh đạo ban" onConfirm={forwardToCouncil} /> */}
  </div>;
}
