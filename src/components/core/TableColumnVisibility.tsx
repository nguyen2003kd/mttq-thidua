import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TableColumnOption {
  id: string;
  label: string;
}

interface TableColumnVisibilityProps {
  /** Khóa cũng được gắn vào phần tử bao quanh table bằng data-column-visibility-table. */
  storageKey: string;
  columns: TableColumnOption[];
  className?: string;
}

/** Bộ chọn cột dùng cho các bảng viết tay, ngoài DataTable. */
export function TableColumnVisibility({ storageKey, columns, className }: TableColumnVisibilityProps) {
  const storageName = `table-columns:${storageKey}`;
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storageName) ?? '{}') as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const visibleCount = columns.filter((column) => visible[column.id] !== false).length;
  const hiddenRules = useMemo(() => columns
    .map((column, index) => visible[column.id] === false
      ? `[data-column-visibility-table="${storageKey}"] colgroup > :nth-child(${index + 1}) { display: none; width: 0 !important; }\n[data-column-visibility-table="${storageKey}"] tr > :nth-child(${index + 1}) { display: none; }`
      : '')
    .filter(Boolean)
    .join('\n'), [columns, storageKey, visible]);

  useEffect(() => {
    window.localStorage.setItem(storageName, JSON.stringify(visible));
  }, [storageName, visible]);

  return (
    <>
      <style>{hiddenRules}</style>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className={className} />}>
          <SlidersHorizontal className="size-4" /> Cột hiển thị
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Chọn cột hiển thị</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => {
              const checked = visible[column.id] !== false;
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={checked}
                  disabled={checked && visibleCount === 1}
                  onCheckedChange={(next) => setVisible((current) => ({ ...current, [column.id]: Boolean(next) }))}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
