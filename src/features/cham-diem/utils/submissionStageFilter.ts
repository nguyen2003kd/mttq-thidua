export function filterSubmissionsByStage<T extends { currentStage: string; hasSubmission?: boolean }>(
  submissions: T[],
  stage: string,
): T[] {
  if (!stage) return submissions;
  // Stage có thể là danh sách phân tách phẩy (tab gộp nhiều giai đoạn).
  const stages = stage.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (stages.length === 0) return submissions;
  return submissions.filter((submission) => submission.hasSubmission !== false && stages.includes(submission.currentStage.toLowerCase()));
}
