import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import baseConfig from "../../configs/base";

const mainAxiosInstance = axios.create({
  baseURL: baseConfig.backendDomain,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
mainAxiosInstance.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().token;
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});
mainAxiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
    }

    return Promise.reject(error);
  },
);
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
    .then((response) => response.data);
}
