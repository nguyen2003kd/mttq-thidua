/* eslint-disable */

export interface ConfirmFileRequest {
  file_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_token: string;
  title?: string;
  is_library?: boolean;
}
