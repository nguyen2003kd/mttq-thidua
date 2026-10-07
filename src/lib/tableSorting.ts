export type TableSortDirection = 'asc' | 'desc';
export type TableSortValue = string | number | Date | null | undefined;
export type TableSortState = { column: string; direction: TableSortDirection } | null;
export type TableSortAccessors<T> = Record<string, (row: T) => TableSortValue>;

export function toggleTableSort(
  current: TableSortState,
  column: string,
  firstDirection: TableSortDirection = 'asc',
): TableSortState {
  if (current?.column !== column) return { column, direction: firstDirection };
  if (current.direction === firstDirection) {
    return { column, direction: firstDirection === 'asc' ? 'desc' : 'asc' };
  }
  return null;
}

export function sortTableRows<T>(
  rows: readonly T[],
  sort: TableSortState,
  accessors: TableSortAccessors<T>,
): T[] {
  const accessor = sort ? accessors[sort.column] : undefined;
  if (!sort || !accessor) return [...rows];

  return [...rows].sort((left, right) => {
    const leftValue = normalizeSortValue(accessor(left));
    const rightValue = normalizeSortValue(accessor(right));
    if (leftValue === null && rightValue === null) return 0;
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;

    const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), 'vi', { numeric: true });
    return sort.direction === 'desc' ? -comparison : comparison;
  });
}

export function toTimestamp(value: string | Date | null | undefined): number | null {
  if (value == null || value === '') return null;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeSortValue(value: TableSortValue): string | number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  return value;
}
