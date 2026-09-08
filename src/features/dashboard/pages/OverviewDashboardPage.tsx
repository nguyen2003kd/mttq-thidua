import { useMemo } from 'react';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, StatCard, CountdownBanner } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import { Building2, FileCheck, Trophy, TrendingUp, Award } from 'lucide-react';
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  IN_PROGRESS: 'Đang xử lý',
  PUBLISHED: 'Đã công bố',
};

export default function OverviewDashboardPage() {
  const localities = useScoreStore((s) => s.localities);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const deadline = useScoreStore((s) => s.deadline);
  const getScore = useScoreStore((s) => s.getScore);
  const getRanking = useScoreStore((s) => s.getRanking);
  const table = criteriaTables[0];

  const statusCounts = useMemo(() => {
    const counts = { DRAFT: 0, IN_PROGRESS: 0, PUBLISHED: 0 };
    localities.forEach((loc) => {
      const record = table ? getScore(table.id, loc.id) : { state: 'DRAFT' as const };
      if (record.state === 'DA_CONG_BO') counts.PUBLISHED += 1;
      else if (record.state !== 'DRAFT') counts.IN_PROGRESS += 1;
      else counts.DRAFT += 1;
    });
    return counts;
  }, [localities, table, getScore]);

  const chartData = useMemo(
    () => [
      { name: STATUS_LABELS.DRAFT, value: statusCounts.DRAFT, key: 'draft' },
      { name: STATUS_LABELS.IN_PROGRESS, value: statusCounts.IN_PROGRESS, key: 'inProgress' },
      { name: STATUS_LABELS.PUBLISHED, value: statusCounts.PUBLISHED, key: 'published' },
    ],
    [statusCounts],
  );

  const ranking = useMemo(() => getRanking(), [getRanking]);
  const totalMax = table?.totalScore ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title={LABELS.DASHBOARD_TITLE} description="Tổng quan tiến độ thi đua khen thưởng." />

      <CountdownBanner deadline={deadline} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Địa phương" value={localities.length} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Đã nộp" value={statusCounts.IN_PROGRESS + statusCounts.PUBLISHED} icon={<FileCheck className="h-5 w-5" />} />
        <StatCard label="Đã công bố" value={statusCounts.PUBLISHED} icon={<Trophy className="h-5 w-5" />} />
        <StatCard
          label="Điểm cao nhất"
          value={ranking[0]?.totalScore ?? 0}
          unit={`/${totalMax}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              {LABELS.DASHBOARD_STATUS_CHART}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          entry.key === 'published'
                            ? 'var(--success)'
                            : entry.key === 'inProgress'
                              ? 'var(--warning)'
                              : 'var(--primary)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              {LABELS.DASHBOARD_RANKING}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ranking.map((item, idx) => {
                const percent = totalMax > 0 ? Math.round((item.totalScore / totalMax) * 100) : 0;
                return (
                  <div key={item.locality.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {idx + 1}. {item.locality.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {item.totalScore} / {totalMax}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          idx === 0 ? 'bg-success' : 'bg-primary',
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
