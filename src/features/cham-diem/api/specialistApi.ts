import { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';
import { type CriteriaGroupApi, type CriteriaStatusApi, type PagedResult } from '@/features/admin/api/criteriaGroupsApi';

// ── Response envelope ────────────────────────────────────────────────────────

interface ApiErrorMessage {
  vi?: string;
  en?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: ApiErrorMessage }>;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

// ── Submission types ─────────────────────────────────────────────────────────

export type SubmissionStage =
  | 'Draft'
  | 'LocalSubmitted'
  | 'ScorerSubmitted'
  | 'ReviewerApproved'
  | 'SpecialistApproved'
  | 'LeaderApproved'
  | 'CouncilApproved'
  | 'CommitteeFinalized'
  | 'RequiresRevision'
  | 'ScorerRevisionRequested'
  | 'ReviewerRevisionRequested';

/** Các stage này xác nhận hồ sơ đã rời bước xử lý của Chuyên viên. */
export const SPECIALIST_FORWARDED_STAGES = [
  'SpecialistApproved',
  'LeaderApproved',
  'CouncilApproved',
  'CommitteeFinalized',
] as const satisfies readonly SubmissionStage[];

export type ScoringRole = 'SCORER' | 'REVIEWER' | 'SPECIALIST';

/**
 * Stage mà mỗi role được thao tác (chấm/duyệt/trả về) — phải khớp ma trận
 * role × stage ở backend (ApprovalService.ResolveApproveTarget).
 */
const ACTIONABLE_STAGES: Record<ScoringRole, readonly SubmissionStage[]> = {
  SCORER: ['LocalSubmitted', 'ScorerRevisionRequested'],
  REVIEWER: ['ScorerSubmitted', 'ReviewerRevisionRequested'],
  SPECIALIST: ['ReviewerApproved'],
};

const FORWARD_LABELS: Record<ScoringRole, string> = {
  SCORER: 'Gửi Lãnh đạo ban',
  REVIEWER: 'Gửi Chuyên viên trưởng',
  SPECIALIST: 'Duyệt hồ sơ',
};

const LOCK_REASONS: Record<ScoringRole, string> = {
  SCORER: 'Hồ sơ đã được gửi lên Lãnh đạo ban hoặc đang chờ cấp trên xử lý. Chuyên viên cấp 2 chỉ có thể xem thông tin.',
  REVIEWER: 'Hồ sơ không ở bước thẩm định của bạn. Lãnh đạo ban chỉ có thể xem thông tin.',
  SPECIALIST: 'Hồ sơ chưa đến bước xử lý của Chuyên viên trưởng hoặc đã được duyệt. Chuyên viên trưởng chỉ có thể xem thông tin.',
};

/**
 * Quyền thao tác trên một hồ sơ theo role chấm điểm. Dùng chung cho mọi nút
 * chấm, lưu nháp và chuyển duyệt để UI không bị lệch điều kiện khóa/mở.
 * Mặc định SPECIALIST để tương thích các chỗ gọi cũ.
 */
export function getSpecialistSubmissionPermissions(stage: SubmissionStage | null | undefined, role: ScoringRole = 'SPECIALIST') {
  const isActionable = Boolean(stage && ACTIONABLE_STAGES[role].includes(stage));
  return {
    /** Được nhập/sửa điểm — reviewer chỉ duyệt, không chấm. */
    canEdit: isActionable && role !== 'REVIEWER',
    /** Được duyệt/gửi hồ sơ lên cấp tiếp theo tại stage hiện tại. */
    canApprove: isActionable,
    /** Được yêu cầu chỉnh sửa ở bước liền trước trong luồng. */
    canRequestRevision: isActionable,
    /** Được thêm tiêu chí bổ sung — reviewer không chấm điểm nhưng vẫn được bổ sung. */
    canAddSupplementary: isActionable,
    usesForwardingDialog: role !== 'SPECIALIST',
    isForwarded: !isActionable,
    disabledReason: LOCK_REASONS[role],
    forwardLabel: FORWARD_LABELS[role],
  };
}

export interface SubmissionResultFile {
  id: string;
  originalName: string;
  displayName: string | null;
  category: string | null;
  sizeBytes: number;
  createdAt: string;
  url: string | null;
}

export interface SubmissionResultItem {
  id: string;
  submissionId: string;
  criteriaId: string;
  criteriaContent: string | null;
  criteriaStatus?: CriteriaStatusApi | null;
  snapshotMaxPoint: number;
  snapshotMaxBonusPoint: number;
  point: number;
  bonusPoint: number;
  officialPoint: number | null;
  officialBonusPoint: number | null;
  officialReason: string | null;
  explanation: string | null;
  reviewStatus: string;
  files: SubmissionResultFile[];
  createdAt: string;
  updatedAt: string | null;
}

export interface SubmissionApi {
  id: string;
  criteriaGroupId: string;
  criteriaGroupName: string | null;
  currentStage: SubmissionStage;
  totalProposedPoint: number;
  totalFinalPoint: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  createdByUsername: string | null;
  createdByWardCode: string | null;
  localityFullName: string | null;
  /** false = phường/xã chưa nộp bài (row tổng hợp từ BE khi includeUnsubmitted=true) */
  hasSubmission: boolean;
  results: SubmissionResultItem[];
}

/** Submission thật — row tổng hợp (hasSubmission=false) có id/criteriaGroupId/createdAt = null. */
export function isRealSubmission(s: SubmissionApi): boolean {
  return s.hasSubmission !== false;
}

export interface ApprovalHistoryApi {
  id: string;
  submissionId: string;
  actorName: string;
  actorRole: string;
  fromStage: string | null;
  toStage: string | null;
  userId: string;
  stageLevel: string;
  action: string;
  reason: string | null;
  files: SubmissionResultFile[];
  createdAt: string;
}

export interface SpecialistScoreChangeApi {
  submissionResultId: string;
  criteriaId: string;
  criteriaContent: string | null;
  oldPoint: number | null;
  newPoint: number | null;
  oldBonusPoint: number | null;
  newBonusPoint: number | null;
}

export interface SpecialistScoreHistoryApi {
  id: string;
  submissionId: string;
  userId: string;
  actorName: string;
  actorRole: string;
  wardCode: string | null;
  localityName: string | null;
  criteriaGroupId: string | null;
  criteriaGroupName: string | null;
  action: string;
  reason: string | null;
  changes: SpecialistScoreChangeApi[];
  createdAt: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const specialistApi = {
  // Criteria groups
  listCriteriaGroups: (params?: { search?: string; status?: string; periodId?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<CriteriaGroupApi>>({ url: '/api/v1/criteria-groups', method: 'GET', params }),
  getCriteriaGroup: (id: string) =>
    request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'GET' }),

  // Submissions — chuyên viên xem tất cả bài nộp
  listAllSubmissions: (params?: { stage?: string; includeUnsubmitted?: boolean; departmentId?: string; periodId?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SubmissionApi>>({ url: '/api/v1/submissions', method: 'GET', params }),

  // Submissions by criteria group — chuyên viên xem tất cả bài nộp của địa phương
  listSubmissionsByGroup: (groupId: string, params?: { stage?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SubmissionApi>>({ url: `/api/v1/criteria-groups/${groupId}/submissions`, method: 'GET', params }),
  getSubmission: (id: string) =>
    request<SubmissionApi>({ url: `/api/v1/submissions/${id}`, method: 'GET' }),
  listApprovalHistories: (submissionId: string, params?: { action?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<ApprovalHistoryApi>>({ url: `/api/v1/submissions/${submissionId}/approval-histories`, method: 'GET', params }),
  listScoreHistories: (params?: { search?: string; wardCode?: string; from?: string; to?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SpecialistScoreHistoryApi>>({ url: '/api/v1/submissions/score-histories', method: 'GET', params }),

  // Approvals — duyệt hồ sơ theo stage và vai trò hiện tại
  approveSubmission: (submissionId: string, reason?: string) =>
    request<{ processed: boolean; submissionId: string; action: string }>({
      url: '/api/v1/submissions/approve',
      method: 'POST',
      data: { submissionId, action: 'Approve', reason: reason || null },
    }),

  /** Chuyển hồ sơ kèm diễn giải và tệp. Tệp được gắn vào đúng lần chuyển (ApprovalHistory). */
  forwardSubmission: (submissionId: string, explanation: string, files: File[], onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('submissionId', submissionId);
    if (explanation) form.append('explanation', explanation);
    files.forEach((file) => form.append('files', file));
    return request<ApprovalHistoryApi>({
      url: '/api/v1/submissions/forward',
      method: 'POST',
      data: form,
      onUploadProgress: (event) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },

  // UpdateScore — chuyên viên lưu nháp điểm chấm (giữ nguyên stage)
  updateScores: (payload: { submissionId: string; reason: string; scoreItems: Array<{ submissionResultId: string; point: number; bonusPoint: number; reason?: string | null }> }) =>
    request<{ processed: boolean; submissionId: string; action: string }>({
      url: '/api/v1/submissions/approve',
      method: 'POST',
      data: { ...payload, action: 'UpdateScore' },
    }),

  // Comment — cấp trên (Hội đồng / Ban thường trực) ghi nhận xét vào lịch sử, không đổi điểm hay stage
  comment: (payload: { submissionId: string; reason: string }) =>
    request<{ processed: boolean; submissionId: string; action: string }>({
      url: '/api/v1/submissions/approve',
      method: 'POST',
      data: { submissionId: payload.submissionId, action: 'Comment', reason: payload.reason },
    }),

  // Supplementary criteria — chuyên viên bổ sung tiêu chí phát sinh (không có điểm, hồ sơ về RequiresRevision)
  addSupplementaryCriteria: (payload: { submissionId: string; content: string; deadline?: string | null; note: string }) =>
    request<{ added: boolean; submissionId: string; criteriaId: string; submissionResultId: string }>({
      url: '/api/v1/submissions/supplementary-criteria',
      method: 'POST',
      data: payload,
    }),

  // RequestRevision — yêu cầu chỉnh sửa kèm tệp đính kèm (gắn vào ApprovalHistory của lần yêu cầu)
  requestRevision: (payload: { submissionId: string; reason: string; criteriaIds?: string[]; submissionResultIds?: string[]; file?: File | null }) => {
    const form = new FormData();
    form.append('submissionId', payload.submissionId);
    form.append('reason', payload.reason);
    (payload.criteriaIds ?? []).forEach((id) => form.append('criteriaIds', id));
    (payload.submissionResultIds ?? []).forEach((id) => form.append('submissionResultIds', id));
    if (payload.file) form.append('files', payload.file);
    return request<ApprovalHistoryApi>({
      url: '/api/v1/submissions/request-revision',
      method: 'POST',
      data: form,
    });
  },

  // Ban Thường trực công bố kết quả cuối cùng của hồ sơ đã qua Hội đồng.
  finalizeSubmission: (submissionId: string) =>
    request<{ finalized: boolean; submissionId: string }>({
      url: '/api/v1/submissions/finalize',
      method: 'POST',
      data: { submissionId },
    }),
};
