import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { AuditTimeline, Button, EmptyState, PageHeader } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import type { AuditEntry } from '@/types/domain';
import type { Role, ActionType } from '@/types/rbac';
import {
  localityApi,
  mapCriteriaGroupToTable,
  getLocalityApiError,
  type ApprovalHistoryItem,
} from '@/features/dia-phuong/api/localityApi';

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

export default function LocalityCriteriaHistoryPage() {
  const { id } = useParams<{ id?: string }>();
  const user = useAuthStore((state) => state.user);

  const groupQuery = useQuery({
    queryKey: ['locality-criteria-group', id],
    queryFn: () => localityApi.getCriteriaGroup(id!),
    enabled: Boolean(id),
  });

  // Tìm submission của locality trong group này
  const mySubmissionsQuery = useQuery({
    queryKey: ['locality-my-submissions', user?.localityId],
    queryFn: () => localityApi.listMySubmissions({ page: 1, pageSize: 100 }),
    enabled: Boolean(user?.localityId),
  });

  const submission = useMemo(() => {
    const list = mySubmissionsQuery.data?.items ?? [];
    return list.find((s) => s.criteriaGroupId === id);
  }, [mySubmissionsQuery.data, id]);

  const historiesQuery = useQuery({
    queryKey: ['locality-approval-histories', submission?.id],
    queryFn: () => localityApi.listApprovalHistories(submission!.id, { page: 1, pageSize: 100 }),
    enabled: Boolean(submission?.id),
  });

  if (!id || !user?.localityId) {
    return <EmptyState title="Không tìm thấy lịch sử" description="Nhóm tiêu chí hoặc địa phương không hợp lệ." />;
  }

  if (groupQuery.isLoading) {
    return <div className="space-y-5"><p className="text-sm text-muted-foreground">Đang tải…</p></div>;
  }

  const table = groupQuery.data ? mapCriteriaGroupToTable(groupQuery.data) : null;
  if (!table) {
    return <EmptyState title="Không tìm thấy lịch sử" description="Nhóm tiêu chí hoặc địa phương không hợp lệ." />;
  }

  if (historiesQuery.isError) {
    return <EmptyState title="Không tải được lịch sử" description={getLocalityApiError(historiesQuery.error)} />;
  }

  const entries = (historiesQuery.data?.items ?? [])
    .map(mapHistoryToAudit)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử nộp và chấm"
        description={table.name}
        actions={<Button variant="outline" render={<Link to={`/dia-phuong/tieu-chi/${table.id}`} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>}
      />
      <Card>
        <CardContent className="p-5">
          <AuditTimeline entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
