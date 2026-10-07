import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { TableSortState } from '@/lib/tableSorting';

interface SortableTableHeadProps {
  column: string;
  label: ReactNode;
  ariaLabel: string;
  sort: TableSortState;
  onSort: () => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
  buttonClassName?: string;
}

export function SortableTableHead({
  column,
  label,
  ariaLabel,
  sort,
  onSort,
  align = 'left',
  className,
  buttonClassName,
}: SortableTableHeadProps) {
  const direction = sort?.column === column ? sort.direction : undefined;

  return (
    <TableHead
      scope="col"
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}
      className={cn('p-0', className)}
    >
      <button
        type="button"
        aria-description={`Sắp xếp theo ${ariaLabel}`}
        onClick={onSort}
        className={cn(
          'flex min-h-11 w-full cursor-pointer items-center gap-1 px-4 py-3 text-primary-foreground transition-colors hover:text-primary-foreground/75',
          align === 'left' && 'justify-start text-left',
          align === 'center' && 'justify-center text-center',
          align === 'right' && 'flex-row-reverse justify-start text-right',
          buttonClassName,
        )}
      >
        <span>{label}</span>
        {direction === 'asc' ? <ChevronUp aria-hidden="true" className="size-3.5 shrink-0" />
          : direction === 'desc' ? <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
            : <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-primary-foreground/50" />}
      </button>
    </TableHead>
  );
}
