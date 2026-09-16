import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, Paperclip } from 'lucide-react';
import { AuditTimeline, Button, EmptyState, PageHeader, PageLoading } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import type { AuditEntry } from '@/types/domain';
import type { Role, ActionType } from '@/types/rbac';
import {
  localityApi,
  mapCriteriaGroupToTable,
  getLocalityApiError,
  type ApprovalHistoryItem,
  type SubmissionHistoryItem,
  type FileSnapshotItem,
} from '@/features/dia-phuong/api/localityApi';
import { formatDateTime, cn } from '@/lib/utils';

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

const ACTION_LABELS_VI: Record<string, string> = {
  RequestRevision: 'Yêu cầu chỉnh sửa',
  UpdateScore: 'Cập nhật điểm',
  Approve: 'Duyệt hồ sơ',
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

function parseFileSnapshot(oldFiles: string | null): FileSnapshotItem[] {
  if (!oldFiles) return [];
  try {
    return JSON.parse(oldFiles) as FileSnapshotItem[];
  } catch {
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SnapshotField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value ?? '—'}</span>
    </div>
  );
}

function SubmissionHistoryEntry({ item }: { item: SubmissionHistoryItem }) {
  const files = parseFileSnapshot(item.oldFiles);
  const actionLabel = ACTION_LABELS_VI[item.action ?? ''] ?? item.action ?? 'Không xác định';

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            item.action === 'RequestRevision' && 'bg-destructive/10 text-destructive',
            item.action === 'UpdateScore' && 'bg-info/10 text-info',
            item.action === 'Approve' && 'bg-success/10 text-success',
            !item.action && 'bg-muted text-muted-foreground',
          )}>
            {actionLabel}
          </span>
          <span className="text-xs text-muted-foreground">Vòng {item.revisionRound}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
      </div>

      {item.rejectReason && (
        <p className="text-sm text-muted-foreground italic">"{item.rejectReason}"</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-md bg-background/60 px-3 py-2">
        <SnapshotField label="Điểm tự đánh giá" value={item.oldPoint} />
        <SnapshotField label="Điểm thưởng tự đánh giá" value={item.oldBonusPoint} />
        <SnapshotField label="Điểm chuyên viên" value={item.oldOfficialPoint} />
        <SnapshotField label="Điểm thưởng chuyên viên" value={item.oldOfficialBonusPoint} />
        <SnapshotField label="Trạng thái" value={item.oldReviewStatus} />
      </div>

      {item.oldOfficialReason && (
        <div className="text-xs">
          <span className="text-muted-foreground">Lý do chấm: </span>
          <span>{item.oldOfficialReason}</span>
        </div>
      )}

      {item.oldExplanation && (
        <div className="text-xs">
          <span className="text-muted-foreground">Diễn giải: </span>
          <span>{item.oldExplanation}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            File đính kèm ({files.length})
          </div>
          <div className="space-y-1">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1 text-xs">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{f.displayName ?? f.originalName}</span>
                <span className="text-muted-foreground shrink-0">{formatBytes(f.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultHistorySection({ resultId, criteriaName }: { resultId: string; criteriaName: string }) {
  const [expanded, setExpanded] = useState(false);

  const historiesQuery = useQuery({
    queryKey: ['locality-result-histories', resultId],
    queryFn: () => localityApi.listResultHistories(resultId, { page: 1, pageSize: 100 }),
    enabled: expanded,
  });

  const histories = historiesQuery.data?.items ?? [];

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-medium">{criteriaName}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {historiesQuery.data?.total ?? 0} lần thay đổi
        </span>
      </button>
      {expanded && (
        <div className="space-y-2 border-t px-4 py-3">
          {historiesQuery.isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}
          {historiesQuery.isError && <p className="text-sm text-destructive">Không tải được lịch sử.</p>}
          {histories.length === 0 && !historiesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Chưa có thay đổi nào.</p>
          )}
          {histories
            .slice()
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .map((h) => (
              <SubmissionHistoryEntry key={h.id} item={h} />
            ))}
        </div>
      )}
    </div>
  );
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
    return <PageLoading label="Đang tải lịch sử tiêu chí…" />;
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

  const results = submission?.results ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử nộp và chấm"
        description={table.name}
        actions={<Button variant="outline" render={<Link to={`/dia-phuong/tieu-chi/${table.id}`} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>}
      />

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3">Lịch sử duyệt</h3>
          <AuditTimeline entries={entries} />
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Lịch sử chi tiết từng tiêu chí</h3>
            <div className="space-y-2">
              {results.map((r) => (
                <ResultHistorySection
                  key={r.id}
                  resultId={r.id}
                  criteriaName={r.criteriaContent ?? r.criteriaId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
