import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export type CriteriaGroupStatusApi = 'Draft' | 'Applied' | 'Closed';

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
  createdAt: string;
  updatedAt: string | null;
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

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const criteriaGroupsApi = {
  list: (params?: { search?: string; status?: CriteriaGroupStatusApi; page?: number; pageSize?: number }) =>
    request<PagedResult<CriteriaGroupApi>>({ url: '/api/v1/criteria-groups', method: 'GET', params }),
  get: (id: string) => request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'GET' }),
  create: (payload: CriteriaGroupPayload) => request<CriteriaGroupApi>({ url: '/api/v1/criteria-groups', method: 'POST', data: payload }),
  update: (id: string, payload: CriteriaGroupPayload) => request<CriteriaGroupApi>({ url: `/api/v1/criteria-groups/${id}`, method: 'PUT', data: payload }),
  apply: (criteriaGroupId: string) => request<{ applied: true; criteriaGroupId: string }>({ url: '/api/v1/criteria-groups/apply', method: 'POST', data: { criteriaGroupId } }),
  listCriteria: (groupId: string, params?: { search?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<CriteriaApi>>({ url: `/api/v1/criteria-groups/${groupId}/criteria`, method: 'GET', params }),
  createBulk: (criteriaGroupId: string, items: CriteriaPayload[]) =>
    request<CriteriaApi[]>({ url: '/api/v1/criteria/bulk', method: 'POST', data: { criteriaGroupId, items } }),
  updateCriteria: (id: string, payload: Omit<CriteriaPayload, 'type'> & { changeReason?: string }) =>
    request<CriteriaApi>({ url: `/api/v1/criteria/${id}`, method: 'PUT', data: payload }),
};

export function getCriteriaApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
