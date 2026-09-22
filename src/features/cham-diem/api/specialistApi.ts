import { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';
import { type CriteriaGroupApi, type PagedResult } from '@/features/admin/api/criteriaGroupsApi';

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
  | 'SpecialistApproved'
  | 'LeaderApproved'
  | 'CouncilApproved'
  | 'CommitteeFinalized'
  | 'RequiresRevision';

/** Các stage này xác nhận hồ sơ đã rời bước xử lý của Chuyên viên. */
export const SPECIALIST_FORWARDED_STAGES = [
  'SpecialistApproved',
  'LeaderApproved',
  'CouncilApproved',
  'CommitteeFinalized',
] as const satisfies readonly SubmissionStage[];

/**
 * Quyền thao tác của Chuyên viên trên một hồ sơ. Dùng chung cho mọi nút chấm,
 * lưu nháp và chuyển duyệt để UI không bị lệch điều kiện khóa/mở.
 */
export function getSpecialistSubmissionPermissions(stage: SubmissionStage | null | undefined) {
  const isForwarded = Boolean(stage && SPECIALIST_FORWARDED_STAGES.includes(stage as typeof SPECIALIST_FORWARDED_STAGES[number]));
  return {
    canEdit: !isForwarded,
    isForwarded,
    disabledReason: 'Hồ sơ đã được chuyển lên cấp tiếp theo. Chuyên viên chỉ có thể xem thông tin.',
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
  id: string | null;
  criteriaGroupId: string | null;
  criteriaGroupName: string | null;
  currentStage: SubmissionStage;
  totalProposedPoint: number;
  totalFinalPoint: number;
  submittedAt: string | null;
  createdAt: string | null;
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
export type RealSubmissionApi = SubmissionApi & { id: string; criteriaGroupId: string; createdAt: string };

export function isRealSubmission(s: SubmissionApi): s is RealSubmissionApi {
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
  listCriteriaGroups: (params?: { search?: string; status?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<CriteriaGroupApi>>({ url: '/api/v1/criteria-groups', method: 'GET', params }),
  getCriteriaGroup: (id: string) =>
    request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'GET' }),

  // Submissions — chuyên viên xem tất cả bài nộp
  listAllSubmissions: (params?: { stage?: string; includeUnsubmitted?: boolean; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
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

  // Approvals — chuyên viên chấm xong, chuyển hồ sơ lên Lãnh đạo ban
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

  // Supplementary criteria — chuyên viên bổ sung tiêu chí phát sinh (không có điểm, hồ sơ về RequiresRevision)
  addSupplementaryCriteria: (payload: { submissionId: string; content: string; deadline?: string | null; note: string }) =>
    request<{ added: boolean; submissionId: string; criteriaId: string; submissionResultId: string }>({
      url: '/api/v1/submissions/supplementary-criteria',
      method: 'POST',
      data: payload,
    }),

  // RequestRevision — chuyên viên yêu cầu địa phương chỉnh sửa hồ sơ
  requestRevision: (payload: { submissionId: string; reason: string }) =>
    request<{ processed: boolean; submissionId: string; action: string }>({
      url: '/api/v1/submissions/approve',
      method: 'POST',
      data: { ...payload, action: 'RequestRevision' },
    }),

  // Ban Thường trực công bố kết quả cuối cùng của hồ sơ đã qua Hội đồng.
  finalizeSubmission: (submissionId: string) =>
    request<{ finalized: boolean; submissionId: string }>({
      url: '/api/v1/submissions/finalize',
      method: 'POST',
      data: { submissionId },
    }),
};
