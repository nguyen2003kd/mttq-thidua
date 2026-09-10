import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin } from 'lucide-react';
import { Button, CriteriaStatusBadge, EmptyState, PageHeader } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/utils';
import { useScoreStore } from '@/store/scoreStore';

export default function CriteriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const table = useMemo(() => criteriaTables.find((item) => item.id === id), [criteriaTables, id]);

  if (!table) {
    return (
      <EmptyState
        title="Không tìm thấy bảng tiêu chí"
        description="Bảng tiêu chí không tồn tại hoặc đã bị xóa."
        action={<Button variant="outline" onClick={() => navigate(ROUTES.ADMIN_CRITERIA_LIST)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại danh sách</Button>}
      />
    );
  }

  const assignedLocalities = (assignments[table.id] ?? [])
    .map((localityId) => localities.find((locality) => locality.id === localityId))
    .filter((locality): locality is NonNullable<typeof locality> => Boolean(locality));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Chi tiết bảng tiêu chí" description="Thông tin nhóm tiêu chí, tiến độ áp dụng và các tiêu chí con." />
        <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN_CRITERIA_LIST)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nhóm tiêu chí</p>
              <CardTitle className="mt-1 text-xl">{table.name}</CardTitle>
            </div>
            <CriteriaStatusBadge status={table.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Tổng điểm</p>
            <p className="mt-1 text-lg font-semibold text-primary">{table.totalScore} điểm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hạn nộp</p>
            <p className="mt-1 font-medium">{table.closeDate ? formatDate(table.closeDate) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tiêu chí con</p>
            <p className="mt-1 font-medium">{table.criteria.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cập nhật lần cuối</p>
            <p className="mt-1 font-medium">{formatDate(table.updatedAt ?? table.openDate)}</p>
            <p className="text-xs text-muted-foreground">{table.updatedBy ?? 'Hệ thống'}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-muted-foreground">Nội dung</p>
            <p className="mt-1 leading-6">{table.content || '—'}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-muted-foreground">Ghi chú</p>
            <p className="mt-1 leading-6">{table.note || '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b"><CardTitle className="text-base">Danh sách tiêu chí con</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-5">
          {table.criteria.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Chưa có tiêu chí con.</p>}
          {table.criteria.map((criterion, index) => (
            <section key={criterion.id} className="rounded-md border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tiêu chí con {index + 1}</p>
                  <p className="mt-1 font-medium">{criterion.name}</p>
                </div>
                <span className="shrink-0 font-semibold text-primary">{criterion.maxScore} điểm</span>
              </div>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">Điểm thưởng</p><p className="mt-1 font-medium">{criterion.bonusScore ?? '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Hạn nộp</p><p className="mt-1 font-medium">{criterion.deadline ? formatDate(criterion.deadline) : '—'}</p></div>
                <div className="sm:col-span-2 lg:col-span-1"><p className="text-xs text-muted-foreground">Ghi chú</p><p className="mt-1 font-medium">{criterion.note || '—'}</p></div>
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b"><CardTitle className="text-base">Phạm vi áp dụng</CardTitle></CardHeader>
        <CardContent className="pt-5">
          {assignedLocalities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bảng tiêu chí chưa được áp dụng.</p>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-primary/20 bg-primary/[0.035] p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Toàn bộ địa phương</p>
                <p className="text-sm text-muted-foreground">Đã áp dụng cho {assignedLocalities.length} địa phương trong hệ thống.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b"><CardTitle className="text-base">Tệp đính kèm khi áp dụng</CardTitle></CardHeader>
        <CardContent className="pt-5">
          {!table.assignmentAttachments?.length ? (
            <p className="text-sm text-muted-foreground">Không có tệp đính kèm.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {table.assignmentAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 rounded-md border border-border/70 p-3 text-sm">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 truncate">{attachment.fileName}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
