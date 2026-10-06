export function getSpecialistGroupProgress<T extends {
  periodId: string | null;
  status: string;
  hasModificationRequest: boolean;
}>(groups: readonly T[], periodFilter: string) {
  const periodGroups = periodFilter
    ? groups.filter((group) => group.periodId === periodFilter)
    : groups;
  const needsRevision = (group: T) => group.hasModificationRequest || group.status === 'YEU_CAU_SUA';
  return {
    completedGroups: periodGroups.filter((group) => group.status === 'DA_CHAM' && !needsRevision(group)).length,
    pendingGroups: periodGroups.filter((group) => ['CHO_CHAM', 'CHO_DUYET'].includes(group.status) && !needsRevision(group)).length,
    revisionGroups: periodGroups.filter(needsRevision).length,
    unsubmittedGroups: periodGroups.filter((group) => group.status === 'CHUA_NOP' && !needsRevision(group)).length,
    totalCount: periodGroups.length,
  };
}
