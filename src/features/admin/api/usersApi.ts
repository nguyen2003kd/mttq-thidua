import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: { vi?: string; en?: string } }>;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export interface BatchResetPasswordResult {
  resetUserIds: string[];
  failedUserIds: string[];
}

export const usersApi = {
  // Đặt lại mật khẩu hàng loạt về mật khẩu mặc định trong cấu hình server.
  resetPasswords: (userIds: string[]) =>
    request<BatchResetPasswordResult>({ url: '/api/v1/users/reset-password', method: 'POST', data: { userIds } }),
};

export function getUserApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? []).find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
