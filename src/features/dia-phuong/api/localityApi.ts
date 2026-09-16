import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';
import { criteriaGroupsApi, type CriteriaGroupApi, type CriteriaApi, type PagedResult } from '@/features/admin/api/criteriaGroupsApi';
import type { CriteriaItem, CriteriaTable, Evidence, ScoreEntry, ScoreRecord } from '@/types/domain';
import type { ScoreState } from '@/types/rbac';

// ── Response envelope (giống criteriaGroupsApi) ──────────────────────────────

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

export { criteriaGroupsApi, type CriteriaGroupApi, type CriteriaApi, type PagedResult };

// ── Submission types (Swagger chưa khai báo schema, tự định nghĩa) ────────────

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
  results: SubmissionResultItem[];
}

export interface ApprovalHistoryItem {
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

// ── File types ────────────────────────────────────────────────────────────────

export interface FileItem {
  id: string;
  path: string;
  name: string;
  mime: string;
  type: string;
  size: number | null;
  title: string | null;
  description: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const localityApi = {
  // Criteria groups — reuse từ criteriaGroupsApi
  listCriteriaGroups: (params?: { search?: string; status?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<CriteriaGroupApi>>({ url: '/api/v1/criteria-groups', method: 'GET', params }),
  getCriteriaGroup: (id: string) =>
    request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'GET' }),
  listCriteria: (groupId: string, params?: { search?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<CriteriaApi>>({ url: `/api/v1/criteria-groups/${groupId}/criteria`, method: 'GET', params }),

  // Submissions — bài nộp của địa phương
  listMySubmissions: (params?: { stage?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SubmissionApi>>({ url: '/api/v1/my-submissions', method: 'GET', params }),
  getSubmission: (id: string) =>
    request<SubmissionApi>({ url: `/api/v1/submissions/${id}`, method: 'GET' }),
  listSubmissionsByGroup: (groupId: string, params?: { stage?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<SubmissionApi>>({ url: `/api/v1/criteria-groups/${groupId}/submissions`, method: 'GET', params }),

  // Submit points — tự đánh giá (cập nhật submission đã tồn tại; isDraft=true giữ trạng thái Draft)
  submitPoints: (payload: { submissionId: string; isDraft?: boolean; items: Array<{ submissionResultId: string; point: number; bonusPoint?: number; explanation?: string | null }> }) =>
    request<{ applied: true }>({ url: '/api/v1/submissions/submit-points', method: 'POST', data: payload }),

  // Create submission — nộp kết quả lần đầu (isDraft=true tạo bản nháp CurrentStage=Draft)
  createSubmission: (payload: { criteriaGroupId: string; isDraft?: boolean; items: Array<{ criteriaId: string; point: number; bonusPoint?: number; explanation?: string | null }> }) =>
    request<SubmissionApi>({ url: '/api/v1/submissions', method: 'POST', data: payload }),

  // Finalize — nộp hồ sơ lên chuyên viên
  finalizeSubmission: (submissionId: string) =>
    request<{ submissionId: string }>({ url: '/api/v1/submissions/finalize', method: 'POST', data: { submissionId } }),

  // Approval histories — lịch sử duyệt
  listApprovalHistories: (submissionId: string, params?: { action?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<ApprovalHistoryItem>>({ url: `/api/v1/submissions/${submissionId}/approval-histories`, method: 'GET', params }),

  // Submission result histories — lịch sử kết quả
  listResultHistories: (resultId: string, params?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<PagedResult<ApprovalHistoryItem>>({ url: `/api/v1/submission-results/${resultId}/histories`, method: 'GET', params }),

  // Files — bằng chứng
  uploadFile: (payload: { file: File; displayName?: string; title?: string; description?: string; note?: string; category?: string; entityType?: string; entityId?: string; visibility?: string }) => {
    const formData = new FormData();
    formData.append('File', payload.file);
    if (payload.displayName) formData.append('DisplayName', payload.displayName);
    if (payload.title) formData.append('Title', payload.title);
    if (payload.description) formData.append('Description', payload.description);
    if (payload.note) formData.append('Note', payload.note);
    if (payload.category) formData.append('Category', payload.category);
    if (payload.entityType) formData.append('EntityType', payload.entityType);
    if (payload.entityId) formData.append('EntityId', payload.entityId);
    if (payload.visibility) formData.append('Visibility', payload.visibility);
    return request<FileItem>({ url: '/api/v1/files/upload', method: 'POST', data: formData });
  },
  listFiles: (params?: { search?: string; category?: string; entityType?: string; entityId?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    request<{ count: number; rows: FileItem[]; page: number; pageSize: number }>({ url: '/api/v1/files', method: 'GET', params }),
  deleteFile: (id: string) =>
    request<{ id: string }>({ url: `/api/v1/files/${id}`, method: 'DELETE' }),
};

export function getLocalityApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}

// ── Mappers: API → UI types ──────────────────────────────────────────────────

const STAGE_TO_STATE: Record<SubmissionStage, ScoreState> = {
  Draft: 'DRAFT',
  LocalSubmitted: 'CHO_CHUYEN_VIEN',
  SpecialistApproved: 'CHO_DUYET_BAN',
  LeaderApproved: 'CHO_DUYET_HOI_DONG',
  CouncilApproved: 'CHO_DUYET_BTT',
  CommitteeFinalized: 'DA_CONG_BO',
  RequiresRevision: 'DRAFT',
};

export function mapCriteriaGroupToTable(group: CriteriaGroupApi, targetSubmissionId?: string): CriteriaTable {
  return {
    id: group.id,
    name: group.name,
    totalScore: group.maxPoint,
    content: group.content ?? undefined,
    status: group.status === 'Applied' ? 'ACTIVE' : group.status === 'Closed' ? 'EXPIRED' : 'DRAFT',
    criteria: (group.criteria ?? [])
      // Tiêu chí bổ sung chỉ áp dụng cho submission được chỉ định (TargetSubmissionId)
      .filter((c) => c.type !== 'Supplementary' || c.targetSubmissionId === targetSubmissionId)
      .map((c, idx): CriteriaItem => ({
      id: c.id,
      type: c.type,
      name: c.content,
      maxScore: c.maxPoint,
      bonusScore: c.maxBonusPoint || undefined,
      deadline: c.deadline ?? undefined,
      note: c.note ?? undefined,
      order: idx + 1,
      updatedAt: c.updatedAt ?? undefined,
    })),
    assignedLocalityCount: 0,
    openDate: group.createdAt,
    closeDate: group.deadline ?? '',
    updatedAt: group.updatedAt ?? undefined,
  };
}

export function mapSubmissionToRecord(submission: SubmissionApi): ScoreRecord {
  const state = STAGE_TO_STATE[submission.currentStage] ?? 'DRAFT';
  return {
    state,
    entries: (submission.results ?? []).map((r): ScoreEntry => ({
      id: r.id,
      criteriaId: r.criteriaId,
      criteriaName: r.criteriaContent ?? '',
      value: r.point ?? 0,
      state,
      scoredBy: '',
      scoredAt: submission.submittedAt ?? '',
      evidenceCount: 0,
      proposedScore: r.point ?? undefined,
      proposedBonusScore: r.bonusPoint ?? undefined,
      explanation: r.explanation ?? undefined,
    })),
    totalScore: submission.totalProposedPoint,
    submittedAt: submission.submittedAt,
    publishedAt: submission.currentStage === 'CommitteeFinalized' ? submission.updatedAt : null,
    revisionRequestedAt: submission.currentStage === 'RequiresRevision' ? submission.updatedAt : null,
  };
}

export function mapFileToEvidence(file: FileItem, criteriaId: string, localityId: string): Evidence {
  return {
    id: file.id,
    criteriaId,
    localityId,
    fileName: file.name,
    fileUrl: file.path,
    uploadedAt: file.createdAt,
    fileSize: file.size ?? undefined,
    description: file.description ?? undefined,
  };
}
