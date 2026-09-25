/* eslint-disable */

export type PostApiV1SubmissionsRequestRevisionBody = {
  SubmissionId?: string;
  Reason?: string;
  SubmissionResultIds?: string[];
  Files?: (Blob | File)[];
};
