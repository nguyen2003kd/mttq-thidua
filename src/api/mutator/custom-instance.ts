import axios, { type AxiosRequestConfig } from "axios";
import baseConfig from "../../configs/base";
import { installAuthInterceptors } from "./auth-interceptors";
import { invalidateApiQueries } from "./query-client";

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

const mainAxiosInstance = axios.create({
  baseURL: baseConfig.backendDomain,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
installAuthInterceptors(mainAxiosInstance);
export function mainInstance<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  return mainAxiosInstance
    .request<T>({
      ...config,
      ...options,
      headers: {
        ...config.headers,
        ...options?.headers,
      },
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
