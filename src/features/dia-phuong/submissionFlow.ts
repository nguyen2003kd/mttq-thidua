export type UploadGateResult<T> =
  | { ok: true; value: T }
  | { ok: false; failedUploadGroups: number };

export async function submitAfterSuccessfulUploads<T>(
  uploadJobs: Promise<unknown>[],
  submit: () => Promise<T>,
): Promise<UploadGateResult<T>> {
  const outcomes = await Promise.allSettled(uploadJobs);
  const failedUploadGroups = outcomes.filter((outcome) => outcome.status === 'rejected').length;

  if (failedUploadGroups > 0) return { ok: false, failedUploadGroups };
  return { ok: true, value: await submit() };
}
