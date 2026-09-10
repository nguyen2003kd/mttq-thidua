/* eslint-disable */

export type PostApiV1FilesUploadBulkBody = {
  files?: (Blob | File)[];
  displayName?: string;
  title?: string;
  description?: string;
  note?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  visibility?: string;
};
