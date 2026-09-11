import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  filesApi,
  getFilesApiError,
  type FileItemApi,
  type FileUploadMeta,
} from '@/features/files/api/filesApi';

/**
 * Hook upload file dùng chung — tải tuần tự từng file để hiển thị progress riêng cho từng item.
 * Trạng thái progress theo tên file (0-100) để gắn vào <FileUpload uploading uploadProgress>.
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadFiles = useCallback(async (files: File[], meta: FileUploadMeta = {}): Promise<FileItemApi[]> => {
    if (files.length === 0) return [];
    setUploading(true);
    setUploadProgress({});
    const results: FileItemApi[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        try {
          const uploaded = await filesApi.upload(file, meta, (percent) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
          });
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
          results.push(uploaded);
        } catch (error) {
          // 1 file lỗi không chặn các file còn lại — báo rõ tên file thất bại
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
          failures.push(file.name);
          toast.error(`${file.name}: ${getFilesApiError(error)}`);
        }
      }
      if (failures.length === 0) {
        toast.success(files.length > 1 ? `Đã tải lên ${files.length} file.` : 'Đã tải lên file.');
      } else if (results.length > 0) {
        toast.warning(`Đã tải lên ${results.length}/${files.length} file — ${failures.length} file thất bại.`);
      }
      return results;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, uploadProgress, uploadFiles };
}
