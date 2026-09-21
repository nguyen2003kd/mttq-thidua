import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Search, Send, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading, ScoreStateBadge } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { filesApi } from '@/features/files/api/filesApi';
import { PublishResultModal } from '@/features/workflow/components';
import type { PublishResultValue } from '@/features/workflow/components/PublishResultModal';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';

const COMMITTEE_STAGE = 'CouncilApproved' as const;

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
  councilScore: number;
  councilBonus: number;
  latestUpdatedAt: string | null;
  latestUpdatedBy: string | null;
}

async function listEveryCommitteeSubmission() {
  const firstPage = await specialistApi.listAllSubmissions({
    stage: COMMITTEE_STAGE,
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listAllSubmissions({
      stage: COMMITTEE_STAGE,
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );

  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

function getResultTotals(submissions: SubmissionApi[]) {
  return submissions.reduce((totals, submission) => submission.results.reduce((resultTotals, result) => ({
    proposedScore: resultTotals.proposedScore + result.point,
    proposedBonus: resultTotals.proposedBonus + result.bonusPoint,
    councilScore: resultTotals.councilScore + (result.officialPoint ?? result.point),
    councilBonus: resultTotals.councilBonus + (result.officialBonusPoint ?? result.bonusPoint),
  }), totals), { proposedScore: 0, proposedBonus: 0, councilScore: 0, councilBonus: 0 });
}

/** Danh sách hồ sơ đã được Hội đồng thi đua duyệt và chuyển Ban Thường trực công bố. */
export default function CommitteeApprovalPage() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<LocalityReviewRow | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [publishRow, setPublishRow] = useState<LocalityReviewRow | null>(null);
  const [requestRow, setRequestRow] = useState<LocalityReviewRow | null>(null);
  const queryClient = useQueryClient();

  const requestRevisionMutation = useMutation({
    mutationFn: async ({ row, reason }: { row: LocalityReviewRow; reason: string }) => {
      await Promise.all(row.submissions.map((submission) => specialistApi.requestRevision({ submissionId: submission.id, reason })));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['committee-submissions'] });
      toast.success('Đã gửi yêu cầu đến Chuyên viên.');
      setRequestRow(null);
    },
    onError: () => toast.error('Không thể gửi yêu cầu bổ sung. Vui lòng thử lại.'),
  });

  const finalizeMutation = useMutation({
    mutationFn: async ({ row, value }: { row: LocalityReviewRow; value: PublishResultValue }) => {
      for (const submission of row.submissions) {
        await specialistApi.finalizeSubmission(submission.id);
        if (value.file) {
          await filesApi.upload(value.file, {
            entityType: 'FinalDecision',
            entityId: submission.id,
            category: 'publication-decision',
            description: value.comment || undefined,
          });
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['committee-submissions'] });
      toast.success('Đã công bố kết quả. Địa phương có thể xem kết quả chính thức.');
      setPublishRow(null);
    },
    onError: () => toast.error('Không thể công bố kết quả. Vui lòng thử lại.'),
  });

  const submissionsQuery = useQuery({
    queryKey: ['committee-submissions', { stage: COMMITTEE_STAGE }],
    queryFn: listEveryCommitteeSubmission,
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
        latestUpdatedBy: latestSubmission?.createdByUsername ?? null,
      };
    });
  }, [submissionsQuery.data]);

  const visibleRows = useMemo(() => rows
    .filter((row) => !fromDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || Boolean(row.latestUpdatedAt) && new Date(row.latestUpdatedAt!) <= new Date(`${toDate}T23:59:59`)), [fromDate, rows, toDate]);

  const columns = useMemo<ColumnDef<LocalityReviewRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold text-foreground">{row.original.locality.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(220px,1.25fr)' } } },
    { accessorFn: (row) => row.councilScore, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.councilScore}</span>, meta: { align: 'right', list: { width: 'minmax(130px,.8fr)' } } },
    { accessorFn: (row) => row.proposedScore, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedScore}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.9fr)' } } },
    { accessorFn: (row) => row.councilBonus, header: 'Tổng điểm thưởng', cell: ({ row }) => <span className="tabular-nums">{row.original.councilBonus}</span>, meta: { align: 'right', list: { width: 'minmax(155px,.85fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Tổng điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(205px,1fr)' } } },
    { id: 'state', accessorFn: () => COMMITTEE_STAGE, header: 'Trạng thái', cell: () => <ScoreStateBadge state="CHO_DUYET_BTT" />, meta: { align: 'center', list: { width: 'minmax(155px,.85fr)' } } },
  ], []);

  const activeFilters = [
    fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null,
    toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null,
  ].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item));

  if (submissionsQuery.isLoading) return <PageLoading label="Đang tải hồ sơ chờ Ban Thường trực duyệt…" />;
  if (submissionsQuery.isError) return <EmptyState variant="error" title="Không tải được hồ sơ" description={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Vui lòng thử lại sau.'} />;

  return <div className="space-y-6">
    <PageHeader title="Công bố kết quả — Ủy ban thường trực" description="Rà soát hồ sơ do Hội đồng chuyển đến, yêu cầu Chuyên viên bổ sung hoặc công bố kết quả cuối cùng." actions={<Button variant="outline" render={<Link to="/uy-ban/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử công bố</Button>} />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selectedRow?.locality.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-2"><Input type="date" aria-label="Từ ngày cập nhật" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày cập nhật" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={activeFilters} onClearFilters={() => { setFromDate(''); setToDate(''); }} toolbar={<div className="flex flex-wrap gap-2"><Button variant="info" disabled={!selectedRow} disabledReason="Chọn một địa phương để xem các nhóm tiêu chí." onClick={() => selectedRow && navigate(`/thi-dua/duyet/ban-thuong-truc/${selectedRow.locality.id}`)}><Search className="mr-1.5 size-4" />Xem nhóm tiêu chí</Button><Button variant="warning" disabled={!selectedRow || requestRevisionMutation.isPending} disabledReason={!selectedRow ? 'Chọn một địa phương để yêu cầu Chuyên viên bổ sung.' : undefined} onClick={() => selectedRow && setRequestRow(selectedRow)}><Send className="mr-1.5 size-4" />Yêu cầu Chuyên viên bổ sung</Button><Button className="bg-accent text-foreground hover:bg-accent/90" disabled={!selectedRow || finalizeMutation.isPending} disabledReason={!selectedRow ? 'Chọn một địa phương để công bố kết quả.' : undefined} onClick={() => selectedRow && setPublishRow(selectedRow)}><Trophy className="mr-1.5 size-4" />Công bố kết quả</Button></div>} emptyState={{ title: 'Không có hồ sơ chờ công bố', description: 'Hiện chưa có submission nào ở trạng thái CouncilApproved.', icon: <Search className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ Ủy ban thường trực công bố" />
    <RequestSpecialistDialog open={Boolean(requestRow)} onOpenChange={(open) => { if (!open) setRequestRow(null); }} localityName={requestRow?.locality.name} requesterLabel="Ủy ban thường trực" onConfirm={({ reason }) => requestRow ? requestRevisionMutation.mutateAsync({ row: requestRow, reason }) : Promise.resolve()} />
    <PublishResultModal open={Boolean(publishRow)} onOpenChange={(open) => { if (!open) setPublishRow(null); }} locality={publishRow ? { id: publishRow.locality.id, code: publishRow.locality.region, name: publishRow.locality.name, fullName: publishRow.locality.fullName, unitType: 'phuong', region: publishRow.locality.region } : undefined} record={publishRow ? { state: 'CHO_DUYET_BTT', entries: [], totalScore: publishRow.councilScore + publishRow.councilBonus, submittedAt: publishRow.latestUpdatedAt, publishedAt: null } : undefined} onPublish={(value) => publishRow ? finalizeMutation.mutateAsync({ row: publishRow, value }) : Promise.resolve()} />
  </div>;
}
