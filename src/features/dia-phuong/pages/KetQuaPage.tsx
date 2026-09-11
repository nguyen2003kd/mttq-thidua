import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageHeader, AuditTimeline, EmptyState, StatCard, LocalityStatusBadge, Button } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CriterionGrid } from '@/features/workflow/components';
import { toLocalityStatus } from '@/lib/state-machine';
import { formatDate } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import { Trophy, FileText, FileCheck, MapPin, Calendar } from 'lucide-react';
import {
  localityApi,
  mapCriteriaGroupToTable,
  mapSubmissionToRecord,
  mapFileToEvidence,
  getLocalityApiError,
  type ApprovalHistoryItem,
} from '@/features/dia-phuong/api/localityApi';
import type { AuditEntry } from '@/types/domain';
import type { Role, ActionType } from '@/types/rbac';

const ACTION_MAP: Record<string, ActionType> = {
  approve: 'APPROVE',
  reject: 'REJECT',
  submit: 'APPROVE',
  publish: 'PUBLISH',
  score: 'SCORE',
  edit: 'EDIT',
};

const ROLE_MAP: Record<string, Role> = {
  LOCAL: 'LOCAL',
  SPECIALIST: 'SPECIALIST',
  LEADER: 'LEADER',
  COUNCIL: 'COUNCIL',
  COMMITTEE: 'COMMITTEE',
};

function mapHistoryToAudit(item: ApprovalHistoryItem): AuditEntry {
  return {
    id: item.id,
    timestamp: item.createdAt,
    actorName: item.actorName,
    actorRole: ROLE_MAP[item.actorRole] ?? 'LOCAL',
    action: ACTION_MAP[item.action?.toLowerCase()] ?? 'EDIT',
    fieldName: item.submissionId,
    oldValue: item.fromStage ?? null,
    newValue: item.toStage ?? item.action,
    reason: item.reason,
  };
}

export default function KetQuaPage() {
  const { nam } = useParams();
  const user = useAuthStore((s) => s.user);
  const localityId = user?.localityId;

  // Lấy danh sách submissions của địa phương
  const mySubmissionsQuery = useQuery({
    queryKey: ['locality-my-submissions', localityId],
    queryFn: () => localityApi.listMySubmissions({ page: 1, pageSize: 100 }),
    enabled: Boolean(localityId),
  });

  // Lấy submission đầu tiên (active) — có thể chọn theo năm sau
  const submission = useMemo(() => {
    const items = mySubmissionsQuery.data?.items ?? [];
    // Ưu tiên submission đã công bố, nếu không có thì lấy submission đầu
    return items.find((s) => s.stage === 'Published') ?? items[0];
  }, [mySubmissionsQuery.data]);

  // Chi tiết submission
  const submissionQuery = useQuery({
    queryKey: ['locality-submission', submission?.id],
    queryFn: () => localityApi.getSubmission(submission!.id),
    enabled: Boolean(submission?.id),
  });

  // Chi tiết group
  const groupQuery = useQuery({
    queryKey: ['locality-criteria-group', submission?.criteriaGroupId],
    queryFn: () => localityApi.getCriteriaGroup(submission!.criteriaGroupId),
    enabled: Boolean(submission?.criteriaGroupId),
  });

  // Files
  const filesQuery = useQuery({
    queryKey: ['locality-evidence', submission?.id],
    queryFn: () => localityApi.listFiles({ entityType: 'submission', entityId: submission!.id, page: 1, pageSize: 200 }),
    enabled: Boolean(submission?.id),
  });

  // Histories
  const historiesQuery = useQuery({
    queryKey: ['locality-approval-histories', submission?.id],
    queryFn: () => localityApi.listApprovalHistories(submission!.id, { page: 1, pageSize: 100 }),
    enabled: Boolean(submission?.id),
  });

  if (!localityId) {
    return (
      <EmptyState
        title="Chưa gán địa phương"
        description="Tài khoản hiện tại chưa được gán địa phương nào."
        icon={<MapPin className="h-8 w-8" />}
      />
    );
  }

  if (mySubmissionsQuery.isLoading) {
    return <div className="space-y-6"><PageHeader title={`Kết quả thi đua năm ${nam || new Date().getFullYear() + 1}`} description="Chi tiết điểm theo từng tiêu chí và lịch sử thay đổi." /><p className="text-sm text-muted-foreground">Đang tải…</p></div>;
  }

  if (mySubmissionsQuery.isError) {
    return <EmptyState title="Không tải được dữ liệu" description={getLocalityApiError(mySubmissionsQuery.error)} />;
  }

  if (!submission) {
    return (
      <EmptyState
        title="Chưa có bảng tiêu chí"
        description="Địa phương chưa được gán bảng tiêu chí nào."
        icon={<FileCheck className="h-8 w-8" />}
      />
    );
  }

  const table = groupQuery.data ? mapCriteriaGroupToTable(groupQuery.data) : null;
  const record = submissionQuery.data ? mapSubmissionToRecord(submissionQuery.data) : { state: 'DRAFT' as const, entries: [], totalScore: 0, submittedAt: null, publishedAt: null };
  const evidence = (filesQuery.data?.rows ?? []).map((f) => mapFileToEvidence(f, '', localityId));
  const totalMax = table?.totalScore ?? 0;
  const audits = (historiesQuery.data?.items ?? []).map(mapHistoryToAudit).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kết quả thi đua năm ${nam || new Date().getFullYear() + 1}`}
        description="Chi tiết điểm theo từng tiêu chí và lịch sử thay đổi."
        actions={<Button variant="outline" render={<Link to="/dia-phuong/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng điểm" value={record.totalScore} unit={`/${totalMax}`} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Trạng thái" value={<LocalityStatusBadge status={toLocalityStatus(record)} />} icon={<FileCheck className="h-5 w-5" />} />
        <StatCard label="Ngày nộp" value={record.submittedAt ? formatDate(record.submittedAt) : '—'} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Ngày công bố" value={record.publishedAt ? formatDate(record.publishedAt) : '—'} icon={<Calendar className="h-5 w-5" />} />
      </div>

      {record.state !== 'DA_CONG_BO' ? (
        <Card><CardContent className="p-8 text-center"><Trophy className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-semibold">Kết quả chưa được công bố</p><p className="mt-1 text-sm text-muted-foreground">Điểm đang trong quy trình thẩm định và chỉ hiển thị chính thức sau khi Ủy ban Thường trực công bố.</p></CardContent></Card>
      ) : table && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{LABELS.LOCALITY_RESULT_BREAKDOWN}</CardTitle>
          </CardHeader>
          <CardContent>
            <CriterionGrid criteria={table.criteria} record={record} evidence={evidence} localityId={localityId} mode="result" />
          </CardContent>
        </Card>
      )}

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
