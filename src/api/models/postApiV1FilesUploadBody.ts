/* eslint-disable */

export type PostApiV1FilesUploadBody = {
  File?: Blob | File;
  DisplayName?: string;
  Title?: string;
  Description?: string;
  Note?: string;
  Category?: string;
  EntityType?: string;
  EntityId?: string;
  Visibility?: string;
};
