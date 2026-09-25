import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export interface DepartmentApi {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  criteriaGroupCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface DepartmentMemberApi {
  id: string;
  fullName: string | null;
  email: string;
  roles: string[];
}

export interface DepartmentPayload {
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

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const departmentsApi = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<DepartmentApi>>({ url: '/api/v1/departments', method: 'GET', params }),
  listAll: () => request<DepartmentApi[]>({ url: '/api/v1/departments/all', method: 'GET' }),
  get: (id: string) => request<DepartmentApi>({ url: `/api/v1/departments/${id}`, method: 'GET' }),
  create: (payload: DepartmentPayload) => request<DepartmentApi>({ url: '/api/v1/departments', method: 'POST', data: payload }),
  update: (id: string, payload: DepartmentPayload) => request<DepartmentApi>({ url: `/api/v1/departments/${id}`, method: 'PUT', data: payload }),
  remove: (id: string) => request<{ deleted: true; id: string }>({ url: `/api/v1/departments/${id}`, method: 'DELETE' }),
  listMembers: (id: string) => request<DepartmentMemberApi[]>({ url: `/api/v1/departments/${id}/members`, method: 'GET' }),
  removeMember: (id: string, userId: string) =>
    request<{ removed: true; id: string; userId: string }>({ url: `/api/v1/departments/${id}/members/${userId}`, method: 'DELETE' }),
};

export function getDepartmentApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
