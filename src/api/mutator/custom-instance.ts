import axios, { type AxiosRequestConfig } from "axios";
import baseConfig from "../../configs/base";
import { installAuthInterceptors } from "./auth-interceptors";
import { invalidateApiQueries } from "./query-client";
import { beginActionProgress, completeActionProgress } from "@/lib/action-progress";

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

type ProgressRequestConfig = AxiosRequestConfig & { __actionProgressId?: string };

function getMutationProgressLabel(config: AxiosRequestConfig) {
  const method = config.method?.toLowerCase();
  const url = String(config.url ?? '');
  if (url.includes('/files/') || config.data instanceof FormData) return 'Đang tải tệp lên…';
  if (url.includes('/finalize')) return 'Đang gửi hồ sơ…';
  if (url.includes('/submit-points')) return 'Đang lưu điểm tự đánh giá…';
  if (url.includes('/approve')) return 'Đang gửi yêu cầu xét duyệt…';
  if (method === 'delete') return 'Đang xóa dữ liệu…';
  if (method === 'put' || method === 'patch') return 'Đang lưu thay đổi…';
  return 'Đang gửi dữ liệu…';
}

function completeProgressFor(config?: AxiosRequestConfig) {
  completeActionProgress((config as ProgressRequestConfig | undefined)?.__actionProgressId);
}

const mainAxiosInstance = axios.create({
  baseURL: baseConfig.backendDomain,
  withCredentials: true,
});
installAuthInterceptors(mainAxiosInstance);
mainAxiosInstance.interceptors.request.use((config) => {
  const progressConfig = config as ProgressRequestConfig;
  const method = config.method?.toLowerCase() ?? '';
  if (MUTATION_METHODS.has(method) && !progressConfig.__actionProgressId) {
    progressConfig.__actionProgressId = beginActionProgress(getMutationProgressLabel(config));
  }
  return config;
});
mainAxiosInstance.interceptors.response.use(
  (response) => {
    completeProgressFor(response.config);
    return response;
  },
  (error) => {
    completeProgressFor(error.config);
    return Promise.reject(error);
  },
);
export function mainInstance<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  // FormData: để axios tự sinh Content-Type multipart/form-data; boundary.
  // JSON: set application/json (trước đây là default của instance).
  const isFormData = config.data instanceof FormData || options?.data instanceof FormData;
  const mergedHeaders: Record<string, string> = {
    ...config.headers,
    ...options?.headers,
  } as Record<string, string>;
  if (!isFormData && !mergedHeaders['Content-Type'] && !mergedHeaders['content-type']) {
    mergedHeaders['Content-Type'] = 'application/json';
  }
  return mainAxiosInstance
    .request<T>({
      ...config,
      ...options,
      headers: mergedHeaders,
    })
    .then((response) => {
      // Most feature APIs call `mainInstance` directly instead of a generated
      // useMutation hook. Invalidate here so both styles refresh active
      // TanStack Query screens after a successful write.
      if (MUTATION_METHODS.has(response.config.method?.toLowerCase() ?? "")) {
        void invalidateApiQueries();
      }

      return response.data;
    });
}
