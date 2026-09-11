import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';

export type FileEntityTypeApi =
  | 'CriteriaGroup'
  | 'Criteria'
  | 'SubmissionResult'
  | 'SubmissionHistory'
  | 'ApprovalHistory'
  | 'FinalDecision';

export type FileVisibilityApi = 'Private' | 'Public';

export interface FileItemApi {
  id: string;
  originalName: string;
  displayName: string | null;
  title: string | null;
  description: string | null;
  note: string | null;
  provider: string;
  bucketName: string;
  objectKey: string;
  mimeType: string;
  extension: string | null;
  category: string | null;
  entityType: string | null;
  entityId: string | null;
  sizeBytes: number;
  checksumSha256: string | null;
  visibility: FileVisibilityApi;
  status: string;
  url: string | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FileListParams {
  search?: string;
  category?: string;
  entityType?: FileEntityTypeApi;
  entityId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'originalname' | 'sizebytes';
  sortOrder?: 'asc' | 'desc';
}

export interface FileUploadMeta {
  displayName?: string;
  title?: string;
  description?: string;
  note?: string;
  category?: string;
  entityType?: FileEntityTypeApi;
  entityId?: string;
  visibility?: FileVisibilityApi;
}

interface ApiErrorMessage {
  vi?: string;
  en?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ message?: string; messages?: ApiErrorMessage }>;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

const appendMeta = (form: FormData, meta: FileUploadMeta) => {
  if (meta.displayName) form.append('displayName', meta.displayName);
  if (meta.title) form.append('title', meta.title);
  if (meta.description) form.append('description', meta.description);
  if (meta.note) form.append('note', meta.note);
  if (meta.category) form.append('category', meta.category);
  if (meta.entityType) form.append('entityType', meta.entityType);
  if (meta.entityId) form.append('entityId', meta.entityId);
  if (meta.visibility) form.append('visibility', meta.visibility);
};

export const filesApi = {
  /** Upload 1 file (multipart, tối đa 20MB/request) */
  upload: (file: File, meta: FileUploadMeta = {}, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    appendMeta(form, meta);
    return request<FileItemApi>({
      url: '/api/v1/files/upload',
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },
  /** Upload nhiều file 1 lần (field `files` lặp; metadata áp dụng chung; tối đa 100MB/request). */
  uploadBulk: (files: File[], meta: FileUploadMeta = {}, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    appendMeta(form, meta);
    return request<FileItemApi[]>({
      url: '/api/v1/files/upload-bulk',
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },
  list: (params: FileListParams = {}) =>
    request<PagedResult<FileItemApi>>({ url: '/api/v1/files', method: 'GET', params }),
  get: (id: string) => request<FileItemApi>({ url: `/api/v1/files/${id}`, method: 'GET' }),
  remove: (id: string) =>
    request<{ deleted: boolean; id: string }>({ url: `/api/v1/files/${id}`, method: 'DELETE' }),
};

/** Presigned URL (hạn 1h) — gọi lại mỗi lần cần hiển thị/tải, không lưu lâu. */
export async function getFilePreviewUrl(id: string): Promise<string> {
  const file = await filesApi.get(id);
  if (!file.url) throw new Error('Không lấy được đường dẫn file.');
  return file.url;
}

/** Tải file về máy qua endpoint download (binary + Content-Disposition tên gốc). */
export async function downloadFile(id: string, fileName: string) {
  const response = await mainInstance<Blob>({
    url: `/api/v1/files/${id}/download`,
    method: 'GET',
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(response);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function getFilesApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.errors
      ?.flatMap((item) => item.messages?.vi ?? item.messages?.en ?? item.message ?? [])
      .find(Boolean);
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
