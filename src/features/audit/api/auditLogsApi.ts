import { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: { vi?: string; en?: string } }>;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  actor: string;
  module: string;
  action: string;
  entityName: string | null;
  entityId: string | null;
  httpMethod: string | null;
  requestPath: string | null;
  statusCode: number | null;
  traceId: string | null;
  userAgent: string | null;
  beforeData: string | null;
  afterData: string | null;
  changedData: string | null;
  durationMs: number | null;
  success: boolean;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogQuery {
  from?: string;
  to?: string;
  module?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  httpMethod?: string;
  traceId?: string;
  search?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export const auditLogsApi = {
  list: (query: AuditLogQuery) =>
    request<AuditLogPage>({
      url: '/api/v1/audit-logs',
      method: 'GET',
      params: query,
    }),
};

export default auditLogsApi;
