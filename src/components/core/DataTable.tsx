import { useState, useMemo, type ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from './Button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DataTableColumnMeta {
  className?: string;
  align?: 'left' | 'center' | 'right';
  list?: {
    label?: string;
    width?: string;
    valueClassName?: string;
    labelClassName?: string;
  };
}

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: ReactNode;
  pageSize?: number;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  emptyState?: { title: string; description?: string; icon?: ReactNode };
  toolbar?: ReactNode;
  variant?: 'table' | 'list';
  className?: string;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKey,
  filters,
  pageSize = 10,
  enableRowSelection = false,
  onRowSelectionChange,
  emptyState,
  toolbar,
  variant = 'table',
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const columnsWithSelect = useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectCol: ColumnDef<TData, unknown> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };

    return [selectCol, ...columns] as ColumnDef<TData, unknown>[];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: columnsWithSelect,
    state: { sorting, columnFilters, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      if (onRowSelectionChange) {
        const selectedData = table
          ? table.getFilteredSelectedRowModel().rows.map((r) => r.original)
          : [];
        onRowSelectionChange(selectedData);
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const handleSearch = (value: string) => {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    } else {
      setGlobalFilter(value);
    }
  };

  const currentFilter = searchKey
    ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
    : globalFilter;

  const visibleColumns = table.getVisibleLeafColumns();
  const listGridTemplate = visibleColumns
    .map((col) => (col.columnDef.meta as DataTableColumnMeta | undefined)?.list?.width ?? 'minmax(0,1fr)')
    .join(' ');

  const totalRows = table.getRowCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSizeState = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSizeState + 1;
  const endRow = Math.min((pageIndex + 1) * pageSizeState, totalRows);

  const getAlignClass = (align?: 'left' | 'center' | 'right') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  const getFlexAlign = (align?: 'left' | 'center' | 'right') =>
    align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start';

  const renderList = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
            <div
              key={`list-skeleton-${i}`}
              className="rounded-lg border border-border border-l-4 border-l-primary bg-card p-4"
              style={{ gridTemplateColumns: listGridTemplate }}
            >
              <Skeleton className="h-5 w-full max-w-[120px]" />
            </div>
          ))}
        </div>
      );
    }

    if (table.getRowModel().rows.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-card p-8">
          {emptyState ? (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              icon={emptyState.icon}
            />
          ) : (
            <EmptyState
              title="Không có dữ liệu"
              description="Chưa có bản ghi nào phù với bộ lọc hiện tại."
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* List rows */}
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            data-state={row.getIsSelected() ? 'selected' : undefined}
            onClick={enableRowSelection ? () => row.toggleSelected() : undefined}
            className={cn(
              'grid items-center gap-4 rounded-lg border border-border border-l-4 border-l-primary bg-card p-4 transition-shadow hover:shadow-md',
              enableRowSelection && 'cursor-pointer',
            )}
            style={{ gridTemplateColumns: listGridTemplate }}
          >
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
              const alignClass = getAlignClass(meta?.align);
              const flexAlign = getFlexAlign(meta?.align);
              const list = meta?.list;
              const value = flexRender(cell.column.columnDef.cell, cell.getContext());

              return (
                <div
                  key={cell.id}
                  className={cn('flex flex-col justify-center min-w-0', flexAlign, alignClass, meta?.className, list?.label && 'gap-0.5')}
                >
                  {list?.label ? (
                    <>
                      <span className={cn('truncate text-base font-semibold text-foreground', list.valueClassName)}>
                        {value}
                      </span>
                      <span className={cn('text-xs text-muted-foreground', list.labelClassName)}>
                        {list.label}
                      </span>
                    </>
                  ) : (
                    <span className={cn('truncate', list?.valueClassName)}>{value}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      {(searchable || filters || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchable && (
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={currentFilter}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {filters && <div className="flex items-center gap-2">{filters}</div>}
            {toolbar}
          </div>
        </div>
      )}

      {/* Table */}
      {variant === 'list' ? renderList() : (<div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const alignClass = meta?.align === 'right'
                    ? 'text-right'
                    : meta?.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                  return (
                    <TableHead key={header.id} className={cn(alignClass, meta?.className)}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center gap-1.5',
                            header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground',
                            meta?.align === 'right' && 'justify-end',
                            meta?.align === 'center' && 'justify-center',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground/50">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`}>
                  {table.getVisibleLeafColumns().map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-64">
                  {emptyState ? (
                    <EmptyState
                      title={emptyState.title}
                      description={emptyState.description}
                      icon={emptyState.icon}
                    />
                  ) : (
                    <EmptyState
                      title="Không có dữ liệu"
                      description="Chưa có bản ghi nào phù với bộ lọc hiện tại."
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={enableRowSelection ? () => row.toggleSelected() : undefined}
                  className={cn(enableRowSelection && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                    const alignClass = meta?.align === 'right'
                      ? 'text-right'
                      : meta?.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                    return (
                      <TableCell key={cell.id} className={cn(alignClass, meta?.className)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>)}

      {/* Pagination */}
      {!loading && totalRows > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-sm text-muted-foreground">
            {enableRowSelection && table.getSelectedRowModel().rows.length > 0 && (
              <span className="mr-3">
                Đã chọn {table.getSelectedRowModel().rows.length} / {totalRows}
              </span>
            )}
            <span>
              Hiển thị {startRow} đến {endRow} của {totalRows} kết quả
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSizeState}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
