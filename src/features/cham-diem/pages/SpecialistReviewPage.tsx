import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  History,
  MapPin,
  Paperclip,
  Save,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, EmptyState, FilePreviewDialog, FileUpload, FilterDropdown, FilterSelect, FormDialog, PageHeader, PageLoading, TableColumnVisibility, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ForwardingDocumentsDialog, ForwardSubmissionDialog } from '@/features/workflow/components';
import { getSpecialistSubmissionPermissions, isRealSubmission, specialistApi, type SubmissionApi, type SubmissionResultFile, type SubmissionResultItem, type SubmissionStage } from '@/features/cham-diem/api/specialistApi';
import {
  localityApi,
  type ApprovalHistoryItem,
  type SubmissionHistoryItem,
  type FileSnapshotItem,
} from '@/features/dia-phuong/api/localityApi';
import { downloadFile, filesApi, getFilesApiError } from '@/features/files/api/filesApi';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime, cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  fileId: string;
}

interface SpecialistCriteriaItem {
  id: string;
  code: string;
  title: string;
  evidenceFiles: EvidenceFile[];
  proposedScore: number;
  proposedBonusScore: number;
  maxProposedScore: number;
  maxProposedBonusScore: number;
  explanation: string;
  officialScore: number | null;
  officialBonusScore: number | null;
  scoreReason: string;
  isAddedBySpecialist?: boolean;
}

interface SpecialistCriteriaGroup {
  id: string;
  code: string;
  groupName: string;
  description: string;
  totalProposedScore: number;
  totalProposedBonusScore: number;
  status: 'CHUA_NOP' | 'CHO_CHAM' | 'DA_CHAM' | 'YEU_CAU_SUA';
  hasModificationRequest: boolean;
  modificationNote?: string;
  items: SpecialistCriteriaItem[];
}

interface LocalityRow {
  localityId: string;
  localityName: string;
  completionRate: string;
  overallStatus: 'CHUA_NOP' | 'CHO_DUYET' | 'YEU_CAU_SUA' | 'DA_DUYET';
  hasNewSubmissions: boolean;
  hasModificationRequest: boolean;
  submissionIds: string[];
}

type SubmissionStageFilter = '' | SubmissionStage;
type GroupStatusFilter = '' | SpecialistCriteriaGroup['status'];

const QUICK_STAGE_FILTERS: Array<{ value: '' | 'LocalSubmitted' | 'RequiresRevision' | 'SpecialistApproved'; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'LocalSubmitted', label: 'Chờ chuyên viên' },
  { value: 'RequiresRevision', label: 'Yêu cầu chỉnh sửa' },
  { value: 'SpecialistApproved', label: 'Đã chuyển lãnh đạo' },
];

const GROUP_STATUS_FILTER_OPTIONS: Array<{ value: Exclude<GroupStatusFilter, ''>; label: string }> = [
  { value: 'CHUA_NOP', label: 'Chưa nộp' },
  { value: 'CHO_CHAM', label: 'Chờ chấm' },
  { value: 'DA_CHAM', label: 'Đã chấm' },
  { value: 'YEU_CAU_SUA', label: 'Yêu cầu chỉnh sửa' },
];

function getGroupStatusFilterLabel(status: GroupStatusFilter) {
  return GROUP_STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ?? '';
}

async function listEverySubmission(stage: SubmissionStageFilter, includeUnsubmitted: boolean) {
  const firstPage = await specialistApi.listAllSubmissions({
    stage: stage || undefined,
    includeUnsubmitted: includeUnsubmitted || undefined,
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listAllSubmissions({
      stage: stage || undefined,
      includeUnsubmitted: includeUnsubmitted || undefined,
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );

  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

/** Trang chi tiết chỉ cần submissions của đúng nhóm tiêu chí, không tải toàn hệ thống. */
async function listEverySubmissionByGroup(groupId: string) {
  const firstPage = await specialistApi.listSubmissionsByGroup(groupId, {
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => specialistApi.listSubmissionsByGroup(groupId, {
      page: index + 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })),
  );
  return { ...firstPage, items: [firstPage.items, ...remainingPages.flatMap((page) => page.items)].flat() };
}

/** URL dùng mã số (vd. 26122), trong khi một số response trả `loc-26122`. */
function getSubmissionLocalityCode(submission: SubmissionApi) {
  const rawCode = submission.createdByWardCode ?? submission.createdBy ?? 'unknown';
  return rawCode.replace(/^loc-/i, '');
}

const STAGE_TO_STATUS: Record<string, LocalityRow['overallStatus']> = {
  LocalSubmitted: 'CHO_DUYET',
  SpecialistApproved: 'DA_DUYET',
  LeaderApproved: 'DA_DUYET',
  CouncilApproved: 'DA_DUYET',
  CommitteeFinalized: 'DA_DUYET',
  RequiresRevision: 'YEU_CAU_SUA',
};

const STAGE_TO_GROUP_STATUS: Record<string, SpecialistCriteriaGroup['status']> = {
  Draft: 'CHUA_NOP',
  LocalSubmitted: 'CHO_CHAM',
  SpecialistApproved: 'DA_CHAM',
  LeaderApproved: 'DA_CHAM',
  CouncilApproved: 'DA_CHAM',
  CommitteeFinalized: 'DA_CHAM',
  RequiresRevision: 'YEU_CAU_SUA',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const supplementarySchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên tiêu chí bổ sung.'),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do bổ sung.'),
  file: z.instanceof(File).nullable().refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File đính kèm không được vượt quá 20MB.'),
});

type SupplementaryForm = z.infer<typeof supplementarySchema>;

const scoreEditSchema = z.object({
  score: z.coerce.number({ invalid_type_error: 'Vui lòng nhập điểm chấm.' }).min(0, 'Điểm chấm không được nhỏ hơn 0.'),
  bonusScore: z.coerce.number({ invalid_type_error: 'Vui lòng nhập điểm thưởng.' }).min(0, 'Điểm thưởng không được nhỏ hơn 0.'),
  reason: z.string().trim(),
});

type ScoreEditForm = z.infer<typeof scoreEditSchema>;

// function createScoreSchema(item: SpecialistCriteriaItem) {
//   return z.object({
//     score: z.coerce
//       .number({ invalid_type_error: 'Vui lòng nhập điểm chấm.' })
//       .min(0, 'Điểm chấm không được nhỏ hơn 0.')
//       .max(item.maxProposedScore, `Điểm chấm không được vượt quá ${item.maxProposedScore}.`),
//     bonusScore: z.coerce
//       .number({ invalid_type_error: 'Vui lòng nhập điểm thưởng.' })
//       .min(0, 'Điểm thưởng không được nhỏ hơn 0.')
//       .max(item.maxProposedBonusScore, `Điểm thưởng không được vượt quá ${item.maxProposedBonusScore}.`),
//     // scoreReason: z.string().trim(),
//   });
//   // }).superRefine((value, context) => {
//   //   const scoreChanged = value.score !== item.proposedScore || value.bonusScore !== item.proposedBonusScore;
//   //   if (scoreChanged && !value.scoreReason) {
//   //     context.addIssue({
//   //       code: z.ZodIssueCode.custom,
//   //       message: 'Vui lòng nhập lý do khi điểm chấm khác điểm địa phương đề xuất.',
//   //       path: ['scoreReason'],
//   //     });
//   //   }
//   // });
// }
//
// type ScoreForm = {
//   score: number;
//   bonusScore: number;
//   // scoreReason: string;
// };

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const HISTORY_ACTION_LABELS: Record<string, string> = {
  RequestRevision: 'Yêu cầu chỉnh sửa',
  UpdateScore: 'Cập nhật điểm',
  Approve: 'Duyệt hồ sơ',
  AddSupplementaryCriteria: 'Thêm tiêu chí bổ sung',
  Finalize: 'Công bố kết quả',
};

// stageLevel = stage hồ sơ đang ở khi hành động diễn ra → suy ra cấp thao tác
const STAGE_ACTOR_LABELS: Record<string, string> = {
  Draft: 'Địa phương',
  RequiresRevision: 'Chuyên viên',
  LocalSubmitted: 'Chuyên viên',
  SpecialistApproved: 'Lãnh đạo ban',
  LeaderApproved: 'Hội đồng thi đua',
  CouncilApproved: 'Ban thường trực',
  CommitteeFinalized: 'Ban thường trực',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ chấm',
  Accepted: 'Đã chấp nhận',
  RequiresRevision: 'Yêu cầu chỉnh sửa',
};

function formatReviewStatus(status: string | null) {
  if (!status) return '—';
  return REVIEW_STATUS_LABELS[status] ?? status;
}

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

type RevisionRequestStage = 'SpecialistApproved' | 'LeaderApproved' | 'CouncilApproved';

/** Lấy nội dung yêu cầu chỉnh sửa mới nhất theo cấp xử lý của hồ sơ. */
function getLatestRevisionReason(histories: ApprovalHistoryItem[], stageLevel: RevisionRequestStage) {
  return histories
    .filter((history) => history.stageLevel === stageLevel && resolveHistoryAction(history.action, history.reason) === 'RequestRevision')
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((history) => translateLegacyReason(history.reason))
    .find((reason): reason is string => Boolean(reason?.trim())) ?? null;
}

function parseFileSnapshot(oldFiles: string | null): FileSnapshotItem[] {
  if (!oldFiles) return [];
  try {
    return JSON.parse(oldFiles) as FileSnapshotItem[];
  } catch {
    return [];
  }
}

function SnapshotField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <span className="block text-xs leading-5 text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-sm font-semibold tabular-nums text-foreground">{value ?? '—'}</span>
    </div>
  );
}

