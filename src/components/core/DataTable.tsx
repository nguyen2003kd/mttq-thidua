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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const renderPagination = () => {
    if (loading || totalRows === 0) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-muted/20 px-5 py-3">
        <div className="text-xs text-muted-foreground">
          {enableRowSelection && table.getSelectedRowModel().rows.length > 0 && (
            <span className="mr-3">
              Đã chọn {table.getSelectedRowModel().rows.length} / {totalRows}
            </span>
          )}
          <span>
            Hiển thị {startRow}–{endRow} / {totalRows}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSizeState)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger size="sm" className="w-[65px]">
              <SelectValue>{pageSizeState}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    );
  };

  const renderList = () => {
    return (
      <div className="rounded-xl border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center gap-4 bg-primary px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          style={{ gridTemplateColumns: listGridTemplate }}
        >
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
              const alignClass = getAlignClass(meta?.align);
              const flexAlign = getFlexAlign(meta?.align);

              return (
                <div
                  key={header.id}
                  className={cn('flex items-center min-w-0', flexAlign, alignClass, meta?.className)}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              );
            }),
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div>
            {Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
              <div
                key={`list-skeleton-${i}`}
                className="grid items-center gap-4 border-b border-border/40 bg-card px-5 py-4"
                style={{ gridTemplateColumns: listGridTemplate }}
              >
                <Skeleton className="h-5 w-full max-w-[140px]" />
              </div>
            ))}
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="bg-card p-10">
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
        ) : (
          <div>
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                onClick={enableRowSelection ? () => row.toggleSelected() : undefined}
                className={cn(
                  'grid items-center gap-4 border-b border-border/40 bg-card px-5 py-4 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted/20 last:border-b-0',
                  enableRowSelection && 'cursor-pointer',
                  row.getIsSelected() && 'bg-primary/[0.03]',
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
                      className={cn('flex items-center min-w-0', flexAlign, alignClass, meta?.className)}
                    >
                      <span className={cn('truncate text-sm', list?.valueClassName)}>{value}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
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
      {variant === 'list' ? renderList() : (
        <div className="rounded-xl border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/40">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                    const alignClass = meta?.align === 'right'
                      ? 'text-right'
                      : meta?.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                    return (
                      <TableHead key={header.id} className={cn('bg-primary text-primary-foreground', alignClass, meta?.className)}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-1.5',
                              header.column.getCanSort() && 'cursor-pointer select-none hover:text-white/75',
                              meta?.align === 'right' && 'justify-end',
                              meta?.align === 'center' && 'justify-center',
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-white/50">
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
                        <Skeleton className="h-5 w-full max-w-[140px]" />
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

          {renderPagination()}
        </div>
      )}
    </div>
  );
}
