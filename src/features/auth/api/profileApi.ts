import type { AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

/** Profile người dùng — GET/PUT /api/v1/auth/profile (xem docs Account Representative API). */
export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  /** Họ tên người đại diện — tên hiển thị chính trong hệ thống. */
  fullName: string | null;
  phone: string | null;
  wardCode: string | null;
  avatarId: string | null;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface UpdateProfileRequest {
  /** Tối đa 200 ký tự, BE tự trim. Không gửi → giữ nguyên. */
  fullName?: string;
  /** Tối đa 20 ký tự, BE tự trim. Không gửi → giữ nguyên. */
  phone?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: { vi?: string | null; en?: string | null } | null }> | null;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

/** Thiếu fullName hoặc phone (kể cả chuỗi trắng) → bắt buộc bổ sung. */
export function profileNeedsCompletion(profile: Pick<UserProfile, 'fullName' | 'phone'>) {
  return !profile.fullName?.trim() || !profile.phone?.trim();
}

/** Tên hiển thị ưu tiên: fullName → firstName + lastName → username → email. */
export function profileDisplayName(profile: Pick<UserProfile, 'fullName' | 'firstName' | 'lastName' | 'username' | 'email'>) {
  const fullName = profile.fullName?.trim();
  if (fullName) return fullName;
  const joined = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  if (joined) return joined;
  return profile.username?.trim() || profile.email;
}

export const profileApi = {
  get: () => request<UserProfile>({ url: '/api/v1/auth/profile', method: 'GET' }),
  update: (body: UpdateProfileRequest) =>
    request<UserProfile>({ url: '/api/v1/auth/profile', method: 'PUT', data: body }),
};
