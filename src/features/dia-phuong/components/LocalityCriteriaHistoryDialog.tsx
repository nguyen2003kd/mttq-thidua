import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FileText, Paperclip } from 'lucide-react';
import { AppDialog, AuditTimeline } from '@/components/core';
import type { AuditEntry } from '@/types/domain';
import type { Role, ActionType } from '@/types/rbac';
import {
  localityApi,
  getLocalityApiError,
  type ApprovalHistoryItem,
  type SubmissionHistoryItem,
  type SubmissionApi,
  type FileSnapshotItem,
} from '@/features/dia-phuong/api/localityApi';
import { filesApi } from '@/features/files/api/filesApi';
import { formatDateTime, cn } from '@/lib/utils';

const ACTION_MAP: Record<string, ActionType> = {
  approve: 'APPROVE',
  reject: 'REJECT',
  submit: 'APPROVE',
  publish: 'PUBLISH',
  score: 'SCORE',
  edit: 'EDIT',
};

// stageLevel = stage hồ sơ đang ở khi hành động diễn ra → suy ra cấp thao tác
const STAGE_ACTOR_MAP: Record<string, { role: Role; label: string }> = {
  Draft: { role: 'LOCAL', label: 'Địa phương' },
  RequiresRevision: { role: 'SPECIALIST', label: 'Chuyên viên' },
  LocalSubmitted: { role: 'SPECIALIST', label: 'Chuyên viên' },
  SpecialistApproved: { role: 'LEADER', label: 'Lãnh đạo ban' },
  LeaderApproved: { role: 'COUNCIL', label: 'Hội đồng thi đua' },
  CouncilApproved: { role: 'COMMITTEE', label: 'Ban thường trực' },
  CommitteeFinalized: { role: 'COMMITTEE', label: 'Ban thường trực' },
};

const ACTION_LABELS_VI: Record<string, string> = {
  RequestRevision: 'Yêu cầu chỉnh sửa',
  UpdateScore: 'Cập nhật điểm',
  Approve: 'Duyệt hồ sơ',
  AddSupplementaryCriteria: 'Thêm tiêu chí bổ sung',
};

// Dữ liệu cũ: action RequestRevision + reason tiếng Anh "Added supplementary criteria: ..."
function resolveHistoryAction(action: string | null, reason: string | null): string {
  const key = action ?? '';
  const isLegacySupplementary = key === 'RequestRevision'
    && (reason?.startsWith('Added supplementary criteria:') || reason?.startsWith('Thêm tiêu chí bổ sung:'));
  if (isLegacySupplementary) return 'AddSupplementaryCriteria';
  return key;
}

function translateLegacyReason(reason: string | null): string | null {
  if (reason?.startsWith('Added supplementary criteria:')) {
    return `Thêm tiêu chí bổ sung: ${reason.slice('Added supplementary criteria:'.length).trim()}`;
  }
  return reason;
}

function mapHistoryToAudit(item: ApprovalHistoryItem): AuditEntry {
  const resolvedAction = resolveHistoryAction(item.action, item.reason);
  const actor = STAGE_ACTOR_MAP[item.stageLevel];
  return {
    id: item.id,
    timestamp: item.createdAt,
    actorName: actor?.label ?? 'Hệ thống',
    actorRole: actor?.role ?? 'LOCAL',
    action: ACTION_MAP[resolvedAction?.toLowerCase()] ?? 'EDIT',
    fieldName: item.submissionId,
    oldValue: null,
    newValue: item.action,
    reason: translateLegacyReason(item.reason),
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

function ResultHistorySection({ resultId, criteriaName, enabled }: { resultId: string; criteriaName: string; enabled: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const historiesQuery = useQuery({
    queryKey: ['locality-result-histories', resultId],
    queryFn: () => localityApi.listResultHistories(resultId, { page: 1, pageSize: 100 }),
    enabled: enabled && expanded,
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

interface LocalityCriteriaHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionApi | undefined;
  groupName: string;
}

export function LocalityCriteriaHistoryDialog({ open, onOpenChange, submission, groupName }: LocalityCriteriaHistoryDialogProps) {
  const hasSubmission = Boolean(submission?.id);

  const historiesQuery = useQuery({
    queryKey: ['locality-approval-histories', submission?.id],
    queryFn: () => localityApi.listApprovalHistories(submission!.id, { page: 1, pageSize: 100 }),
    enabled: open && hasSubmission,
  });

  // File đính kèm của yêu cầu chỉnh sửa (category = revision-attachment, entityType = Submission)
  const revisionFilesQuery = useQuery({
    queryKey: ['locality-revision-files-history', submission?.id],
    queryFn: () => filesApi.list({ entityType: 'Submission', entityId: submission!.id, category: 'revision-attachment', page: 1, pageSize: 50 }),
    enabled: open && hasSubmission,
  });
  const revisionFiles = revisionFilesQuery.data?.items ?? [];

  const entries = (historiesQuery.data?.items ?? [])
    .map(mapHistoryToAudit)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  const results = submission?.results ?? [];

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} title="Lịch sử nộp và chấm" subtitle={groupName} size="max-w-3xl sm:max-w-3xl">
      <div className="space-y-5">
        {historiesQuery.isError ? (
            <p className="text-sm text-destructive">Không tải được lịch sử: {getLocalityApiError(historiesQuery.error)}</p>
          ) : (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Lịch sử duyệt</h3>
              {historiesQuery.isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Đang tải…</p>
              ) : (
                <AuditTimeline entries={entries} />
              )}
              {revisionFiles.length > 0 && (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    File đính kèm yêu cầu chỉnh sửa ({revisionFiles.length})
                  </div>
                  <div className="space-y-1">
                    {revisionFiles.map((file) => (
                      <a key={file.id} href={file.url ?? '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1 text-xs hover:bg-muted">
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.displayName ?? file.originalName}</span>
                        <span className="text-muted-foreground shrink-0">{formatBytes(file.sizeBytes)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          {results.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Lịch sử chi tiết từng tiêu chí</h3>
              {results.map((r) => (
                <ResultHistorySection
                  key={r.id}
                  resultId={r.id}
                  criteriaName={r.criteriaContent ?? r.criteriaId}
                  enabled={open}
                />
              ))}
            </section>
          )}
      </div>
    </AppDialog>
  );
}
