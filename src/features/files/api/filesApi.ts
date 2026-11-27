import axios, { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';
import { useUploadProgressStore } from '../uploadProgressStore';

export type FileEntityTypeApi =
  | 'CriteriaGroup'
  | 'Criteria'
  | 'SubmissionResult'
  | 'SubmissionHistory'
  | 'ApprovalHistory'
  | 'FinalDecision'
  | 'Submission'
  | 'ResultPublication';

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
  /** Upload 1 file; exposes an individual progress/result in the floating panel. */
  upload: async (
    file: File,
    meta: FileUploadMeta = {},
    onProgress?: (percent: number) => void,
    trackedItemId?: string,
  ) => {
    const tracker = useUploadProgressStore.getState();
    const id = trackedItemId ?? tracker.startBatch([{ name: file.name, size: file.size }])[0];
    tracker.setUploading(id);
    const form = new FormData();
    form.append('file', file);
    appendMeta(form, meta);

    try {
      const result = await request<FileItemApi>({
        url: '/api/v1/files/upload',
        method: 'POST',
        data: form,
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          useUploadProgressStore.getState().setProgress(id, percent);
          onProgress?.(percent);
        },
      });
      useUploadProgressStore.getState().succeed(id);
      return result;
    } catch (error) {
      useUploadProgressStore.getState().fail(id, getFilesApiError(error));
      throw error;
    }
  },
  /** Upload nhiều file 1 lần (field `files` lặp; metadata áp dụng chung; tối đa 100MB/request). */
  uploadBulk: async (files: File[], meta: FileUploadMeta = {}, onProgress?: (percent: number) => void) => {
    const tracker = useUploadProgressStore.getState();
    const ids = tracker.startBatch(files.map((file) => ({ name: file.name, size: file.size })), 'bulk');
    ids.forEach((id) => tracker.setUploading(id));
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    appendMeta(form, meta);

    try {
      const results = await request<FileItemApi[]>({
        url: '/api/v1/files/upload-bulk',
        method: 'POST',
        data: form,
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          const state = useUploadProgressStore.getState();
          ids.forEach((id) => state.setProgress(id, percent));
          onProgress?.(percent);
        },
      });
      if (results.length !== files.length) {
        const warning = 'Máy chủ không xác nhận đủ số file. Hãy kiểm tra danh sách đính kèm.';
        ids.forEach((id) => useUploadProgressStore.getState().uncertain(id, warning));
        throw new Error(warning);
      }
      ids.forEach((id) => useUploadProgressStore.getState().succeed(id));
      return results;
    } catch (error) {
      const reason = 'Không xác định được file nào đã lưu do lô upload gặp lỗi. Hãy kiểm tra danh sách. ' + getFilesApiError(error);
      ids.forEach((id) => useUploadProgressStore.getState().uncertain(id, reason));
      throw error;
    }
  },
  list: (params: FileListParams = {}) =>
    request<PagedResult<FileItemApi>>({ url: '/api/v1/files', method: 'GET', params }),
  /** Lấy file của nhiều entityId cùng lúc (tránh N+1) — trả về danh sách phẳng, mỗi item có entityId để group. */
  listByEntities: (entityType: FileEntityTypeApi, entityIds: string[]) =>
    request<FileItemApi[]>({
      url: '/api/v1/files/batch',
      method: 'GET',
      params: { entityType, entityIds: entityIds.join(',') },
    }),
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

/** Lấy nội dung tệp; thử URL dự phòng khi endpoint download lỗi hoặc trả về rỗng. */
export async function getFileBlob(id: string, fallbackUrl?: string | null): Promise<Blob> {
  try {
    const blob = await mainInstance<Blob>({
      url: `/api/v1/files/${id}/download`,
      method: 'GET',
      responseType: 'blob',
    });
    if (blob instanceof Blob && blob.size > 0) return blob;
  } catch {
    // Thử URL tệp mới từ metadata ở dưới.
  }

  let freshUrl: string | null = null;
  try {
    freshUrl = (await filesApi.get(id)).url;
  } catch {
    // Lịch sử có thể vẫn chứa URL hợp lệ dù metadata không còn truy cập được.
  }

  for (const url of new Set([freshUrl, fallbackUrl].filter((value): value is string => Boolean(value)))) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size > 0) return blob;
    } catch {
      // URL hết hạn, storage lỗi hoặc không cho phép CORS; thử URL còn lại.
    }
  }

  throw new Error('Không tải được nội dung tệp từ máy chủ. Tệp có thể đã rỗng hoặc không còn trong kho lưu trữ; vui lòng chọn tệp khác.');
}

/** Tải file về máy qua endpoint download (binary + Content-Disposition tên gốc). */
export async function downloadFile(id: string, fileName: string, fallbackUrl?: string | null) {
  const response = await getFileBlob(id, fallbackUrl);
  const objectUrl = URL.createObjectURL(response);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
