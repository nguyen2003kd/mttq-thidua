import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, AuditTimeline, EmptyState, StatCard, LocalityStatusBadge } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toLocalityStatus } from '@/lib/state-machine';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import { Trophy, FileText, FileCheck, MapPin, Medal, Calendar } from 'lucide-react';

export default function KetQuaPage() {
  const { nam } = useParams();
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const getScore = useScoreStore((s) => s.getScore);
  const getRanking = useScoreStore((s) => s.getRanking);
  const getAuditsForLocality = useScoreStore((s) => s.getAuditsForLocality);

  if (!user?.localityId) {
    return (
      <EmptyState
        title="Chưa gán địa phương"
        description="Tài khoản hiện tại chưa được gán địa phương nào."
        icon={<MapPin className="h-8 w-8" />}
      />
    );
  }

  const table = criteriaTables[0];
  if (!table) {
    return (
      <EmptyState
        title="Chưa có bảng tiêu chí"
        description="Hiện chưa có bảng tiêu chí nào được mở."
        icon={<FileCheck className="h-8 w-8" />}
      />
    );
  }

  const record = getScore(table.id, user.localityId);
  const ranking = getRanking();
  const rank = ranking.findIndex((r) => r.locality.id === user.localityId) + 1;
  const audits = getAuditsForLocality(user.localityId);

  const totalMax = table.totalScore;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kết quả thi đua năm ${nam || new Date().getFullYear() + 1}`}
        description="Chi tiết điểm theo từng tiêu chí và lịch sử thay đổi."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng điểm" value={record.totalScore} unit={`/${totalMax}`} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Xếp hạng" value={rank || '—'} unit={rank ? `/ ${ranking.length}` : ''} icon={<Medal className="h-5 w-5" />} />
        <StatCard
          label="Trạng thái"
          value={<LocalityStatusBadge status={toLocalityStatus(record.state)} />}
          icon={<FileCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Ngày công bố"
          value={record.publishedAt ? formatDate(record.publishedAt) : '—'}
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{LABELS.LOCALITY_RESULT_BREAKDOWN}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {table.criteria.map((criteria) => {
              const entry = record.entries.find((e) => e.criteriaId === criteria.id);
              const value = entry?.value ?? 0;
              const percent = Math.round((value / criteria.maxScore) * 100);
              return (
                <div key={criteria.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{criteria.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {value} / {criteria.maxScore}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', percent >= 80 ? 'bg-success' : percent >= 50 ? 'bg-primary' : 'bg-warning')}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minh chứng: {entry?.evidenceCount ?? 0} | Chấm bởi {entry?.scoredBy || '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {record.state === 'DA_CONG_BO' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {LABELS.LOCALITY_DECISION_FILE}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quyết định công nhận thành tích đã được ban hành vào {record.publishedAt ? formatDate(record.publishedAt) : '—'}.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{LABELS.LOCALITY_CHANGE_HISTORY}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline entries={audits} />
        </CardContent>
      </Card>
    </div>
  );
}
