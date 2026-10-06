export function filterSubmissionsByStage<T extends { currentStage: string; hasSubmission?: boolean }>(
  submissions: T[],
  stage: string,
): T[] {
  if (!stage) return submissions;
  return submissions.filter((submission) => submission.hasSubmission !== false && submission.currentStage === stage);
}
