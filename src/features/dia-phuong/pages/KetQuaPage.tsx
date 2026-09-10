import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, AuditTimeline, EmptyState, StatCard, LocalityStatusBadge } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toLocalityStatus } from '@/lib/state-machine';
import { formatDate } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import { Trophy, FileText, FileCheck, MapPin, Medal, Calendar } from 'lucide-react';
import { CriterionGrid } from '@/features/workflow/components';

export default function KetQuaPage() {
  const { nam } = useParams();
  const user = useAuthStore((s) => s.user);
  const getActiveTableForLocality = useScoreStore((s) => s.getActiveTableForLocality);
  const getScore = useScoreStore((s) => s.getScore);
  const getRanking = useScoreStore((s) => s.getRanking);
  const getAuditsForLocality = useScoreStore((s) => s.getAuditsForLocality);
  const evidence = useScoreStore((s) => s.evidence);

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
  const ranking = getRanking(table.id);
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
          value={<LocalityStatusBadge status={toLocalityStatus(record)} />}
          icon={<FileCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Ngày công bố"
          value={record.publishedAt ? formatDate(record.publishedAt) : '—'}
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {record.state !== 'DA_CONG_BO' ? (
        <Card><CardContent className="p-8 text-center"><Trophy className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-semibold">Kết quả chưa được công bố</p><p className="mt-1 text-sm text-muted-foreground">Điểm đang trong quy trình thẩm định và chỉ hiển thị chính thức sau khi Ủy ban Thường trực công bố.</p></CardContent></Card>
      ) : <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{LABELS.LOCALITY_RESULT_BREAKDOWN}</CardTitle>
        </CardHeader>
        <CardContent>
          <CriterionGrid criteria={table.criteria} record={record} evidence={evidence} localityId={user.localityId} mode="result" />
        </CardContent>
      </Card>}

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
            <div className="mt-3 space-y-2">
              {(record.decisionAttachments ?? []).map((file) => (
                <div key={file.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"><FileText className="h-4 w-4 text-primary" />{file.fileName}</div>
              ))}
            </div>
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
