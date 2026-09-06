import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, LocalityStatusBadge, EmptyState } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/core';
import { formatDate } from '@/lib/utils';
import { toLocalityStatus, isRecordComplete } from '@/lib/state-machine';
import { toast } from 'sonner';
import { Send, Loader2, Trophy, FileCheck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { key: 'submit', label: 'Nộp bảng điểm', icon: Send },
  { key: 'process', label: 'Đang xử lý', icon: Loader2 },
  { key: 'publish', label: 'Công bố', icon: Trophy },
];

export default function TrangThaiPage() {
  const user = useAuthStore((s) => s.user);
  const getActiveTableForLocality = useScoreStore((s) => s.getActiveTableForLocality);
  const getScore = useScoreStore((s) => s.getScore);
  const submit = useScoreStore((s) => s.submit);
  const [busy, setBusy] = useState(false);

  if (!user?.localityId) {
    return (
      <EmptyState
        title="Chưa gán địa phương"
        description="Tài khoản hiện tại chưa được gán địa phương nào."
        icon={<MapPin className="h-8 w-8" />}
      />
    );
  }

  const table = getActiveTableForLocality(user.localityId);
  if (!table) {
    return (
      <EmptyState
        title="Chưa có bảng tiêu chí"
        description="Địa phương chưa được gán bảng tiêu chí nào."
        icon={<FileCheck className="h-8 w-8" />}
      />
    );
  }

  const record = getScore(table.id, user.localityId);
  const status = toLocalityStatus(record);

  const stepStates = [
    record.state !== 'DRAFT',
    record.state !== 'DRAFT' && record.state !== 'DA_CONG_BO',
    record.state === 'DA_CONG_BO',
  ];
  const stepDates = [record.submittedAt, record.submittedAt, record.publishedAt];

  const handleSubmit = () => {
    if (!user.localityId) return;
    if (!isRecordComplete(table, record)) {
      toast.error('Cần chấm đủ tất cả tiêu chí trước khi nộp');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      submit(table.id, user.localityId!, user.name, user.role);
      toast.success('Đã nộp bảng điểm', { description: 'Hồ sơ đang chờ Ban xem xét.' });
      setBusy(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trạng thái xét duyệt"
        description={`Theo dõi tiến độ xét duyệt của địa phương năm ${new Date().getFullYear() + 1}`}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{table.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm text-muted-foreground">Tổng điểm hiện tại</p>
              <p className="text-2xl font-bold tabular-nums">{record.totalScore}</p>
            </div>
            <LocalityStatusBadge status={status} />
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0 top-5 hidden h-0.5 bg-muted md:block" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {steps.map((step, idx) => {
                const done = stepStates[idx];
                const Icon = step.icon;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-background text-muted-foreground',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={cn('mt-2 text-sm font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stepDates[idx] ? formatDate(stepDates[idx]) : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {record.state === 'DRAFT' && (
            <Button onClick={handleSubmit} disabled={busy} className="w-full sm:w-auto" action="submit" state="DRAFT">
              {busy ? 'Đang xử lý...' : 'Nộp bảng điểm'}
            </Button>
          )}

          {record.state === 'DA_CONG_BO' && (
            <p className="text-sm text-success font-medium">
              Kết quả đã được công bố. Xem chi tiết tại trang Kết quả thi đua.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
