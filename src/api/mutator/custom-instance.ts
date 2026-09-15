import axios, { type AxiosRequestConfig } from "axios";
import baseConfig from "../../configs/base";
import { installAuthInterceptors } from "./auth-interceptors";
import { invalidateApiQueries } from "./query-client";

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

const mainAxiosInstance = axios.create({
  baseURL: baseConfig.backendDomain,
  withCredentials: true,
});
installAuthInterceptors(mainAxiosInstance);
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
