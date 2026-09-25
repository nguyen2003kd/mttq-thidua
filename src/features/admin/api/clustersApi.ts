import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export interface ClusterWardApi {
  wardCode: string;
  wardName: string | null;
  wardFullName: string | null;
  assignedAt: string;
}

export interface ClusterApi {
  id: string;
  name: string;
  description: string | null;
  wardCount: number;
  wards: ClusterWardApi[];
  createdAt: string;
  updatedAt: string | null;
}

export interface AvailableWardApi {
  code: string;
  name: string | null;
  fullName: string | null;
}

export interface ClusterPayload {
  name: string;
  description?: string | null;
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

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const clustersApi = {
  list: () => request<ClusterApi[]>({ url: '/api/v1/clusters', method: 'GET' }),
  get: (id: string) => request<ClusterApi>({ url: `/api/v1/clusters/${id}`, method: 'GET' }),
  create: (payload: ClusterPayload) => request<ClusterApi>({ url: '/api/v1/clusters', method: 'POST', data: payload }),
  update: (id: string, payload: ClusterPayload) =>
    request<ClusterApi>({ url: `/api/v1/clusters/${id}`, method: 'PUT', data: payload }),
  remove: (id: string) => request<{ deleted: true; id: string }>({ url: `/api/v1/clusters/${id}`, method: 'DELETE' }),
  availableWards: () => request<AvailableWardApi[]>({ url: '/api/v1/clusters/available-wards', method: 'GET' }),
  assignWard: (id: string, wardCode: string) =>
    request<ClusterApi>({ url: `/api/v1/clusters/${id}/wards`, method: 'POST', data: { wardCode } }),
  removeWard: (id: string, wardCode: string) =>
    request<{ removed: true; id: string; wardCode: string }>({ url: `/api/v1/clusters/${id}/wards/${wardCode}`, method: 'DELETE' }),
};

export function getClusterApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
