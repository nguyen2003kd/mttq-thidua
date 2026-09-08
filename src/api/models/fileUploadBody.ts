/* eslint-disable */

export interface FileUploadBody {
  /** File to upload */
  file: Blob;
  /**
     * @maxLength 150
     * @nullable
     */
  title?: string | null;
  /**
     * @maxLength 500
     * @nullable
     */
  description?: string | null;
  /**
     * @maxLength 255
     * @nullable
     */
  note?: string | null;
  is_library?: boolean;
}
