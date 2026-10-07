import { FilterSelect } from './FilterSelect';
import type { TableSortState } from '@/lib/tableSorting';

export interface TableSortOption {
  value: string;
  label: string;
  sort: NonNullable<TableSortState>;
}

export function TableSortSelect({
  sort,
  options,
  onChange,
}: {
  sort: TableSortState;
  options: TableSortOption[];
  onChange: (sort: TableSortState) => void;
}) {
  const selected = options.find((option) => option.sort.column === sort?.column && option.sort.direction === sort.direction);

  return (
    <FilterSelect
      label="Sắp xếp"
      value={selected?.value ?? ''}
      onChange={(value) => onChange(options.find((option) => option.value === value)?.sort ?? null)}
      options={options}
      allLabel="Mặc định"
    />
  );
}
