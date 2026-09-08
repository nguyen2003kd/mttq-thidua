/* eslint-disable */

export type UploadMultipleFilesBody = {
  files: (Blob | File)[];
  /** @maxLength 150 */
  title?: string;
  /** @maxLength 500 */
  description?: string;
  /** @maxLength 255 */
  note?: string;
  is_library?: boolean;
};
