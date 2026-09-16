import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export type CriteriaGroupStatusApi = 'Draft' | 'Applied' | 'Closed';

export type CriteriaStatusApi = 'Draft' | 'Applied';

export interface CriteriaApi {
  id: string;
  criteriaGroupId: string | null;
  type: 'Standard' | 'Supplementary' | string;
  targetSubmissionId: string | null;
  content: string;
  maxPoint: number;
  maxBonusPoint: number;
  deadline: string | null;
  note: string | null;
  status: CriteriaStatusApi;
  createdAt: string;
  updatedAt: string | null;
}

export interface CriteriaGroupFileApi {
  id: string;
  originalName: string;
  displayName: string | null;
  title: string | null;
  description: string | null;
  note: string | null;
  mimeType: string;
  extension: string | null;
  category: string | null;
  entityType: string | null;
  entityId: string | null;
  sizeBytes: number;
  visibility: string;
  status: string;
  url: string | null;
  createdAt: string;
}

export interface CriteriaGroupApi {
  id: string;
  name: string;
  content: string | null;
  maxPoint: number;
  deadline: string | null;
  status: CriteriaGroupStatusApi;
  createdAt: string;
  updatedAt: string | null;
  criteria: CriteriaApi[];
  files: CriteriaGroupFileApi[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiErrorMessage {
  vi?: string;
  en?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: ApiErrorMessage }>;
}

export interface CriteriaGroupPayload {
  name: string;
  content?: string;
  maxPoint: number;
  deadline?: string | null;
}

export interface CriteriaPayload {
  type: 'Standard';
  content: string;
  maxPoint: number;
  maxBonusPoint: number;
  deadline?: string | null;
  note?: string;
}

export type SortOrder = 'asc' | 'desc';
export type CriteriaGroupSortBy = 'createdAt' | 'name' | 'deadline' | 'maxPoint';
export type CriteriaSortBy = 'createdAt' | 'content' | 'maxPoint' | 'deadline';

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const criteriaGroupsApi = {
  list: (params?: {
    search?: string;
    status?: CriteriaGroupStatusApi;
    page?: number;
    pageSize?: number;
    sortBy?: CriteriaGroupSortBy;
    sortOrder?: SortOrder;
  }) =>
    request<PagedResult<CriteriaGroupApi>>({ url: '/api/v1/criteria-groups', method: 'GET', params }),
  get: (id: string) => request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'GET' }),
  create: (payload: CriteriaGroupPayload) => request<CriteriaGroupApi>({ url: '/api/v1/criteria-groups', method: 'POST', data: payload }),
  update: (id: string, payload: CriteriaGroupPayload) => request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'PUT', data: payload }),
  apply: (criteriaGroupId: string) => request<{ applied: true; criteriaGroupIds: string[] }>({ url: '/api/v1/criteria-groups/apply', method: 'POST', data: { criteriaGroupIds: [criteriaGroupId] } }),
  listCriteria: (groupId: string, params?: {
    search?: string;
    type?: CriteriaApi['type'];
    page?: number;
    pageSize?: number;
    sortBy?: CriteriaSortBy;
    sortOrder?: SortOrder;
  }) =>
    request<PagedResult<CriteriaApi>>({ url: `/api/v1/criteria-groups/${groupId}/criteria`, method: 'GET', params }),
  createBulk: (criteriaGroupId: string, items: CriteriaPayload[]) =>
    request<CriteriaApi[]>({ url: '/api/v1/criteria/bulk', method: 'POST', data: { criteriaGroupId, items } }),
  updateCriteria: (id: string, payload: Omit<CriteriaPayload, 'type'> & { changeReason?: string }) =>
    request<CriteriaApi>({ url: `/api/v1/criteria/${id}`, method: 'PUT', data: payload }),
  bulkUpdateStatus: (criteriaIds: string[], status: CriteriaStatusApi) =>
    request<CriteriaApi[]>({ url: '/api/v1/criteria/bulk', method: 'PUT', data: { criteriaIds, status } }),
};

export function getCriteriaApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
