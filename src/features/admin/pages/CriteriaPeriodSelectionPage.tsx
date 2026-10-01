import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, EmptyState, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { periodsApi, type PeriodApi, type PeriodStatusApi } from '../api/periodsApi';

const PERIOD_STATUS_LABELS: Record<PeriodStatusApi, string> = {
  Draft: 'Nháp',
  Active: 'Đang áp dụng',
  Closed: 'Đã kết thúc',
};

const PERIOD_STATUS_STYLES: Record<PeriodStatusApi, string> = {
  Draft: 'bg-primary/5 text-muted-foreground',
  Active: 'bg-success/15 text-success',
  Closed: 'bg-muted text-muted-foreground',
};

export default function CriteriaPeriodSelectionPage() {
  const navigate = useNavigate();
  const periodsQuery = useQuery({
    queryKey: ['admin-periods-all'],
    queryFn: periodsApi.listAll,
  });
  const periods = periodsQuery.data ?? [];
  const columns = useMemo<ColumnDef<PeriodApi>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tên kỳ',
      meta: { className: 'font-medium', list: { width: 'minmax(180px, 1fr)' } },
    },
    {
      accessorKey: 'startYear',
      header: 'Năm bắt đầu',
      meta: { align: 'center', list: { width: '110px' } },
    },
    {
      accessorKey: 'endYear',
      header: 'Năm kết thúc',
      meta: { align: 'center', list: { width: '110px' } },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge className={PERIOD_STATUS_STYLES[row.original.status]}>
          {PERIOD_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: { align: 'center', list: { width: '130px' } },
    },
  ], []);

  if (periodsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quản lý tiêu chí" description="Chọn kỳ thi đua để xem các nhóm tiêu chí thuộc kỳ đó." />
        <EmptyState title="Không tải được danh sách kỳ thi đua" description="Vui lòng thử tải lại trang." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý tiêu chí" description="Chọn một kỳ thi đua để xem các nhóm tiêu chí thuộc kỳ đó." />
      <DataTable
        data={periods}
        columns={columns}
        loading={periodsQuery.isLoading}
        variant="list"
        pageSize={10}
        searchable
        searchPlaceholder="Tìm theo tên kỳ thi đua..."
        getRowId={(period) => period.id}
        onRowClick={(period) => navigate(`${ROUTES.SPECIALIST_CRITERIA}?periodFilter=${encodeURIComponent(period.id)}`)}
        emptyState={{ title: 'Chưa có kỳ thi đua', description: 'Tạo kỳ thi đua trước khi quản lý tiêu chí.' }}
        stickyTitle="Danh sách kỳ thi đua"
        stickyDescription="Chọn một kỳ để xem nhóm tiêu chí"
      />
    </div>
  );
}
