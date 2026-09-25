import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export type PeriodStatusApi = 'Draft' | 'Active' | 'Closed';

export interface PeriodApi {
  id: string;
  startYear: number;
  endYear: number;
  name: string;
  status: PeriodStatusApi;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PeriodPayload {
  startYear: number;
  endYear: number;
  name?: string | null;
  status: PeriodStatusApi;
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

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const periodsApi = {
  list: (params?: { search?: string; status?: PeriodStatusApi; page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
    request<PagedResult<PeriodApi>>({ url: '/api/v1/periods', method: 'GET', params }),
  listAll: async () => {
    const page = await request<PagedResult<PeriodApi>>({ url: '/api/v1/periods', method: 'GET', params: { page: 1, pageSize: 100, sortBy: 'startYear', sortOrder: 'desc' } });
    return page.items;
  },
  get: (id: string) => request<PeriodApi>({ url: `/api/v1/periods/${id}`, method: 'GET' }),
  create: (payload: PeriodPayload) => request<PeriodApi>({ url: '/api/v1/periods', method: 'POST', data: payload }),
  update: (id: string, payload: PeriodPayload) =>
    request<PeriodApi>({ url: `/api/v1/periods/${id}`, method: 'PUT', data: payload }),
  remove: (id: string) => request<{ deleted: true; id: string }>({ url: `/api/v1/periods/${id}`, method: 'DELETE' }),
};

export function getPeriodApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
