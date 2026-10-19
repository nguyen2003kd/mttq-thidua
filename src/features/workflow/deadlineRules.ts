export function isDeadlineBlockingLocalityEdit(deadlineExpired: boolean, isRevisionResubmission: boolean) {
  return deadlineExpired && !isRevisionResubmission;
}
