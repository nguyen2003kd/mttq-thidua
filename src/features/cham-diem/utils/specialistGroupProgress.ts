export function getSpecialistGroupProgress<T extends {
  periodId: string | null;
  status: string;
  hasModificationRequest: boolean;
}>(groups: readonly T[], periodFilter: string) {
  const periodGroups = periodFilter
    ? groups.filter((group) => group.periodId === periodFilter)
    : groups;
  return {
    completedGroups: periodGroups.filter((group) => group.status === 'DA_CHAM').length,
    revisionGroups: periodGroups.filter((group) => group.hasModificationRequest).length,
    totalCount: periodGroups.length,
  };
}
