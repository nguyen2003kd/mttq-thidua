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

export interface SubmissionResultItem {
  id: string;
  submissionId: string;
  criteriaId: string;
  criteriaContent: string | null;
  snapshotMaxPoint: number;
  snapshotMaxBonusPoint: number;
  point: number;
  bonusPoint: number;
  explanation: string | null;
  reviewStatus: string;
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
};
