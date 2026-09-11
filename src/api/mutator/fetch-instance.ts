import axios, { type AxiosRequestConfig } from 'axios'
import baseConfig from '../../configs/base'
import { installAuthInterceptors } from './auth-interceptors'

const fetchAxiosInstance = axios.create({
    baseURL: baseConfig.backendDomain,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})
installAuthInterceptors(fetchAxiosInstance)
export function fetchInstance(config: AxiosRequestConfig) {
    return fetchAxiosInstance(config)
}
