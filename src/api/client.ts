import axios from 'axios';
import { installAuthInterceptors } from '@/api/mutator/auth-interceptors';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

installAuthInterceptors(apiClient);
