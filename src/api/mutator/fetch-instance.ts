import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import baseConfig from '../../configs/base'

const fetchAxiosInstance = axios.create({
    baseURL: baseConfig.backendDomain,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})
fetchAxiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'))
      }
    }

    return Promise.reject(error)
  }
);
export function fetchInstance(config: AxiosRequestConfig) {
    return fetchAxiosInstance(config)
}
