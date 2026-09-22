import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader, PageLoading } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { isRealSubmission, specialistApi, type ApprovalHistoryApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { CouncilSubmissionDetailDialog } from '@/features/duyet/components/CouncilSubmissionDetailDialog';

interface CouncilHistoryRow {
  id: string;
  submission: SubmissionApi;
  history: ApprovalHistoryApi;
  groupName: string;
  localityName: string;
}

async function listEverySubmission() {
  const firstPage = await specialistApi.listAllSubmissions({
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listAllSubmissions({
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );

  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat().filter(isRealSubmission) };
}

function getActionLabel(action: string) {
  switch (action.toLowerCase()) {
    case 'approve': return 'Duyệt';
    case 'updatescore': return 'Nhận xét';
    case 'requestrevision': return 'Yêu cầu chỉnh sửa';
    default: return action;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

/** COL.01.10 — Lịch sử duyệt tiêu chí thi đua của Hội đồng. */
export default function CouncilHistoryPage() {
  const [selectedRow, setSelectedRow] = useState<CouncilHistoryRow | null>(null);
  const [viewingRow, setViewingRow] = useState<CouncilHistoryRow | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const groupsQuery = useQuery({
    queryKey: ['council-history-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });
  const historiesQuery = useQuery({
    queryKey: ['council-approval-history'],
    queryFn: async () => {
      const submissions = await listEverySubmission();
      const historyPages = await Promise.all(submissions.items.map(async (submission) => {
        const histories = await specialistApi.listApprovalHistories(submission.id, { page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' });
        return histories.items
          .filter((history) => history.actorRole.toUpperCase() === 'COUNCIL')
          .map((history): CouncilHistoryRow => ({
            id: history.id,
            submission,
            history,
            groupName: submission.criteriaGroupName ?? submission.criteriaGroupId,
            localityName: submission.localityFullName ?? submission.createdByUsername ?? submission.createdBy ?? 'Địa phương',
          }));
      }));
      return historyPages.flat().sort((left, right) => +new Date(right.history.createdAt) - +new Date(left.history.createdAt));
    },
  });

  const groupById = useMemo(() => new Map((groupsQuery.data?.items ?? []).map((group) => [group.id, group])), [groupsQuery.data]);
  const visibleRows = useMemo(() => (historiesQuery.data ?? [])
    .filter((row) => !fromDate || new Date(row.history.createdAt) >= new Date(`${fromDate}T00:00:00`))
    .filter((row) => !toDate || new Date(row.history.createdAt) <= new Date(`${toDate}T23:59:59`)), [fromDate, historiesQuery.data, toDate]);

  const columns = useMemo<ColumnDef<CouncilHistoryRow>[]>(() => [
    { accessorFn: (row) => row.localityName, header: 'Địa phương', cell: ({ row }) => <span className="font-medium">{row.original.localityName}</span>, meta: { list: { width: 'minmax(220px,1.2fr)' } } },
    { accessorFn: (row) => row.groupName, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="font-medium">{row.original.groupName}</span>, meta: { list: { width: 'minmax(240px,1.3fr)' } } },
    { accessorFn: (row) => getActionLabel(row.history.action), header: 'Thao tác', cell: ({ row }) => <span className="font-medium">{getActionLabel(row.original.history.action)}</span>, meta: { align: 'center', list: { width: 'minmax(170px,.9fr)' } } },
    { accessorFn: (row) => row.history.createdAt, header: 'Ngày duyệt', cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.history.createdAt)}</span>, meta: { list: { width: 'minmax(170px,.9fr)' } } },
    { accessorFn: (row) => row.history.actorName, header: 'Người duyệt', cell: ({ row }) => <span>{row.original.history.actorName}</span>, meta: { list: { width: 'minmax(170px,.9fr)' } } },
    { accessorFn: (row) => row.history.reason ?? '', header: 'Lý do / nhận xét', cell: ({ row }) => <p className="line-clamp-2 text-sm text-muted-foreground">{row.original.history.reason || '—'}</p>, meta: { list: { width: 'minmax(240px,1.2fr)' } } },
  ], []);

  const isLoading = groupsQuery.isLoading || historiesQuery.isLoading;
  const isError = groupsQuery.isError || historiesQuery.isError;
  if (isLoading) return <PageLoading label="Đang tải lịch sử duyệt…" />;
  if (isError) return <EmptyState variant="error" title="Không tải được lịch sử" description="Vui lòng thử lại sau." />;

  return <div className="space-y-6">
    <PageHeader title="Lịch sử duyệt tiêu chí" description="Theo dõi các lần Hội đồng nhận xét, yêu cầu chỉnh sửa và phê duyệt hồ sơ." actions={<Button variant="outline" render={<Link to="/thi-dua/duyet/hoi-dong-tdkt" />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại danh sách</Button>} />
    <DataTable data={visibleRows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm địa phương, nhóm tiêu chí, người duyệt..." getRowId={(row) => row.id} selectedRowId={selectedRow?.id} onRowClick={setSelectedRow} filters={<div className="grid gap-2 sm:grid-cols-2"><Input type="date" aria-label="Từ ngày duyệt" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" aria-label="Đến ngày duyệt" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>} activeFilters={[fromDate ? { label: 'Từ ngày', value: fromDate, onClear: () => setFromDate('') } : null, toDate ? { label: 'Đến ngày', value: toDate, onClear: () => setToDate('') } : null].filter((item): item is { label: string; value: string; onClear: () => void } => Boolean(item))} onClearFilters={() => { setFromDate(''); setToDate(''); }} toolbar={<Button variant="info" disabled={!selectedRow} disabledReason="Chọn một bản ghi để xem chi tiết." onClick={() => setViewingRow(selectedRow)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>} emptyState={{ title: 'Chưa có lịch sử duyệt', description: 'Chưa có thao tác nào của Hội đồng được ghi nhận.', icon: <Search className="size-8" /> }} stickyTitle="Lịch sử duyệt tiêu chí" stickyDescription="COL.01.10 · Lịch sử xử lý của Hội đồng" />
    <CouncilSubmissionDetailDialog open={!!viewingRow} onOpenChange={(open) => { if (!open) setViewingRow(null); }} submission={viewingRow?.submission ?? null} group={viewingRow ? groupById.get(viewingRow.submission.criteriaGroupId) : undefined} />
  </div>;
}
