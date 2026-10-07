export type LocalityOverallStatus = 'CHUA_NOP' | 'CHO_DUYET' | 'YEU_CAU_SUA' | 'DA_DUYET';
export type LocalitySortColumn = 'completion' | 'status';
export type LocalitySortValue = '' | 'completion-asc' | 'completion-desc' | 'status-asc' | 'status-desc';
export type LocalitySortDirection = 'asc' | 'desc';

export const LOCALITY_STATUS_LABELS: Record<LocalityOverallStatus, string> = {
  CHUA_NOP: 'Chưa nộp',
  CHO_DUYET: 'Đang chờ duyệt',
  YEU_CAU_SUA: 'Yêu cầu chỉnh sửa',
  DA_DUYET: 'Đã duyệt',
};

export const LOCALITY_SORT_OPTIONS: { value: Exclude<LocalitySortValue, ''>; label: string }[] = [
  { value: 'completion-desc', label: 'Nhiều nhóm hoàn thành' },
  { value: 'completion-asc', label: 'Ít nhóm hoàn thành' },
  { value: 'status-asc', label: 'Trạng thái A → Z' },
  { value: 'status-desc', label: 'Trạng thái Z → A' },
];

export function getLocalitySortDirection(sortValue: LocalitySortValue, column: LocalitySortColumn): LocalitySortDirection | undefined {
  if (sortValue === `${column}-asc`) return 'asc';
  if (sortValue === `${column}-desc`) return 'desc';
  return undefined;
}

export function toggleLocalitySort(sortValue: LocalitySortValue, column: LocalitySortColumn): LocalitySortValue {
  const firstSort = column === 'completion' ? 'completion-desc' : 'status-asc';
  const secondSort = column === 'completion' ? 'completion-asc' : 'status-desc';
  if (sortValue === firstSort) return secondSort;
  if (sortValue === secondSort) return '';
  return firstSort;
}

export function sortLocalityRows<T extends { completedGroupCount: number; overallStatus: LocalityOverallStatus }>(
  rows: readonly T[],
  sortValue: LocalitySortValue,
): T[] {
  if (!sortValue) return [...rows];

  const descending = sortValue.endsWith('-desc');
  return [...rows].sort((left, right) => {
    const comparison = sortValue.startsWith('completion')
      ? left.completedGroupCount - right.completedGroupCount
      : LOCALITY_STATUS_LABELS[left.overallStatus].localeCompare(LOCALITY_STATUS_LABELS[right.overallStatus], 'vi');
    return descending ? -comparison : comparison;
  });
}
