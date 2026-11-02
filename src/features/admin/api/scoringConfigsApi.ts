import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export interface ScoringConfigLevelApi {
  id: string;
  code: string;
  name: string;
  minPoint: number;
  maxPoint: number;
  includeMin: boolean;
  includeMax: boolean;
  sortOrder: number;
  status: string;
}

export interface ScoringConfigApi {
  id: string;
  name: string;
  description: string | null;
  levels: ScoringConfigLevelApi[];
  usedByPeriodCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ScoringConfigLevelPayload {
  name: string;
  minPoint: number;
  maxPoint: number;
  includeMin: boolean;
  includeMax: boolean;
  sortOrder: number;
}

export interface ScoringConfigPayload {
  name: string;
  description?: string | null;
  levels: ScoringConfigLevelPayload[];
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

export const scoringConfigsApi = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<ScoringConfigApi>>({ url: '/api/v1/scoring-configs', method: 'GET', params }),
  listAll: async () => {
    const page = await request<PagedResult<ScoringConfigApi>>({ url: '/api/v1/scoring-configs', method: 'GET', params: { page: 1, pageSize: 100 } });
    return page.items;
  },
  get: (id: string) => request<ScoringConfigApi>({ url: `/api/v1/scoring-configs/${id}`, method: 'GET' }),
  create: (payload: ScoringConfigPayload) => request<ScoringConfigApi>({ url: '/api/v1/scoring-configs', method: 'POST', data: payload }),
  update: (id: string, payload: ScoringConfigPayload) =>
    request<ScoringConfigApi>({ url: `/api/v1/scoring-configs/${id}`, method: 'PUT', data: payload }),
  remove: (id: string) => request<{ deleted: true; id: string }>({ url: `/api/v1/scoring-configs/${id}`, method: 'DELETE' }),
};

export function getScoringConfigApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
