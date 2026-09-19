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

export interface SubmissionResultFile {
  id: string;
  originalName: string;
  displayName: string | null;
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
  results: SubmissionResultItem[];
}

export interface ApprovalHistoryApi {
  id: string;
  submissionId: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStage: string | null;
  toStage: string | null;
  reason: string | null;
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
  listAllSubmissions: (params?: { stage?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SubmissionApi>>({ url: '/api/v1/submissions', method: 'GET', params }),

  // Submissions by criteria group — chuyên viên xem tất cả bài nộp của địa phương
  listSubmissionsByGroup: (groupId: string, params?: { stage?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SubmissionApi>>({ url: `/api/v1/criteria-groups/${groupId}/submissions`, method: 'GET', params }),
  getSubmission: (id: string) =>
    request<SubmissionApi>({ url: `/api/v1/submissions/${id}`, method: 'GET' }),
  listApprovalHistories: (submissionId: string, params?: { action?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<ApprovalHistoryApi>>({ url: `/api/v1/submissions/${submissionId}/approval-histories`, method: 'GET', params }),

  // Approvals — chuyên viên chấm xong, chuyển hồ sơ lên Lãnh đạo ban
  approveSubmission: (submissionId: string, reason?: string) =>
    request<{ processed: boolean; submissionId: string; action: string }>({
      url: '/api/v1/submissions/approve',
      method: 'POST',
      data: { submissionId, action: 'Approve', reason: reason || null },
    }),

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
};