function SubmissionHistoryEntry({ item, currentPoint, currentBonusPoint, currentExplanation }: {
  item: SubmissionHistoryItem;
  currentPoint: number;
  currentBonusPoint: number;
  currentExplanation: string | null;
}) {
  const files = parseFileSnapshot(item.oldFiles);
  const resolvedAction = resolveHistoryAction(item.action, item.rejectReason);
  const actionLabel = HISTORY_ACTION_LABELS[resolvedAction] ?? item.action ?? 'Không xác định';
  const rejectReason = translateLegacyReason(item.rejectReason);
  const pointChanged = item.oldPoint !== currentPoint;
  const bonusChanged = item.oldBonusPoint !== currentBonusPoint;
  const explanationChanged = (item.oldExplanation ?? '') !== (currentExplanation ?? '');

  return (
    <article className="relative border-l-2 border-border pb-5 pl-5 last:pb-0">
      <span className={cn(
        'absolute -left-[7px] top-1.5 size-3 rounded-full border-2 border-background',
        resolvedAction === 'RequestRevision' && 'bg-warning',
        resolvedAction === 'UpdateScore' && 'bg-muted-foreground',
        resolvedAction === 'Approve' && 'bg-success',
        resolvedAction === 'AddSupplementaryCriteria' && 'bg-primary',
        !resolvedAction && 'bg-muted-foreground',
      )} />
      <div className="space-y-3 rounded-md border border-border bg-muted/15 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
            resolvedAction === 'RequestRevision' && 'bg-destructive/10 text-destructive',
            resolvedAction === 'UpdateScore' && 'bg-info/10 text-info',
            resolvedAction === 'Approve' && 'bg-success/10 text-success',
            resolvedAction === 'AddSupplementaryCriteria' && 'bg-primary/10 text-primary',
            !resolvedAction && 'bg-muted text-muted-foreground',
          )}>
            {actionLabel}
          </span>
          <span className="text-sm font-medium text-muted-foreground">Lần {item.revisionRound}</span>
          </div>
          <time className="text-xs font-medium text-muted-foreground">{formatDateTime(item.createdAt)}</time>
        </div>

        {rejectReason && (
          <div className="rounded-md border-l-4 border-warning bg-warning/10 px-3 py-2 text-sm leading-6 text-foreground">
            <span className="font-semibold">Lý do: </span>{rejectReason}
          </div>
        )}

        <div className="grid overflow-hidden rounded-md border border-border bg-background sm:grid-cols-2 xl:grid-cols-5 [&>*]:border-b [&>*]:border-border sm:[&>*]:border-r xl:[&>*]:border-b-0">
          <SnapshotField label="Điểm tự đánh giá cũ" value={item.oldPoint} />
          <SnapshotField label="Điểm thưởng cũ" value={item.oldBonusPoint} />
          <SnapshotField label="Điểm chuyên viên cũ" value={item.oldOfficialPoint} />
          <SnapshotField label="Điểm thưởng CV cũ" value={item.oldOfficialBonusPoint} />
          <SnapshotField label="Trạng thái cũ" value={formatReviewStatus(item.oldReviewStatus)} />
        </div>

        {(pointChanged || bonusChanged || explanationChanged) && (
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {pointChanged && (
            <span className="rounded-md bg-warning/10 px-2 py-0.5 text-warning-foreground">
              Điểm: {item.oldPoint} → {currentPoint}
            </span>
          )}
          {bonusChanged && (
            <span className="rounded-md bg-warning/10 px-2 py-0.5 text-warning-foreground">
              Điểm thưởng: {item.oldBonusPoint} → {currentBonusPoint}
            </span>
          )}
          {explanationChanged && (
            <span className="rounded-md bg-info/10 px-2 py-0.5 text-info">
              Diễn giải đã thay đổi
            </span>
          )}
        </div>
        )}

        {item.oldExplanation && (
        <div className="text-sm leading-6">
          <span className="font-medium text-muted-foreground">Diễn giải trước đó: </span>
          <span className="text-foreground">{item.oldExplanation}</span>
        </div>
        )}

        {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Paperclip className="size-4 text-primary" />
            File đính kèm cũ ({files.length})
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-background">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">{f.displayName ?? f.originalName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(f.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </article>
  );
}

function CriterionHistoryPanel({
  resultId,
  currentPoint,
  currentBonusPoint,
  currentExplanation,
}: {
  resultId?: string;
  currentPoint: number;
  currentBonusPoint: number;
  currentExplanation: string | null;
}) {
  const historiesQuery = useQuery({
    queryKey: ['specialist-result-histories', resultId],
    queryFn: () => localityApi.listResultHistories(resultId!, { page: 1, pageSize: 100 }),
    enabled: Boolean(resultId),
  });
  const histories = historiesQuery.data?.items ?? [];

  if (!resultId) return null;

  return (
    <div className="rounded-md border border-border bg-background p-4 sm:p-5" onClick={(event) => event.stopPropagation()}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <History className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Lịch sử của tiêu chí này</p>
            <p className="text-xs text-muted-foreground">Mới nhất hiển thị trước</p>
          </div>
        </div>
        {!historiesQuery.isLoading && <Badge variant="secondary">{histories.length} lần cập nhật</Badge>}
      </div>
      {historiesQuery.isLoading ? (
        <div className="space-y-3" aria-label="Đang tải lịch sử tiêu chí">
          <div className="h-20 animate-pulse rounded-md bg-muted" />
          <div className="h-20 animate-pulse rounded-md bg-muted/70" />
        </div>
      ) : historiesQuery.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Không tải được lịch sử. Vui lòng đóng và mở lại để thử lại.
        </div>
      ) : histories.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm leading-6 text-muted-foreground">
          Tiêu chí này chưa có lần cập nhật hoặc yêu cầu chỉnh sửa nào.
        </div>
      ) : (
        <div className="space-y-3">
          {histories
            .slice()
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .map((history) => (
              <SubmissionHistoryEntry
                key={history.id}
                item={history}
                currentPoint={currentPoint}
                currentBonusPoint={currentBonusPoint}
                currentExplanation={currentExplanation}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function OfficialScoreRevisionDialog({
  open,
  onOpenChange,
  result,
  criterionLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SubmissionResultItem | null;
  criterionLabel: string;
}) {
  const scoreUpdateFilesQuery = useQuery({
    queryKey: ['specialist-score-update-files', result?.id],
    queryFn: () => filesApi.list({
      entityType: 'SubmissionResult',
      entityId: result!.id,
      category: 'score-update',
      page: 1,
      pageSize: 100,
    }),
    enabled: open && Boolean(result?.id),
  });

  if (!result) return null;

  const scoreUpdateFiles = scoreUpdateFilesQuery.data?.items ?? [];
  const formatOfficialScore = (value: number | null, maximum: number) => (
    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
      {value ?? '—'}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {maximum}</span>
    </p>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Điểm chuyên viên đã sửa</DialogTitle>
          <DialogDescription>Xem điểm, lý do và tệp đính kèm của lần điều chỉnh cho tiêu chí này.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="rounded-md border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Tiêu chí con</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{criterionLabel}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Điểm chuyên viên chấm</p>
              {formatOfficialScore(result.officialPoint, result.snapshotMaxPoint)}
            </div>
            <div className="rounded-md border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Điểm thưởng chuyên viên chấm</p>
              {formatOfficialScore(result.officialBonusPoint, result.snapshotMaxBonusPoint)}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Lý do sửa điểm</p>
            <p className="mt-2 whitespace-pre-wrap rounded-md border-l-2 border-primary bg-muted/20 px-3 py-2.5 text-sm leading-6 text-foreground">{result.officialReason}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Tệp đính kèm</p>
            <p className="mt-1 text-xs text-muted-foreground">Chỉ hiển thị tệp được đính kèm khi chuyên viên sửa điểm.</p>
            {scoreUpdateFilesQuery.isLoading ? <div className="mt-3 h-16 animate-pulse rounded-md bg-muted" /> : scoreUpdateFilesQuery.isError ? <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">Không tải được tệp đính kèm. Vui lòng thử lại.</p> : scoreUpdateFiles.length === 0 ? <p className="mt-3 rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">Không có tệp đính kèm cho lần sửa điểm này.</p> : <div className="mt-3 divide-y rounded-md border border-border">{scoreUpdateFiles.map((file) => <div key={file.id} className="flex items-center gap-3 px-3 py-2.5"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1 break-all text-sm font-medium text-foreground">{file.displayName || file.originalName}</span><Button type="button" variant="outline" size="sm" onClick={() => { void downloadFile(file.id, file.displayName || file.originalName); }}><Download className="size-4" />Tải về</Button></div>)}</div>}
          </div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevisionHistorySection({
  submissionId,
  results,
}: {
  submissionId: string;
  results: Array<{ id: string; criteriaId: string; criteriaContent: string | null; point: number; bonusPoint: number; explanation: string | null }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const approvalHistoriesQuery = useQuery({
    queryKey: ['specialist-approval-histories', submissionId],
    queryFn: () => localityApi.listApprovalHistories(submissionId, { page: 1, pageSize: 100 }),
    enabled: Boolean(submissionId),
  });
  const approvalHistories = approvalHistoriesQuery.data?.items ?? [];
  const resultHistoriesQueries = useQueries({
    queries: results.map((result) => ({
      queryKey: ['specialist-result-histories', result.id],
      queryFn: () => localityApi.listResultHistories(result.id, { page: 1, pageSize: 100 }),
      enabled: expanded,
    })),
  });

  return (
    <Card className="overflow-hidden border-border border-t-2 border-t-primary shadow-none">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <History className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold">Lịch sử các lần nộp</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Theo dõi các lần gửi và xử lý hồ sơ.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">{approvalHistories.length} sự kiện</Badge>
            {expanded ? <ChevronDown className="size-5 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border px-4 py-5 sm:px-5">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground">Quá trình xử lý hồ sơ</h4>
              <p className="mt-1 text-sm text-muted-foreground">Các thao tác chung của hồ sơ theo thứ tự mới nhất.</p>
            </div>
            {approvalHistoriesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải lịch sử hồ sơ…</p>
            ) : approvalHistories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hồ sơ này chưa có hoạt động xử lý nào.</p>
            ) : (
              <div className="space-y-2">
                {approvalHistories
                  .slice()
                  .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                  .map((history: ApprovalHistoryItem) => {
                    const action = resolveHistoryAction(history.action, history.reason);
                    const reason = translateLegacyReason(history.reason);
                    return (
                      <div key={history.id} className="flex flex-col gap-2 border-l-2 border-border py-1 pl-4 text-sm sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{STAGE_ACTOR_LABELS[history.stageLevel] ?? 'Người dùng'} đã {HISTORY_ACTION_LABELS[action] ?? history.action ?? 'thực hiện thao tác'}</p>
                          {reason && <p className="mt-1 leading-6 text-muted-foreground">Lý do: {reason}</p>}
                        </div>
                        <time className="shrink-0 text-xs font-medium text-muted-foreground">{formatDateTime(history.createdAt)}</time>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="mt-6 border-t border-border pt-5">
              <h4 className="text-sm font-semibold text-foreground">Chi tiết theo từng tiêu chí</h4>
              <p className="mt-1 text-sm text-muted-foreground">Mỗi mục cho biết đầy đủ các lần điểm, diễn giải hoặc minh chứng được cập nhật.</p>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {results.map((result, index) => {
                  const histories = resultHistoriesQueries[index]?.data?.items ?? [];
                  return (
                    <section key={result.id} className="py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="max-w-4xl text-sm font-semibold leading-6 text-foreground">{result.criteriaContent ?? result.criteriaId}</p>
                        {!resultHistoriesQueries[index]?.isLoading && <Badge variant="secondary">{histories.length} lần</Badge>}
                      </div>
                      {resultHistoriesQueries[index]?.isLoading ? (
                        <p className="mt-2 text-sm text-muted-foreground">Đang tải lịch sử tiêu chí…</p>
                      ) : histories.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">Chưa có lần cập nhật nào.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {histories
                            .slice()
                            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                            .map((history) => (
                              <SubmissionHistoryEntry
                                key={history.id}
                                item={history}
                                currentPoint={result.point}
                                currentBonusPoint={result.bonusPoint}
                                currentExplanation={result.explanation}
                              />
                            ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function toEvidenceFiles(files: SubmissionResultFile[] | undefined): EvidenceFile[] {
  return (files ?? []).map((file) => ({
    id: file.id,
    fileName: file.displayName || file.originalName,
    fileSize: formatFileSize(file.sizeBytes),
    uploadedAt: new Intl.DateTimeFormat('vi-VN').format(new Date(file.createdAt)),
    fileId: file.id,
  }));
}

function SupplementaryDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: SupplementaryForm) => Promise<boolean>;
}) {
  const form = useForm<SupplementaryForm>({
    resolver: zodResolver(supplementarySchema),
    defaultValues: { name: '', reason: '', file: null },
  });
  const selectedFile = form.watch('file');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) form.reset({ name: '', reason: '', file: null });
  }, [form, open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm tiêu chí bổ sung"
      description="Bổ sung tiêu chí phát sinh trong quá trình thẩm định hồ sơ."
      onSubmit={form.handleSubmit(async (value) => {
        setSaving(true);
        try {
          if (await onSave(value)) onOpenChange(false);
        } finally {
          setSaving(false);
        }
      })}
      submitLabel={saving ? 'Đang lưu…' : 'Lưu'}
      submitDisabled={saving}
      cancelLabel="Đóng"
      size="max-w-3xl sm:max-w-3xl"
    >
      <div className="space-y-1.5">
        <Label htmlFor="supplementary-name">Tên tiêu chí bổ sung <span className="text-destructive">★</span></Label>
        <Input id="supplementary-name" {...form.register('name')} placeholder="Nhập tên tiêu chí bổ sung" />
        {form.formState.errors.name && <p role="alert" className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="supplementary-reason">Lý do bổ sung <span className="text-destructive">★</span></Label>
        <Textarea id="supplementary-reason" rows={3} {...form.register('reason')} placeholder="Nhập lý do cần bổ sung tiêu chí" />
        {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>File đính kèm</Label>
        <FileUpload
          value={selectedFile ? [selectedFile] : []}
          onChange={(files) => form.setValue('file', files[0] ?? null, { shouldValidate: true })}
          multiple={false}
          maxSizeMb={20}
          error={form.formState.errors.file?.message}
        />
      </div>
    </FormDialog>
  );
}

// function ScoreDialog({
//   item,
//   open,
//   onOpenChange,
//   onSave,
// }: {
//   item: SpecialistCriteriaItem | undefined;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSave: (values: ScoreForm) => void;
// }) {
//   const schema = useMemo(() => createScoreSchema(item ?? {
//     id: '', code: '', title: '', evidenceFiles: [], proposedScore: 0, proposedBonusScore: 0,
//     maxProposedScore: 0, maxProposedBonusScore: 0, explanation: '', officialScore: null,
//     officialBonusScore: null, scoreReason: '',
//   }), [item]);
//   const form = useForm<ScoreForm>({
//     resolver: zodResolver(schema),
//     defaultValues: { score: 0, bonusScore: 0 /*, scoreReason: '' */ },
//   });
//
//   useEffect(() => {
//     if (!open || !item) return;
//     form.reset({
//       score: item.officialScore ?? item.proposedScore,
//       bonusScore: item.officialBonusScore ?? item.proposedBonusScore,
//       // scoreReason: item.scoreReason,
//     });
//   }, [form, item, open]);
//
//   if (!item) return null;
//
//   const isEditing = item.officialScore !== null || item.officialBonusScore !== null;
//
//   return (
//     <FormDialog
//       open={open}
//       onOpenChange={onOpenChange}
//       title={isEditing ? 'Sửa điểm chấm' : 'Chấm điểm'}
//       description={item.title}
//       onSubmit={form.handleSubmit((values) => {
//         onSave(values);
//         onOpenChange(false);
//       })}
//       submitLabel="Lưu điểm"
//       cancelLabel="Đóng"
//     >
//       <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
//         <p className="text-xs font-medium text-muted-foreground">Địa phương đề xuất</p>
//         <div className="mt-2 grid grid-cols-2 gap-3">
//           <div><span className="text-xs text-muted-foreground">Điểm</span><p className="mt-0.5 font-semibold tabular-nums">{item.proposedScore} <span className="font-normal text-muted-foreground">/ {item.maxProposedScore}</span></p></div>
//           <div><span className="text-xs text-muted-foreground">Điểm thưởng</span><p className="mt-0.5 font-semibold tabular-nums">{item.proposedBonusScore} <span className="font-normal text-muted-foreground">/ {item.maxProposedBonusScore}</span></p></div>
//         </div>
//       </div>
//       <div className="grid gap-5 sm:grid-cols-2">
//         <div className="space-y-1.5">
//           <Label htmlFor="specialist-score">Điểm <span className="text-destructive">★</span></Label>
//           <Input id="specialist-score" type="number" min={0} max={item.maxProposedScore} step="0.25" className="text-right tabular-nums" {...form.register('score', { valueAsNumber: true })} />
//           {form.formState.errors.score && <p className="text-xs text-destructive">{form.formState.errors.score.message}</p>}
//         </div>
//         <div className="space-y-1.5">
//           <Label htmlFor="specialist-bonus-score">Điểm thưởng <span className="text-destructive">★</span></Label>
//           <Input id="specialist-bonus-score" type="number" min={0} max={item.maxProposedBonusScore} step="0.25" className="text-right tabular-nums" {...form.register('bonusScore', { valueAsNumber: true })} />
//           {form.formState.errors.bonusScore && <p className="text-xs text-destructive">{form.formState.errors.bonusScore.message}</p>}
//         </div>
//       </div>
//       {/* <div className="space-y-1.5">
//         <Label htmlFor="specialist-score-reason">Lý do sửa điểm <span className="text-muted-foreground">(bắt buộc nếu khác điểm đề xuất)</span></Label>
//         <Textarea id="specialist-score-reason" rows={3} className="resize-y" placeholder="Ví dụ: Đối chiếu minh chứng thực tế, điều chỉnh điểm phù hợp." {...form.register('scoreReason')} />
//         {form.formState.errors.scoreReason && <p className="text-xs text-destructive">{form.formState.errors.scoreReason.message}</p>}
//       </div> */}
//     </FormDialog>
//   );
// }

const revisionSchema = z.object({
  reason: z.string().trim().min(1, 'Vui lòng nhập nội dung yêu cầu chỉnh sửa.'),
  file: z.instanceof(File).nullable().refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File đính kèm không được vượt quá 20MB.'),
});

type RevisionForm = z.infer<typeof revisionSchema>;

function RevisionDialog({
  open,
  onOpenChange,
  localityName,
  criterionLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName: string;
  criterionLabel?: string;
  onSubmit: (reason: string, file: File | null) => Promise<boolean>;
}) {
  const form = useForm<RevisionForm>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { reason: '', file: null },
  });
  const [submitting, setSubmitting] = useState(false);
  const selectedFile = form.watch('file');

  useEffect(() => {
    if (open) form.reset({ reason: '', file: null });
  }, [form, open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yêu cầu địa phương chỉnh sửa"
      description={criterionLabel
        ? `Yêu cầu ${localityName} bổ sung/chỉnh sửa tiêu chí: ${criterionLabel}.`
        : `Mở lại quyền sửa hồ sơ cho ${localityName}.`}
      onSubmit={form.handleSubmit(async ({ reason, file }) => {
        setSubmitting(true);
        const success = await onSubmit(reason, file);
        setSubmitting(false);
        if (success) onOpenChange(false);
      })}
      submitLabel={submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
      cancelLabel="Đóng"
    >
      <div className="space-y-1.5">
        <Label htmlFor="revision-reason">Nội dung yêu cầu chỉnh sửa <span className="text-destructive">★</span></Label>
        <Textarea id="revision-reason" rows={4} {...form.register('reason')} placeholder="Ví dụ: Minh chứng chưa rõ nét, đề nghị bổ sung ảnh chụp thực tế" />
        {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>File đính kèm</Label>
        <FileUpload
          value={selectedFile ? [selectedFile] : []}
          onChange={(files) => form.setValue('file', files[0] ?? null, { shouldValidate: true })}
          multiple={false}
          maxSizeMb={20}
          error={form.formState.errors.file?.message}
        />
      </div>
    </FormDialog>
  );
}

function OverallStatusBadge({ status }: { status: LocalityRow['overallStatus'] }) {
  if (status === 'CHUA_NOP') return <Badge variant="outline" className="text-muted-foreground">Chưa nộp</Badge>;
  if (status === 'DA_DUYET') return <Badge variant="success">Đã duyệt</Badge>;
  if (status === 'YEU_CAU_SUA') return <Badge variant="warning">Yêu cầu chỉnh sửa</Badge>;
  return <Badge className="border border-accent/40 bg-accent/20 text-foreground">Đang chờ duyệt</Badge>;
}

function GroupStatusBadge({ status }: { status: SpecialistCriteriaGroup['status'] }) {
  if (status === 'DA_CHAM') return <Badge variant="success"><CheckCircle2 className="size-3" />Đã chấm</Badge>;
  if (status === 'CHO_CHAM') return <Badge className="border border-accent/40 bg-accent/20 text-foreground">Chờ chấm</Badge>;
  if (status === 'YEU_CAU_SUA') return <Badge variant="warning">Yêu cầu chỉnh sửa</Badge>;
  return <Badge variant="secondary">Chưa nộp</Badge>;
}

function TableSectionHeader({ title, countLabel, actions }: { title: string; countLabel: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-5">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">{countLabel}</span>
      </div>
      {actions}
    </div>
  );
}

function EvidenceButton({ files, onClick }: { files: EvidenceFile[]; onClick: () => void }) {
  if (files.length === 0) {
    return <p className="text-xs text-muted-foreground">Chưa có minh chứng</p>;
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <FileText className="size-4" />
      Xem file
      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
        {files.length}
      </span>
    </Button>
  );
}

function EvidenceFilesDialog({
  item,
  onOpenChange,
}: {
  item: SpecialistCriteriaItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const files = item?.evidenceFiles ?? [];
  const [previewFile, setPreviewFile] = useState<{ id: string; originalName: string } | null>(null);

  return (
    <>
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border bg-muted/25 px-6 py-5 pr-12">
          <DialogTitle>Minh chứng đã nộp</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {item ? `${item.code} · ${item.title}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Danh sách file</p>
            <Badge variant="secondary">{files.length} file</Badge>
          </div>
          {files.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Tiêu chí này chưa có file minh chứng.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {files.map((file) => (
                <div key={file.id} className="flex min-w-0 items-center gap-3 px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <TruncatedText as="p" value={file.fileName} className="text-sm font-medium text-foreground" />
                    <p className="mt-0.5 text-xs text-muted-foreground">{file.fileSize} · Nộp ngày {file.uploadedAt}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={`Xem ${file.fileName}`}
                    aria-label={`Xem ${file.fileName}`}
                    onClick={() => setPreviewFile({ id: file.fileId, originalName: file.fileName })}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={`Tải xuống ${file.fileName}`}
                    aria-label={`Tải xuống ${file.fileName}`}
                    onClick={() => {
                      void downloadFile(file.fileId, file.fileName).catch(() => toast.error('Không tải được file'));
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-lg px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <FilePreviewDialog file={previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} />
    </>
  );
}

function ProposedScoreSummary({ item }: { item: SpecialistCriteriaItem }) {
  if (item.isAddedBySpecialist) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2" aria-label="Điểm địa phương đề xuất">
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <p className="min-h-8 text-xs leading-4 text-muted-foreground">Điểm</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">
          {item.proposedScore}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {item.maxProposedScore}</span>
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <p className="min-h-8 text-xs leading-4 text-muted-foreground">Điểm thưởng</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">
          {item.proposedBonusScore}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {item.maxProposedBonusScore}</span>
        </p>
      </div>
    </div>
  );
}

function SpecialistScoreInput({
  label,
  value,
  maximum,
  disabled = false,
  onFocus,
  onChange,
}: {
  label: string;
  value: number | null;
  maximum: number;
  disabled?: boolean;
  onFocus: () => void;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="min-w-0 max-w-[132px] space-y-1.5">
      <Label className="block truncate text-[11px] font-medium leading-none text-muted-foreground">{label}</Label>
      <div className="group relative flex h-9 min-w-[104px] items-center rounded-md border border-border bg-background transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/30 focus-within:border-primary focus-within:bg-primary/[0.02] focus-within:ring-2 focus-within:ring-primary/10">
        <Input
          aria-label={`${label}, tối đa ${maximum} điểm`}
          type="number"
          min={0}
          max={maximum}
          step="0.25"
          disabled={disabled}
          className="h-full min-w-0 flex-1 appearance-none rounded-md border-0 bg-transparent py-0 pl-2.5 pr-14 text-right text-sm font-semibold tabular-nums text-foreground shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={value ?? ''}
          placeholder="—"
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center rounded-[4px] bg-success/10 px-1.5 py-1 text-[11px] font-semibold leading-none tabular-nums text-success transition-colors group-focus-within:bg-success/15">
          /{maximum}
        </span>
      </div>
    </div>
  );
}

function CriterionDetailDialog({
  item,
  open,
  onOpenChange,
  onViewEvidence,
  onEdit,
  editDisabled = false,
  editDisabledReason,
}: {
  item: SpecialistCriteriaItem | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewEvidence: (item: SpecialistCriteriaItem) => void;
  onEdit: (item: SpecialistCriteriaItem) => void;
  editDisabled?: boolean;
  editDisabledReason?: string;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/25 px-6 py-5 pr-12">
          <DialogTitle>Chi tiết tiêu chí con</DialogTitle>
          <DialogDescription>{item.code}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Nội dung tiêu chí</p>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-foreground">{item.title}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-4">
            <SnapshotField label="Địa phương đề xuất" value={`${item.proposedScore} / ${item.maxProposedScore}`} />
            <SnapshotField label="Điểm thưởng đề xuất" value={`${item.proposedBonusScore} / ${item.maxProposedBonusScore}`} />
            <SnapshotField label="Chuyên viên chấm" value={item.officialScore === null ? 'Chưa chấm' : `${item.officialScore} / ${item.maxProposedScore}`} />
            <SnapshotField label="Điểm thưởng chấm" value={item.officialBonusScore === null ? 'Chưa chấm' : `${item.officialBonusScore} / ${item.maxProposedBonusScore}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Nội dung diễn giải</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{item.explanation || 'Chưa có diễn giải.'}</p>
          </div>
          {item.scoreReason && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Lý do sửa điểm</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">{item.scoreReason}</p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Minh chứng đã nộp</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.evidenceFiles.length} file đính kèm</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onViewEvidence(item)}>
              <FileText className="size-4" />Xem file
            </Button>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          {!item.isAddedBySpecialist && (
            <Button type="button" disabled={editDisabled} disabledReason={editDisabledReason} onClick={() => onEdit(item)}><Edit3 className="size-4" />Sửa điểm</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScoreEditDialog({
  item,
  open,
  onOpenChange,
  onSave,
  initialAttachment = null,
}: {
  item: SpecialistCriteriaItem | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ScoreEditForm, attachment: File | null, attachmentChanged: boolean) => void;
  initialAttachment?: File | null;
}) {
  const form = useForm<ScoreEditForm>({
    resolver: zodResolver(scoreEditSchema),
    defaultValues: { score: 0, bonusScore: 0, reason: '' },
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentChanged, setAttachmentChanged] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    if (item && open) {
      form.reset({
        score: item.officialScore ?? item.proposedScore,
        bonusScore: item.officialBonusScore ?? item.proposedBonusScore,
        reason: item.scoreReason,
      });
      setAttachment(initialAttachment);
      setAttachmentChanged(false);
      setAttachmentError(null);
    }
  }, [form, initialAttachment, item, open]);

  if (!item) return null;

  const submit = (values: ScoreEditForm) => {
    const scoreChanged = values.score !== item.proposedScore || values.bonusScore !== item.proposedBonusScore;
    if (scoreChanged && !values.reason.trim()) {
      form.setError('reason', { message: 'Vui lòng nhập lý do khi điểm chấm khác điểm địa phương đề xuất.' });
      return;
    }
    if (values.score > item.maxProposedScore) {
      form.setError('score', { message: `Điểm chấm không được vượt quá ${item.maxProposedScore}.` });
      return;
    }
    if (values.bonusScore > item.maxProposedBonusScore) {
      form.setError('bonusScore', { message: `Điểm thưởng không được vượt quá ${item.maxProposedBonusScore}.` });
      return;
    }
    if (attachmentError) return;
    onSave(values, attachment, attachmentChanged);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border bg-muted/25 px-6 py-5 pr-12">
          <DialogTitle>Sửa điểm chuyên viên</DialogTitle>
          <DialogDescription className="line-clamp-2">{item.code} · {item.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)}>
          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-2 divide-x divide-border overflow-hidden rounded-lg border border-border">
              <SnapshotField label="Địa phương đề xuất" value={`${item.proposedScore} / ${item.maxProposedScore}`} />
              <SnapshotField label="Điểm thưởng đề xuất" value={`${item.proposedBonusScore} / ${item.maxProposedBonusScore}`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="specialist-score">Điểm chuyên viên <span className="text-danger">★</span></Label>
                <Input id="specialist-score" type="number" min={0} max={item.maxProposedScore} step="0.25" {...form.register('score')} />
                <p className="text-xs text-muted-foreground">Tối đa {item.maxProposedScore} điểm</p>
                {form.formState.errors.score && <p className="text-xs text-danger">{form.formState.errors.score.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="specialist-bonus-score">Điểm thưởng <span className="text-danger">★</span></Label>
                <Input id="specialist-bonus-score" type="number" min={0} max={item.maxProposedBonusScore} step="0.25" {...form.register('bonusScore')} />
                <p className="text-xs text-muted-foreground">Tối đa {item.maxProposedBonusScore} điểm</p>
                {form.formState.errors.bonusScore && <p className="text-xs text-danger">{form.formState.errors.bonusScore.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialist-score-reason">Lý do sửa điểm <span className="text-muted-foreground">(bắt buộc nếu khác đề xuất)</span></Label>
              <Textarea id="specialist-score-reason" rows={3} placeholder="Nhập lý do điều chỉnh điểm..." {...form.register('reason')} />
              {form.formState.errors.reason && <p className="text-xs text-danger">{form.formState.errors.reason.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tệp đính kèm <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label>
              <FileUpload
                value={attachment ? [attachment] : []}
                onChange={(files) => {
                  const file = files[0] ?? null;
                  setAttachment(file);
                  setAttachmentChanged(true);
                  setAttachmentError(file && file.size > MAX_FILE_SIZE ? 'Tệp đính kèm không được vượt quá 20MB.' : null);
                }}
                multiple={false}
                maxSizeMb={20}
                error={attachmentError}
              />
              <p className="text-xs text-muted-foreground">Bạn có thể bỏ qua nếu không cần bổ sung minh chứng cho việc sửa điểm.</p>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button type="submit"><Save className="size-4" />Áp dụng điểm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SpecialistReviewPage() {
  const { diaPhuongId, nhomTieuChiId } = useParams<{ diaPhuongId?: string; nhomTieuChiId?: string }>();
  const localityCode = diaPhuongId?.replace(/^loc-/i, '');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localitySearch, setLocalitySearch] = useState('');
  const [submissionStageFilter, setSubmissionStageFilter] = useState<SubmissionStageFilter>('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupStatusFilter, setGroupStatusFilter] = useState<GroupStatusFilter>('');
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [criterionDetailOpen, setCriterionDetailOpen] = useState(false);
  const [scoreEditOpen, setScoreEditOpen] = useState(false);
  const [expandedCriterionHistoryId, setExpandedCriterionHistoryId] = useState<string | null>(null);
  const [scoreRevisionResult, setScoreRevisionResult] = useState<SubmissionResultItem | null>(null);
  const [viewingEvidenceItem, setViewingEvidenceItem] = useState<SpecialistCriteriaItem | null>(null);
  const [forwardingPreviewFile, setForwardingPreviewFile] = useState<{ id: string; originalName: string } | null>(null);
  const debouncedLocalitySearch = useDebounce(localitySearch, 300);
  // Lọc stage chỉ áp dụng cho danh sách. Khi vào drill-down phải luôn tải đủ
  // hồ sơ của địa phương để không thiếu nhóm tiêu chí ngoài trạng thái vừa lọc.
  const activeSubmissionStage = diaPhuongId ? '' : submissionStageFilter;

  // ── Data fetching ───────────────────────────────────────────────────────────
  // Chỉ tab "Tất cả" của danh sách mới yêu cầu BE trả thêm các phường/xã chưa nộp;
  // drill-down và các tab lọc theo stage chỉ cần submission thật.
  const includeUnsubmitted = !diaPhuongId && !submissionStageFilter;
  const isDetailRoute = Boolean(nhomTieuChiId);
  const allSubmissionsQuery = useQuery({
    queryKey: ['specialist-submissions', { stage: activeSubmissionStage, includeUnsubmitted }],
    queryFn: () => listEverySubmission(activeSubmissionStage, includeUnsubmitted),
    enabled: !isDetailRoute,
  });
  const detailGroupSubmissionsQuery = useQuery({
    queryKey: ['specialist-group-submissions', nhomTieuChiId],
    queryFn: () => listEverySubmissionByGroup(nhomTieuChiId!),
    enabled: isDetailRoute,
  });
  const visibleSubmissionItems = useMemo(
    () => isDetailRoute
      ? (detailGroupSubmissionsQuery.data?.items ?? [])
      : (allSubmissionsQuery.data?.items ?? []),
    [allSubmissionsQuery.data?.items, detailGroupSubmissionsQuery.data?.items, isDetailRoute],
  );

  const groupsQuery = useQuery({
    queryKey: ['specialist-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  // Danh sách địa phương = nhóm submissions theo locality (wardCode)
  const totalAppliedGroups = useMemo(
    () => (groupsQuery.data?.items ?? []).filter((g) => g.status === 'Applied' || g.status === 'Published').length,
    [groupsQuery.data],
  );

  const localityRows: LocalityRow[] = useMemo(() => {
    // Ở danh sách không hiện bản nháp chưa nộp. Riêng trang chi tiết vẫn giữ bản nháp
    // để xác định đúng địa phương theo URL và không chặn màn hình bằng EmptyState.
    const items = isDetailRoute
      ? visibleSubmissionItems
      : visibleSubmissionItems.filter((submission) => submission.currentStage !== 'Draft');
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const s of items) {
      const key = getSubmissionLocalityCode(s);
      if (!byLocality.has(key)) byLocality.set(key, []);
      byLocality.get(key)!.push(s);
    }
    return Array.from(byLocality.entries()).map(([wardCode, subs]) => {
      // Row hasSubmission=false là phường/xã chưa nộp bài do BE tổng hợp
      const realSubs = subs.filter(isRealSubmission);
      const unsubmitted = realSubs.length === 0;
      const statuses = realSubs.map((s) => STAGE_TO_STATUS[s.currentStage] ?? 'CHO_DUYET');
      const overallStatus: LocalityRow['overallStatus'] = unsubmitted
        ? 'CHUA_NOP'
        : statuses.includes('YEU_CAU_SUA')
          ? 'YEU_CAU_SUA'
          : statuses.includes('CHO_DUYET')
            ? 'CHO_DUYET'
            : 'DA_DUYET';
      return {
        localityId: wardCode,
        localityName: subs[0]?.localityFullName ?? subs[0]?.createdByUsername ?? wardCode,
        completionRate: `${realSubs.filter((s) => STAGE_TO_GROUP_STATUS[s.currentStage] === 'DA_CHAM').length}/${totalAppliedGroups}`,
        overallStatus,
        hasNewSubmissions: statuses.includes('CHO_DUYET'),
        hasModificationRequest: statuses.includes('YEU_CAU_SUA'),
        submissionIds: realSubs.map((s) => s.id),
      };
    });
  }, [totalAppliedGroups, visibleSubmissionItems, isDetailRoute]);

  // Submissions của địa phương đang chọn (bỏ qua row tổng hợp chưa nộp)
  const localitySubmissions = useMemo(
    () => visibleSubmissionItems.filter(isRealSubmission).filter((s) => getSubmissionLocalityCode(s) === localityCode),
    [visibleSubmissionItems, localityCode],
  );

  const submissionByGroup = useMemo(() => {
    const map = new Map<string, SubmissionApi>();
    for (const s of localitySubmissions) map.set(s.criteriaGroupId, s);
    return map;
  }, [localitySubmissions]);

  // Nhóm tiêu chí của địa phương đang chọn (chỉ hiện group Applied hoặc đã có submission)
  const localityGroups: SpecialistCriteriaGroup[] = useMemo(() => {
    const groups = groupsQuery.data?.items ?? [];
    return groups
      .filter((g) => g.status === 'Applied' || g.status === 'Published' || submissionByGroup.has(g.id))
      .map((g) => {
        const submission = submissionByGroup.get(g.id);
        const items: SpecialistCriteriaItem[] = (g.criteria ?? [])
          .filter((c) => c.type !== 'Supplementary' || c.targetSubmissionId === submission?.id)
          .map((c, idx) => {
          const result = submission?.results.find((r) => r.criteriaId === c.id);
          return {
            id: c.id,
            code: `TC_${String(idx + 1).padStart(2, '0')}`,
            title: c.content,
            evidenceFiles: [],
            proposedScore: result?.point ?? 0,
            proposedBonusScore: result?.bonusPoint ?? 0,
            maxProposedScore: c.maxPoint,
            maxProposedBonusScore: c.maxBonusPoint,
            explanation: result?.explanation ?? '',
            officialScore: result?.officialPoint ?? null,
            officialBonusScore: result?.officialBonusPoint ?? null,
            scoreReason: result?.officialReason ?? '',
            isAddedBySpecialist: c.type === 'Supplementary',
          };
          });
        return {
          id: g.id,
          code: g.name,
          groupName: g.name,
          description: g.content ?? '',
          totalProposedScore: submission?.results.reduce((sum, r) => sum + r.point, 0) ?? 0,
          totalProposedBonusScore: submission?.results.reduce((sum, r) => sum + r.bonusPoint, 0) ?? 0,
          status: submission ? (STAGE_TO_GROUP_STATUS[submission.currentStage] ?? 'CHO_CHAM') : 'CHUA_NOP',
          hasModificationRequest: submission?.currentStage === 'RequiresRevision',
          items,
        };
      });
  }, [groupsQuery.data, submissionByGroup]);

  const district: LocalityRow | undefined = useMemo(
    () => localityRows.find((row) => row.localityId === localityCode),
    [localityRows, localityCode],
  );

  // Chi tiết submission đang chọn
  const selectedSubmission = useMemo(
    () => localitySubmissions.find((s) => s.criteriaGroupId === nhomTieuChiId),
    [localitySubmissions, nhomTieuChiId],
  );

  const selectedGroupDetailQuery = useQuery({
    queryKey: ['specialist-group-detail', nhomTieuChiId],
    queryFn: () => specialistApi.getCriteriaGroup(nhomTieuChiId!),
    enabled: Boolean(nhomTieuChiId),
  });

  const selectedSubmissionDetailQuery = useQuery({
    queryKey: ['specialist-submission-detail', selectedSubmission?.id],
    queryFn: () => specialistApi.getSubmission(selectedSubmission!.id),
    enabled: Boolean(selectedSubmission?.id),
  });
  const selectedForwardingHistoriesQuery = useQuery({
    queryKey: ['specialist-forwarding-histories', selectedSubmission?.id],
    queryFn: () => specialistApi.listApprovalHistories(selectedSubmission!.id, { action: 'Approve', page: 1, pageSize: 100 }),
    enabled: Boolean(selectedSubmission?.id),
  });
  const selectedRevisionHistoriesQuery = useQuery({
    queryKey: ['specialist-revision-histories', selectedSubmission?.id],
    queryFn: () => localityApi.listApprovalHistories(selectedSubmission!.id, {
      action: 'RequestRevision',
      page: 1,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    enabled: Boolean(selectedSubmission?.id),
  });
  const legacySpecialistForwardingFilesQuery = useQuery({
    queryKey: ['specialist-legacy-forwarding-files', selectedSubmission?.id],
    queryFn: () => filesApi.list({ entityType: 'Submission', entityId: selectedSubmission!.id, category: 'SpecialistForwarding', page: 1, pageSize: 50 }),
    enabled: Boolean(selectedSubmission?.id),
  });

  const selectedGroup: SpecialistCriteriaGroup | undefined = useMemo(() => {
    if (!nhomTieuChiId) return undefined;
    const group = selectedGroupDetailQuery.data;
    if (!group) return undefined;
    const submission = selectedSubmissionDetailQuery.data;
    const items: SpecialistCriteriaItem[] = (group.criteria ?? [])
      .filter((c) => c.type !== 'Supplementary' || c.targetSubmissionId === submission?.id)
      .map((c, idx) => {
      const result = submission?.results.find((r) => r.criteriaId === c.id);
      return {
        id: c.id,
        code: `TC_${String(idx + 1).padStart(2, '0')}`,
        title: c.content,
        evidenceFiles: toEvidenceFiles(result?.files),
        proposedScore: result?.point ?? 0,
        proposedBonusScore: result?.bonusPoint ?? 0,
        maxProposedScore: c.maxPoint,
        maxProposedBonusScore: c.maxBonusPoint,
        explanation: result?.explanation ?? '',
        officialScore: result?.officialPoint ?? null,
        officialBonusScore: result?.officialBonusPoint ?? null,
        scoreReason: result?.officialReason ?? '',
        isAddedBySpecialist: c.type === 'Supplementary',
      };
      });
    return {
      id: group.id,
      code: group.name,
      groupName: group.name,
      description: group.content ?? '',
      totalProposedScore: submission?.results.reduce((sum, r) => sum + r.point, 0) ?? 0,
      totalProposedBonusScore: submission?.results.reduce((sum, r) => sum + r.bonusPoint, 0) ?? 0,
      status: submission ? (STAGE_TO_GROUP_STATUS[submission.currentStage] ?? 'CHO_CHAM') : 'CHUA_NOP',
      hasModificationRequest: submission?.currentStage === 'RequiresRevision',
      items,
    };
  }, [nhomTieuChiId, selectedGroupDetailQuery.data, selectedSubmissionDetailQuery.data]);

  const selectedRevisionNotes = useMemo(() => {
    const histories = selectedRevisionHistoriesQuery.data?.items ?? [];
    return {
      leader: getLatestRevisionReason(histories, 'SpecialistApproved'),
      council: getLatestRevisionReason(histories, 'LeaderApproved'),
      committee: getLatestRevisionReason(histories, 'CouncilApproved'),
    };
  }, [selectedRevisionHistoriesQuery.data]);

  // Local state cho điểm chuyên viên chấm (đè lên dữ liệu API)
  const [scoreOverrides, setScoreOverrides] = useState<Map<string, Partial<SpecialistCriteriaItem>>>(new Map());
  const [pendingScoreAttachments, setPendingScoreAttachments] = useState<Map<string, File>>(new Map());

  useEffect(() => {
    setPendingScoreAttachments(new Map());
  }, [nhomTieuChiId, selectedSubmission?.id]);

  const applyOverrides = (group: SpecialistCriteriaGroup): SpecialistCriteriaGroup => ({
    ...group,
    items: group.items.map((item) => {
      const override = scoreOverrides.get(item.id);
      return override ? { ...item, ...override } : item;
    }),
  });

  const updateCriterion = (criterionId: string, values: Partial<SpecialistCriteriaItem>) => {
    setScoreOverrides((prev) => new Map(prev).set(criterionId, { ...prev.get(criterionId), ...values }));
  };

  const filteredGroups = useMemo(() => {
    const keyword = groupSearch.trim().toLocaleLowerCase('vi');
    return localityGroups.filter((group) =>
      (!keyword || `${group.code} ${group.groupName} ${group.description}`.toLocaleLowerCase('vi').includes(keyword))
      && (!groupStatusFilter || group.status === groupStatusFilter),
    );
  }, [localityGroups, groupSearch, groupStatusFilter]);

  const filteredLocalityRows = useMemo(() => {
    const keyword = debouncedLocalitySearch.trim().toLocaleLowerCase('vi');
    return localityRows.filter((row) => {
      const matchesSearch = !keyword || `${row.localityId} ${row.localityName}`.toLocaleLowerCase('vi').includes(keyword);
      return matchesSearch;
    });
  }, [localityRows, debouncedLocalitySearch]);

  if (!diaPhuongId) {
    const visibleRows = filteredLocalityRows;
    const selectedLocality = visibleRows.find((row) => row.localityId === selectedLocalityId);
    if (allSubmissionsQuery.isLoading || groupsQuery.isLoading) {
      return <div className="space-y-6"><PageHeader title="Danh sách địa phương" description="COL.01.05 · Theo dõi tiến độ và trạng thái hồ sơ" /><PageLoading label="Đang tải danh sách địa phương…" /></div>;
    }
    if (allSubmissionsQuery.isError || groupsQuery.isError) {
      return <EmptyState title="Không tải được dữ liệu" description={getFilesApiError(allSubmissionsQuery.error ?? groupsQuery.error)} />;
    }

    return (
      <div className="space-y-6">
        <PageHeader title="Danh sách địa phương" description="COL.01.05 · Theo dõi tiến độ và trạng thái hồ sơ" />
        <div className="overflow-hidden rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
          <TableSectionHeader title="Hồ sơ địa phương" countLabel={`${visibleRows.length} địa phương`} />
          <div className="border-b border-border bg-[linear-gradient(135deg,rgba(168,32,44,0.035),transparent_42%)] px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Tabs value={submissionStageFilter || 'ALL'} onValueChange={(value) => setSubmissionStageFilter(value === 'ALL' ? '' : value as SubmissionStageFilter)}>
                <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1 pb-1">
                  {QUICK_STAGE_FILTERS.map((filter) => (
                    <TabsTrigger
                      key={filter.value || 'ALL'}
                      value={filter.value || 'ALL'}
                      className="!flex-none h-9 rounded-md px-3 data-active:bg-primary/5 data-active:text-primary after:bg-primary"
                    >
                      {filter.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Lọc trạng thái được áp dụng từ máy chủ
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full max-w-xl sm:flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm địa phương"
                value={localitySearch}
                onChange={(event) => setLocalitySearch(event.target.value)}
                placeholder="Tìm kiếm tên hoặc mã địa phương"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TableColumnVisibility
                storageKey="specialist-localities"
                columns={[
                  { id: 'locality', label: 'Tên địa phương' },
                  { id: 'completion', label: 'Nhóm tiêu chí đã hoàn thành' },
                  { id: 'status', label: 'Trạng thái hồ sơ' },
                  { id: 'new-submissions', label: 'Tiêu chí mới được nộp' },
                  { id: 'revision', label: 'Yêu cầu chỉnh sửa' },
                  { id: 'updates', label: 'Cập nhật thông tin mới' },
                ]}
              />
              <Button
                variant="info"
                disabled={!selectedLocality}
                disabledReason="Chọn một địa phương trong bảng để xem hồ sơ."
                onClick={() => selectedLocality && navigate(`/chuyen-vien/duyet/${selectedLocality.localityId}`)}
              >
                <Eye className="size-4" />Xem hồ sơ
              </Button>
              <p className="hidden text-xs text-muted-foreground sm:block">
                <span className="font-medium text-foreground">{visibleRows.length}</span> kết quả phù hợp
              </p>
            </div>
          </div>

          <div className="hidden xl:block">
            <Table data-column-visibility-table="specialist-localities" className="w-full min-w-[1120px] table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[16%]" />
                <col className="w-[17%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Tên địa phương</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Nhóm tiêu chí đã hoàn thành</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Trạng thái hồ sơ</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Tiêu chí mới được nộp</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Yêu cầu chỉnh sửa</TableHead>
                  <TableHead className="whitespace-normal bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Cập nhật thông tin mới</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => {
                  const newGroups = row.hasNewSubmissions ? 1 : 0;
                  return (
                  <TableRow
                    key={row.localityId}
                    aria-selected={selectedLocalityId === row.localityId}
                    className={selectedLocalityId === row.localityId ? 'cursor-pointer bg-primary/10 hover:bg-primary/10' : 'cursor-pointer hover:bg-muted'}
                    onClick={() => setSelectedLocalityId(row.localityId)}
                    onDoubleClick={() => navigate(`/chuyen-vien/duyet/${row.localityId}`)}
                  >
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-4" /></span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-5 text-foreground">{row.localityName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{row.localityId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center"><span className="font-semibold tabular-nums">{row.completionRate}</span><span className="ml-1 text-xs text-muted-foreground">nhóm</span></TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center"><OverallStatusBadge status={row.overallStatus} /></TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center">{newGroups > 0 ? <Badge variant="secondary">{newGroups} nhóm</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center">{row.hasModificationRequest ? <Badge variant="warning">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                    <TableCell className="px-4 py-4 text-center">{row.hasNewSubmissions ? <Badge variant="secondary">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                  </TableRow>
                  );
                })}
                {visibleRows.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Không có địa phương phù hợp.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="xl:hidden">
            {visibleRows.length > 0 ? visibleRows.map((row) => (
              <article key={row.localityId} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-5 text-foreground">{row.localityName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{row.localityId}</p>
                    </div>
                  </div>
                  <OverallStatusBadge status={row.overallStatus} />
                </div>
                <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Đã hoàn thành</dt><dd className="mt-1 font-semibold tabular-nums">{row.completionRate} nhóm</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Tiêu chí mới</dt><dd className="mt-1 font-semibold tabular-nums">{row.hasNewSubmissions ? '1 nhóm' : '0 nhóm'}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Yêu cầu sửa</dt><dd className="mt-1 font-medium">{row.hasModificationRequest ? 'Có' : 'Không'}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Cập nhật mới</dt><dd className="mt-1 font-medium">{row.hasNewSubmissions ? 'Có' : 'Không'}</dd></div>
                </dl>
                <Button className="mt-4 w-full sm:w-auto" onClick={() => navigate(`/chuyen-vien/duyet/${row.localityId}`)}><Eye className="size-4" />Xem hồ sơ</Button>
              </article>
            )) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">Không có địa phương phù hợp.</p>
            )}
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">{visibleRows.length} kết quả · 10 dòng/trang</div>
        </div>
      </div>
    );
  }

  const drillDownSubmissionsQuery = isDetailRoute ? detailGroupSubmissionsQuery : allSubmissionsQuery;

  if (drillDownSubmissionsQuery.isLoading || groupsQuery.isLoading) {
    return <PageLoading label={isDetailRoute ? 'Đang tải chi tiết chấm điểm…' : 'Đang tải nhóm tiêu chí…'} />;
  }

  if (drillDownSubmissionsQuery.isError || groupsQuery.isError) {
    return <EmptyState title="Không tải được dữ liệu" description={getFilesApiError(drillDownSubmissionsQuery.error ?? groupsQuery.error)} />;
  }

  if (!district) {
    return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không tồn tại trong dữ liệu." />;
  }

  if (!nhomTieuChiId) {
    const completedGroups = localityGroups.filter((group) => group.status === 'DA_CHAM').length;
    const revisionGroups = localityGroups.filter((group) => group.hasModificationRequest).length;
    const totalCount = localityGroups.length;
    const completionPercent = totalCount > 0 ? Math.min(100, Math.round((completedGroups / totalCount) * 100)) : 0;
    const selectedGroupRow = filteredGroups.find((group) => group.id === selectedGroupId);

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link>
          <span>/</span>
          <span className="font-medium text-foreground">{district.localityName}</span>
        </div>
        <PageHeader
          title={`Nhóm tiêu chí của ${district.localityName}`}
          description="Xem tiến độ và thực hiện chấm điểm từng nhóm tiêu chí"
          actions={<Button variant="outline" render={<Link to="/chuyen-vien/duyet" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>}
        />

        <section className="grid gap-5 rounded-lg border border-border border-l-[3px] border-l-primary bg-card p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-center" aria-label="Tổng quan địa phương">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-5" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{district.localityName}</h2>
                <OverallStatusBadge status={district.overallStatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Hồ sơ thi đua năm 2026 · {completedGroups} nhóm đã chấm</p>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nhóm tiêu chí đã hoàn thành</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{completedGroups}/{totalCount}</p>
              </div>
              {revisionGroups > 0 && <Badge variant="warning">{revisionGroups} nhóm cần chỉnh sửa</Badge>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tiến độ hoàn thành nhóm tiêu chí" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </section>

        <div className="overflow-clip rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
          <TableSectionHeader title="Nhóm tiêu chí thi đua" countLabel={`${filteredGroups.length} nhóm tiêu chí`} />
          <div className="sticky top-[-16px] z-20 flex flex-col gap-3 border-b border-border bg-card/95 px-4 py-4 shadow-[0_6px_16px_-12px_rgba(31,27,26,0.28)] backdrop-blur sm:top-[-24px] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full max-w-xl sm:flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm nhóm tiêu chí"
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm kiếm tên hoặc mã nhóm tiêu chí"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TableColumnVisibility
                storageKey="specialist-criteria-groups"
                columns={[
                  { id: 'group', label: 'Nhóm tiêu chí' },
                  { id: 'content', label: 'Nội dung' },
                  { id: 'proposed-score', label: 'Điểm đề xuất' },
                  { id: 'bonus-score', label: 'Điểm thưởng' },
                  { id: 'status', label: 'Trạng thái' },
                ]}
              />
              <FilterDropdown
                activeCount={groupStatusFilter ? 1 : 0}
                activeFilters={groupStatusFilter ? [{ label: 'Trạng thái', value: getGroupStatusFilterLabel(groupStatusFilter), onClear: () => setGroupStatusFilter('') }] : undefined}
                onClear={() => setGroupStatusFilter('')}
              >
                <FilterSelect
                  label="Trạng thái"
                  value={groupStatusFilter}
                  onChange={(value) => setGroupStatusFilter(value as GroupStatusFilter)}
                  options={GROUP_STATUS_FILTER_OPTIONS}
                />
              </FilterDropdown>
              <Button
                variant={selectedGroupRow?.status === 'DA_CHAM' ? 'outline' : 'info'}
                disabled={!selectedGroupRow}
                disabledReason="Chọn một nhóm tiêu chí trong bảng để xem hoặc chấm điểm."
                onClick={() => selectedGroupRow && navigate(`/chuyen-vien/duyet/${district.localityId}/${selectedGroupRow.id}`)}
              >
                {selectedGroupRow?.status === 'CHO_CHAM' || selectedGroupRow?.status === 'YEU_CAU_SUA' ? <Edit3 className="size-4" /> : <Eye className="size-4" />}
                {selectedGroupRow?.status === 'CHO_CHAM' || selectedGroupRow?.status === 'YEU_CAU_SUA' ? 'Chấm điểm' : 'Xem chi tiết'}
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><strong className="font-semibold text-success">{completedGroups}</strong> đã chấm</span>
                <span className="h-3 w-px bg-border" />
                <span><strong className="font-semibold text-warning-foreground">{revisionGroups}</strong> cần chỉnh sửa</span>
              </div>
            </div>
          </div>

          <div className="hidden xl:block [&>[data-slot=table-container]]:contents">
            <Table data-column-visibility-table="specialist-criteria-groups" className="w-full min-w-[1180px] table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[34%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="sticky top-[57px] z-10 bg-primary shadow-[0_6px_12px_-10px_rgba(31,27,26,0.35)] hover:bg-primary sm:top-[49px]">
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Nhóm tiêu chí</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Nội dung</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Điểm đề xuất</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Điểm thưởng</TableHead>
                  <TableHead className="whitespace-normal bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow
                    key={group.id}
                    aria-selected={selectedGroupId === group.id}
                    className={selectedGroupId === group.id ? 'cursor-pointer bg-primary/10 hover:bg-primary/10' : 'cursor-pointer hover:bg-muted'}
                    onClick={() => setSelectedGroupId(group.id)}
                    onDoubleClick={() => navigate(`/chuyen-vien/duyet/${district.localityId}/${group.id}`)}
                  >
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4 align-top"><p className="font-semibold leading-5 text-foreground">{group.groupName}</p><p className="mt-2 text-xs text-muted-foreground">{group.code}</p></TableCell>
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4 align-top text-sm leading-5 text-muted-foreground">{group.description}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center align-top font-semibold tabular-nums">{group.totalProposedScore}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center align-top tabular-nums">{group.totalProposedBonusScore}</TableCell>
                    <TableCell className="px-4 py-4 text-center align-top"><GroupStatusBadge status={group.status} /></TableCell>
                  </TableRow>
                ))}
                {filteredGroups.length === 0 && <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">Không có nhóm tiêu chí phù hợp.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border xl:hidden">
            {filteredGroups.map((group) => (
              <article key={group.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-primary">{group.code}</p>
                    <h3 className="mt-1 font-semibold leading-5 text-foreground">{group.groupName}</h3>
                  </div>
                  <GroupStatusBadge status={group.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{group.description}</p>
                <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-border bg-border">
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Điểm đề xuất</dt><dd className="mt-1 font-semibold tabular-nums">{group.totalProposedScore}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Điểm thưởng</dt><dd className="mt-1 font-semibold tabular-nums">{group.totalProposedBonusScore}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Yêu cầu sửa</dt><dd className="mt-1 font-medium">{group.hasModificationRequest ? 'Có' : 'Không'}</dd></div>
                </dl>
                <Button className="mt-4 w-full sm:w-auto" variant={group.status === 'DA_CHAM' ? 'outline' : 'default'} onClick={() => navigate(`/chuyen-vien/duyet/${district.localityId}/${group.id}`)}>
                  {group.status === 'CHO_CHAM' || group.status === 'YEU_CAU_SUA' ? <Edit3 className="size-4" /> : <Eye className="size-4" />}
                  {group.status === 'CHO_CHAM' || group.status === 'YEU_CAU_SUA' ? 'Chấm điểm' : 'Xem chi tiết'}
                </Button>
              </article>
            ))}
            {filteredGroups.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Không có nhóm tiêu chí phù hợp.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Mã nhóm tiêu chí không tồn tại trong dữ liệu." />;
  }

  const selectedSubmissionStage = selectedSubmissionDetailQuery.data?.currentStage ?? selectedSubmission?.currentStage;
  const specialistForwarding = (selectedForwardingHistoriesQuery.data?.items ?? []).find((history) => history.stageLevel === 'LocalSubmitted');
  const specialistForwardingFiles = specialistForwarding?.files?.length ? specialistForwarding.files : (legacySpecialistForwardingFilesQuery.data?.items ?? []);
  const specialistPermissions = getSpecialistSubmissionPermissions(selectedSubmissionStage);
  const specialistActionsLocked = !specialistPermissions.canEdit;
  const specialistLockReason = specialistPermissions.disabledReason;
  const displayGroup = applyOverrides(selectedGroup);
  const resultByCriteriaId = new Map(
    (selectedSubmissionDetailQuery.data?.results ?? []).map((result) => [result.criteriaId, result]),
  );
  const scoredItems = displayGroup.items.filter((item) => !item.isAddedBySpecialist);
  const scoredCount = scoredItems.filter((item) => item.officialScore !== null && item.officialBonusScore !== null).length;
  const maximumScore = scoredItems.reduce((sum, item) => sum + item.maxProposedScore, 0);
  const maximumBonusScore = scoredItems.reduce((sum, item) => sum + item.maxProposedBonusScore, 0);
  const specialistScore = scoredItems.reduce((sum, item) => sum + (item.officialScore ?? 0), 0);
  const specialistBonusScore = scoredItems.reduce((sum, item) => sum + (item.officialBonusScore ?? 0), 0);
  const selectedCriterion = selectedCriterionId
    ? displayGroup.items.find((item) => item.id === selectedCriterionId)
    : undefined;
  const scoreRevisionCriterionLabel = scoreRevisionResult?.criteriaContent
    ?? displayGroup.items.find((item) => item.id === scoreRevisionResult?.criteriaId)?.title
    ?? 'Tiêu chí con';

  const copyProposedScores = () => {
    if (specialistActionsLocked) {
      toast.info(specialistLockReason);
      return;
    }
    const newOverrides = new Map(scoreOverrides);
    for (const item of displayGroup.items) {
      if (item.isAddedBySpecialist) continue;
      newOverrides.set(item.id, {
        ...newOverrides.get(item.id),
        officialScore: item.proposedScore,
        officialBonusScore: item.proposedBonusScore,
        // scoreReason: item.isAddedBySpecialist ? item.scoreReason : '',
      });
    }
    setScoreOverrides(newOverrides);
    toast.success('Đã sao chép toàn bộ điểm đề xuất sang điểm Chuyên viên chấm.');
  };

  const openForwardDialog = () => {
    if (specialistActionsLocked) {
      toast.info(specialistLockReason);
      return;
    }
    if (displayGroup.items.length === 0) {
      toast.error('Nhóm tiêu chí chưa có tiêu chí con để gửi duyệt.');
      return;
    }
    const missingScore = displayGroup.items.some((item) => !item.isAddedBySpecialist && (item.officialScore === null || item.officialBonusScore === null));
    if (missingScore) {
      toast.error('Vui lòng chấm đủ điểm và điểm thưởng cho tất cả tiêu chí.');
      return;
    }
    // const missingReason = displayGroup.items.some((item) => {
    //   const changed = item.officialScore !== item.proposedScore || item.officialBonusScore !== item.proposedBonusScore;
    //   return changed && !item.scoreReason.trim();
    // });
    // if (missingReason) {
    //   toast.error('Vui lòng nhập lý do cho các tiêu chí có điểm chấm khác điểm đề xuất.');
    //   return;
    // }
    setForwardOpen(true);
  };

  const openSupplementaryDialog = () => {
    if (specialistActionsLocked) {
      toast.info(specialistLockReason);
      return;
    }
    const submission = submissionByGroup.get(selectedGroup.id);
    if (!submission) {
      toast.error('Nhóm này chưa có hồ sơ để bổ sung tiêu chí.');
      return;
    }
    setSupplementaryOpen(true);
  };

  const buildScoreItems = () => {
    const results = selectedSubmissionDetailQuery.data?.results ?? [];
    return displayGroup.items
      .filter((item) => item.officialScore !== null && item.officialBonusScore !== null)
      .map((item) => {
        const result = results.find((r) => r.criteriaId === item.id);
        if (!result) return null;
        return {
          submissionResultId: result.id,
          point: item.officialScore!,
          bonusPoint: item.officialBonusScore!,
          // Chuyên viên so sánh và điều chỉnh trên điểm Địa phương đề xuất.
          // Lưu lý do theo từng tiêu chí để cấp Lãnh đạo kế thừa được đầy đủ lịch sử.
          reason: item.scoreReason.trim() || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  const uploadPendingScoreAttachments = async () => {
    if (pendingScoreAttachments.size === 0) return;

    const results = selectedSubmissionDetailQuery.data?.results ?? [];
    const uploadedCriteriaIds: string[] = [];
    const failedFiles: string[] = [];

    for (const [criteriaId, file] of pendingScoreAttachments) {
      const result = results.find((item) => item.criteriaId === criteriaId);
      if (!result) {
        failedFiles.push(file.name);
        continue;
      }

      try {
        await filesApi.upload(file, {
          displayName: file.name,
          entityType: 'SubmissionResult',
          entityId: result.id,
          category: 'score-update',
        });
        uploadedCriteriaIds.push(criteriaId);
      } catch {
        failedFiles.push(file.name);
      }
    }

    if (uploadedCriteriaIds.length > 0) {
      setPendingScoreAttachments((current) => {
        const next = new Map(current);
        uploadedCriteriaIds.forEach((criteriaId) => next.delete(criteriaId));
        return next;
      });
    }
    if (failedFiles.length > 0) {
      toast.warning(`Điểm đã được lưu nhưng ${failedFiles.length} tệp đính kèm chưa tải lên được.`);
    }
  };

  const saveDraftScores = async () => {
    if (specialistActionsLocked) {
      toast.info(specialistLockReason);
      return;
    }
    const submission = submissionByGroup.get(selectedGroup.id);
    if (!submission) {
      toast.error('Nhóm này chưa có hồ sơ để chấm điểm.');
      return;
    }
    const items = buildScoreItems();
    if (items.length === 0) {
      toast.info('Chưa có điểm nào để lưu nháp.');
      return;
    }
    setSavingDraft(true);
    try {
      await specialistApi.updateScores({ submissionId: submission.id, reason: 'Lưu nháp điểm chấm của chuyên viên', scoreItems: items });
      await uploadPendingScoreAttachments();
      await queryClient.invalidateQueries({ queryKey: ['specialist-submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['specialist-submission-detail'] });
      setScoreOverrides(new Map());
      toast.success('Đã lưu nháp điểm chấm.');
    } catch (error) {
      toast.error('Không lưu được bản nháp điểm chấm.', { description: getFilesApiError(error) });
    } finally {
      setSavingDraft(false);
    }
  };

  const confirmForward = async ({ explanation, files, onProgress }: { explanation: string; files: File[]; onProgress: (percent: number) => void }) => {
    if (specialistActionsLocked) {
      toast.info(specialistLockReason);
      return;
    }
    const submission = submissionByGroup.get(selectedGroup.id);
    if (!submission) {
      toast.error('Nhóm này chưa có hồ sơ để chuyển.');
      return;
    }
    if (submission.currentStage !== 'LocalSubmitted') {
      toast.error('Chỉ hồ sơ ở trạng thái Chờ chấm mới có thể chuyển lên Lãnh đạo ban.');
      return;
    }
    try {
      const items = buildScoreItems();
      if (items.length > 0) {
        await specialistApi.updateScores({ submissionId: submission.id, reason: 'Lưu điểm chấm trước khi chuyển hồ sơ', scoreItems: items });
      }
      await uploadPendingScoreAttachments();
      await specialistApi.forwardSubmission(submission.id, explanation, files, onProgress);
      await queryClient.invalidateQueries({ queryKey: ['specialist-submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['specialist-submission-detail'] });
      setScoreOverrides(new Map());
      toast.success('Đã chuyển hồ sơ lên Lãnh đạo ban.');
    } catch (error) {
      toast.error('Không chuyển được hồ sơ lên Lãnh đạo ban.', { description: getFilesApiError(error) });
      throw error;
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link>
        <span>/</span>
        <Link className="hover:text-primary" to={`/chuyen-vien/duyet/${district.localityId}`}>{district.localityName}</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{selectedGroup.groupName}</span>
      </div>
      <PageHeader
        title="Chi tiết chấm điểm kết quả tiêu chí"
        description={`${district.localityName} · ${selectedGroup.groupName}`}
        actions={<Button variant="outline" render={<Link to={`/chuyen-vien/duyet/${district.localityId}`} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại nhóm tiêu chí</Button>}
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Tóm tắt hồ sơ chấm điểm">
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="bg-card px-4 py-3.5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-medium text-muted-foreground">Địa phương</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">{district.localityName}</p>
          </div>
          <div className="bg-card px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
            <div className="mt-1"><GroupStatusBadge status={displayGroup.status} /></div>
          </div>
          <div className="bg-card px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">Đã chấm</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{scoredCount}<span className="text-sm font-normal text-muted-foreground"> / {scoredItems.length} tiêu chí</span></p>
          </div>
          <div className="bg-card px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">Điểm chuyên viên</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{specialistScore}<span className="text-sm font-normal text-success"> / {maximumScore}</span></p>
          </div>
          <div className="bg-card px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">Điểm thưởng</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{specialistBonusScore}<span className="text-sm font-normal text-success"> / {maximumBonusScore}</span></p>
          </div>
        </div>
      </section>

      {/* <StatusStepper state={stepperState} hasRevisionRequest={selectedGroup.hasModificationRequest} revisionTarget="LOCAL" /> */}

      {selectedGroup.modificationNote && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div><p className="font-medium">Yêu cầu chỉnh sửa</p><p className="mt-0.5 text-foreground">{selectedGroup.modificationNote}</p></div>
        </div>
      )}

      <div className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card">
        <TableSectionHeader
          title="Chi tiết tiêu chí con"
          countLabel={`${selectedGroup.items.length} tiêu chí`}
          actions={
            (specialistForwarding || specialistForwardingFiles.length > 0) ? (
              <ForwardingDocumentsDialog documents={[{ label: 'Hồ sơ Chuyên viên chuyển lên', explanationLabel: 'Diễn giải hồ sơ từ chuyên viên', explanation: specialistForwarding?.reason, files: specialistForwardingFiles }]} onPreview={(file) => setForwardingPreviewFile({ id: file.id, originalName: file.displayName || file.originalName || 'Tệp đính kèm' })} />
            ) : undefined
          }
        />

        <div className="sticky top-[-16px] z-20 flex flex-col gap-3 border-b border-border bg-card/95 px-4 py-3 shadow-[0_6px_12px_-12px_rgba(31,27,26,0.22)] backdrop-blur sm:top-[-24px] lg:flex-row lg:items-center lg:justify-between sm:px-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <TableColumnVisibility
              storageKey="specialist-review-criteria"
              columns={[
                { id: 'criterion', label: 'Tiêu chí con' },
                { id: 'evidence', label: 'Minh chứng' },
                { id: 'proposed', label: 'Địa phương đề xuất' },
                { id: 'explanation', label: 'Nội dung diễn giải' },
                { id: 'score', label: 'Chuyên viên chấm' },
                { id: 'leader-revision-note', label: 'Nội dung chỉnh sửa Lãnh đạo' },
                { id: 'council-revision-note', label: 'Nội dung chỉnh sửa Hội đồng' },
                { id: 'committee-revision-note', label: 'Nội dung chỉnh sửa Ủy ban' },
              ]}
            />
            <Button variant="outline" disabled={!selectedCriterion} onClick={() => setCriterionDetailOpen(true)}>
              <Eye className="size-4" />Xem chi tiết
            </Button>
            <Button
              variant="outline"
              disabled={!selectedCriterion || selectedCriterion.isAddedBySpecialist || specialistActionsLocked}
              disabledReason={specialistActionsLocked ? specialistLockReason : selectedCriterion?.isAddedBySpecialist ? 'Tiêu chí bổ sung không có điểm để chỉnh sửa.' : 'Chọn một tiêu chí để sửa điểm.'}
              onClick={() => setScoreEditOpen(true)}
            >
              <Edit3 className="size-4" />Sửa điểm
            </Button>
            <Button variant="outline" onClick={copyProposedScores} disabled={displayGroup.items.length === 0 || specialistActionsLocked} disabledReason={specialistActionsLocked ? specialistLockReason : 'Nhóm tiêu chí chưa có tiêu chí con.'}><Sparkles className="size-4" />Cho điểm theo đề xuất</Button>
            <Button variant="outline" onClick={openSupplementaryDialog} disabled={specialistActionsLocked} disabledReason={specialistActionsLocked ? specialistLockReason : undefined}><FilePlus2 className="size-4" />Thêm tiêu chí bổ sung</Button>
            {selectedCriterion && (
              <Button variant="outline" className="border-warning/60 text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground sm:col-span-2 lg:col-span-1" disabled={specialistActionsLocked} disabledReason={specialistActionsLocked ? specialistLockReason : undefined} onClick={() => setRevisionOpen(true)}>
                <AlertCircle className="size-4 text-warning" />Yêu cầu địa phương chỉnh sửa
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:w-auto">
            <Button variant="outline" onClick={() => void saveDraftScores()} disabled={savingDraft || specialistActionsLocked} disabledReason={specialistActionsLocked ? specialistLockReason : undefined}><Save className="size-4" />{savingDraft ? 'Đang lưu' : 'Lưu nháp'}</Button>
            <Button className="w-full lg:w-auto" onClick={openForwardDialog} disabled={specialistActionsLocked} disabledReason={specialistActionsLocked ? specialistLockReason : undefined}><Send className="size-4" />Gửi Lãnh đạo ban</Button>
          </div>
        </div>

        <div className="hidden max-h-[65dvh] overflow-auto xl:block">
          <Table data-column-visibility-table="specialist-review-criteria" containerClassName="overflow-visible" className="w-full min-w-[1940px] table-fixed">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Tiêu chí con</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Minh chứng</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Địa phương đề xuất</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Nội dung diễn giải</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Chuyên viên chấm</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Nội dung chỉnh sửa Lãnh đạo</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Nội dung chỉnh sửa Hội đồng</TableHead>
                <TableHead className="sticky top-0 z-10 whitespace-normal bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Nội dung chỉnh sửa Ủy ban</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayGroup.items.map((item) => {
                const result = resultByCriteriaId.get(item.id);
                const historyExpanded = expandedCriterionHistoryId === item.id;
                return (
                  <Fragment key={item.id}>
                  <TableRow
                  aria-selected={selectedCriterionId === item.id}
                  className={selectedCriterionId === item.id ? 'cursor-pointer align-top bg-primary/[0.055] shadow-[inset_3px_0_0_#A8202C] hover:bg-primary/[0.07]' : 'cursor-pointer align-top hover:bg-muted/60'}
                  onClick={() => setSelectedCriterionId(item.id)}
                >
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5">
                    <TruncatedText
                      as="p"
                      value={item.title}
                      maxLines={4}
                      tooltipClassName="max-w-md p-3 text-sm leading-5"
                      className="font-semibold leading-5 text-foreground"
                      aria-label={`Xem đầy đủ tiêu chí: ${item.title}`}
                    />
                    <p className="mt-2 text-xs font-medium text-muted-foreground">{item.code}</p>
                    {item.isAddedBySpecialist && <Badge className="mt-3 bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
                    {result && (
                      <div className="mt-3 flex flex-wrap items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="-ml-2 h-8 px-2 text-primary hover:bg-primary/5 hover:text-primary"
                          aria-expanded={historyExpanded}
                          onClick={(event) => {
                            event.stopPropagation();
                            setExpandedCriterionHistoryId(historyExpanded ? null : item.id);
                          }}
                        >
                          {historyExpanded ? <ChevronDown className="size-4" /> : <History className="size-4" />}
                          {historyExpanded ? 'Ẩn lịch sử' : 'Xem lịch sử'}
                        </Button>
                        {result.officialReason !== null && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary hover:bg-primary/5 hover:text-primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setScoreRevisionResult(result);
                            }}
                          >
                            <Eye className="size-4" />Xem điểm đã sửa
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5">
                    <EvidenceButton
                      files={item.evidenceFiles}
                      onClick={() => {
                        setSelectedCriterionId(item.id);
                        setViewingEvidenceItem(item);
                      }}
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5"><ProposedScoreSummary item={item} /></TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5 text-sm leading-6 text-muted-foreground">{item.explanation || '—'}</TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5" onClick={(event) => event.stopPropagation()}>
                    {item.isAddedBySpecialist ? (
                      <p className="text-sm text-muted-foreground">—</p>
                    ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <SpecialistScoreInput
                        label="Điểm"
                        value={item.officialScore}
                        maximum={item.maxProposedScore}
                        disabled
                        onFocus={() => setSelectedCriterionId(item.id)}
                        onChange={(value) => updateCriterion(item.id, { officialScore: value })}
                      />
                      <SpecialistScoreInput
                        label="Điểm thưởng"
                        value={item.officialBonusScore}
                        maximum={item.maxProposedBonusScore}
                        disabled
                        onFocus={() => setSelectedCriterionId(item.id)}
                        onChange={(value) => updateCriterion(item.id, { officialBonusScore: value })}
                      />
                    </div>
                    )}
                  </TableCell>
                  <TableCell className="border-r border-primary/15 px-4 py-5 text-center align-top"><TruncatedText as="p" value={selectedRevisionNotes.leader} maxLines={3} className="text-sm leading-5 text-muted-foreground" /></TableCell>
                  <TableCell className="border-r border-primary/15 px-4 py-5 text-center align-top"><TruncatedText as="p" value={selectedRevisionNotes.council} maxLines={3} className="text-sm leading-5 text-muted-foreground" /></TableCell>
                  <TableCell className="px-4 py-5 text-center align-top"><TruncatedText as="p" value={selectedRevisionNotes.committee} maxLines={3} className="text-sm leading-5 text-muted-foreground" /></TableCell>
                  </TableRow>
                  {historyExpanded && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={8} className="px-4 py-3">
                      <CriterionHistoryPanel
                        resultId={result?.id}
                        currentPoint={item.proposedScore}
                        currentBonusPoint={item.proposedBonusScore}
                        currentExplanation={item.explanation || null}
                      />
                    </TableCell>
                  </TableRow>
                  )}
                  </Fragment>
                );
              })}
              {displayGroup.items.length === 0 && <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border xl:hidden">
          {displayGroup.items.map((item) => {
            const result = resultByCriteriaId.get(item.id);
            const historyExpanded = expandedCriterionHistoryId === item.id;
            return (
            <article key={item.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary">{item.code}</p>
                  <h3 className="mt-1 font-semibold leading-5 text-foreground">{item.title}</h3>
                </div>
                {item.isAddedBySpecialist && <Badge className="bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Minh chứng</h4>
                    <div className="mt-2">
                      <EvidenceButton
                        files={item.evidenceFiles}
                        onClick={() => {
                          setSelectedCriterionId(item.id);
                          setViewingEvidenceItem(item);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Nội dung diễn giải</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.explanation || '—'}</p>
                  </div>
                  {(selectedRevisionNotes.leader || selectedRevisionNotes.council || selectedRevisionNotes.committee) && (
                    <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                      {selectedRevisionNotes.leader && <div className="p-3"><dt className="text-xs font-medium text-muted-foreground">Nội dung chỉnh sửa Lãnh đạo</dt><dd className="mt-1 text-sm leading-5 text-foreground">{selectedRevisionNotes.leader}</dd></div>}
                      {selectedRevisionNotes.council && <div className="p-3"><dt className="text-xs font-medium text-muted-foreground">Nội dung chỉnh sửa Hội đồng</dt><dd className="mt-1 text-sm leading-5 text-foreground">{selectedRevisionNotes.council}</dd></div>}
                      {selectedRevisionNotes.committee && <div className="p-3"><dt className="text-xs font-medium text-muted-foreground">Nội dung chỉnh sửa Ủy ban</dt><dd className="mt-1 text-sm leading-5 text-foreground">{selectedRevisionNotes.committee}</dd></div>}
                    </dl>
                  )}
                </div>
                <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Địa phương đề xuất</h4>
                    <div className="mt-2"><ProposedScoreSummary item={item} /></div>
                  </div>
                  {!item.isAddedBySpecialist && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-xs font-semibold text-foreground">Chuyên viên chấm</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <SpecialistScoreInput
                        label="Điểm"
                        value={item.officialScore}
                        maximum={item.maxProposedScore}
                        disabled
                        onFocus={() => setSelectedCriterionId(item.id)}
                        onChange={(value) => updateCriterion(item.id, { officialScore: value })}
                      />
                      <SpecialistScoreInput
                        label="Điểm thưởng"
                        value={item.officialBonusScore}
                        maximum={item.maxProposedBonusScore}
                        disabled
                        onFocus={() => setSelectedCriterionId(item.id)}
                        onChange={(value) => updateCriterion(item.id, { officialBonusScore: value })}
                      />
                    </div>
                  </div>
                  )}
                </div>
              </div>
              {result && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      aria-expanded={historyExpanded}
                      onClick={() => setExpandedCriterionHistoryId(historyExpanded ? null : item.id)}
                    >
                      {historyExpanded ? <ChevronDown className="size-4" /> : <History className="size-4" />}
                      {historyExpanded ? 'Ẩn lịch sử tiêu chí' : 'Xem lịch sử tiêu chí'}
                    </Button>
                    {result.officialReason !== null && <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setScoreRevisionResult(result)}><Eye className="size-4" />Xem điểm đã sửa</Button>}
                  </div>
                  {historyExpanded && (
                    <div className="mt-3">
                      <CriterionHistoryPanel
                        resultId={result.id}
                        currentPoint={item.proposedScore}
                        currentBonusPoint={item.proposedBonusScore}
                        currentExplanation={item.explanation || null}
                      />
                    </div>
                  )}
                </div>
              )}
            </article>
            );
          })}
          {displayGroup.items.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Nhóm này chưa có tiêu chí con.</p>}
        </div>
      </div>

      {selectedSubmission && (
        <RevisionHistorySection
          submissionId={selectedSubmission.id}
          results={(selectedSubmissionDetailQuery.data?.results ?? []).map((result) => ({
            id: result.id,
            criteriaId: result.criteriaId,
            criteriaContent: result.criteriaContent,
            point: result.point,
            bonusPoint: result.bonusPoint,
            explanation: result.explanation,
          }))}
        />
      )}

      <SupplementaryDialog
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={async ({ name, reason, file }) => {
          if (specialistActionsLocked) {
            toast.info(specialistLockReason);
            return false;
          }
          const submission = submissionByGroup.get(selectedGroup.id);
          if (!submission) {
            toast.error('Nhóm này chưa có hồ sơ để bổ sung tiêu chí.');
            return false;
          }

          try {
            const response = await specialistApi.addSupplementaryCriteria({
              submissionId: submission.id,
              content: name.trim(),
              note: reason.trim(),
            });
            if (file) {
              await filesApi.upload(file, {
                displayName: file.name,
                entityType: 'SubmissionResult',
                entityId: response.submissionResultId,
                category: 'supplementary',
              });
            }
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['specialist-submissions'] }),
              queryClient.invalidateQueries({ queryKey: ['specialist-submission-detail'] }),
              queryClient.invalidateQueries({ queryKey: ['specialist-group-detail'] }),
            ]);
            toast.success('Đã thêm tiêu chí bổ sung. Hồ sơ đã chuyển về địa phương để bổ sung.');
            return true;
          } catch (error) {
            toast.error('Không thể thêm tiêu chí bổ sung.', { description: getFilesApiError(error) });
            return false;
          }
        }}
      />
      <CriterionDetailDialog
        item={selectedCriterion}
        open={criterionDetailOpen}
        onOpenChange={setCriterionDetailOpen}
        onViewEvidence={(item) => {
          setCriterionDetailOpen(false);
          setViewingEvidenceItem(item);
        }}
        onEdit={(item) => {
          if (specialistActionsLocked) {
            toast.info(specialistLockReason);
            return;
          }
          setCriterionDetailOpen(false);
          setSelectedCriterionId(item.id);
          setScoreEditOpen(true);
        }}
        editDisabled={specialistActionsLocked}
        editDisabledReason={specialistLockReason}
      />
      <ScoreEditDialog
        item={selectedCriterion}
        open={scoreEditOpen}
        onOpenChange={setScoreEditOpen}
        initialAttachment={selectedCriterion ? pendingScoreAttachments.get(selectedCriterion.id) ?? null : null}
        onSave={(values, attachment, attachmentChanged) => {
          if (!selectedCriterion) return;
          if (specialistActionsLocked) {
            toast.info(specialistLockReason);
            return;
          }
          if (attachmentChanged) {
            setPendingScoreAttachments((current) => {
              const next = new Map(current);
              if (attachment) next.set(selectedCriterion.id, attachment);
              else next.delete(selectedCriterion.id);
              return next;
            });
          }
          updateCriterion(selectedCriterion.id, {
            officialScore: values.score,
            officialBonusScore: values.bonusScore,
            scoreReason: values.reason.trim(),
          });
          toast.success('Đã cập nhật điểm chấm. Nhấn “Lưu nháp” để lưu vào hồ sơ.');
        }}
      />
      <OfficialScoreRevisionDialog
        open={Boolean(scoreRevisionResult)}
        onOpenChange={(open) => { if (!open) setScoreRevisionResult(null); }}
        result={scoreRevisionResult}
        criterionLabel={scoreRevisionCriterionLabel}
      />
      <FilePreviewDialog file={forwardingPreviewFile} onOpenChange={(open) => { if (!open) setForwardingPreviewFile(null); }} />
      <RevisionDialog
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        localityName={district.localityName}
        criterionLabel={selectedCriterion ? `${selectedCriterion.code} · ${selectedCriterion.title}` : undefined}
        onSubmit={async (reason, file) => {
          if (specialistActionsLocked) {
            toast.info(specialistLockReason);
            return false;
          }
          const submission = submissionByGroup.get(selectedGroup.id);
          if (!submission) {
            toast.error('Nhóm này chưa có hồ sơ để yêu cầu chỉnh sửa.');
            return false;
          }
          try {
            if (file) {
              await filesApi.upload(file, { entityType: 'Submission', entityId: submission.id, category: 'revision-attachment' });
            }
            const targetedReason = selectedCriterion
              ? `[${selectedCriterion.code}] ${selectedCriterion.title}\n\n${reason}`
              : reason;
            await specialistApi.requestRevision({ submissionId: submission.id, reason: targetedReason });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['specialist-submissions'] }),
              queryClient.invalidateQueries({ queryKey: ['specialist-submission-detail'] }),
            ]);
            toast.success('Đã gửi yêu cầu chỉnh sửa đến địa phương.');
            return true;
          } catch (error) {
            toast.error('Không thể gửi yêu cầu chỉnh sửa.', { description: getFilesApiError(error) });
            return false;
          }
        }}
      />
      <ForwardSubmissionDialog
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        localityName={district.localityName}
        groupName={selectedGroup.groupName}
        onConfirm={confirmForward}
      />
      <EvidenceFilesDialog
        item={viewingEvidenceItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setViewingEvidenceItem(null);
        }}
      />
    </div>
  );
}
