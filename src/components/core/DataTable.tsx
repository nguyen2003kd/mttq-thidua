import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { useUIStore } from '@/store/uiStore';
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
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

const getAlignClass = (align?: 'left' | 'center' | 'right') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

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
  /** Chip hiển thị các bộ lọc đang bật, kèm nút bỏ từng cái */
  activeFilters?: { label: string; value: string; onClear: () => void }[];
  /** Hiện link "Xóa tất cả" cạnh hàng chip */
  onClearFilters?: () => void;
  pageSize?: number;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  emptyState?: { title: string; description?: string; icon?: ReactNode };
  toolbar?: ReactNode;
  variant?: 'table' | 'list';
  className?: string;
  /** Tiêu đề hiện khi toolbar dính (sticky) */
  stickyTitle?: string;
  /** Mô tả nhỏ hiện dưới tiêu đề khi sticky */
  stickyDescription?: string;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  /** Khóa ổn định cho mỗi hàng — giữ selection đúng khi sort/lọc/đổi trang */
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKey,
  filters,
  activeFilters,
  onClearFilters,
  pageSize = 10,
  enableRowSelection = false,
  onRowSelectionChange,
  emptyState,
  toolbar,
  variant = 'table',
  className,
  onRowClick,
  onRowDoubleClick,
  getRowId,
  stickyTitle,
  stickyDescription,
}: DataTableProps<TData, TValue>) {
  const selectionCbRef = useRef(onRowSelectionChange);
  selectionCbRef.current = onRowSelectionChange;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const setStickyTitle = useUIStore((s) => s.setStickyTitle);
  const setStickyDescription = useUIStore((s) => s.setStickyDescription);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const stuck = !entry.isIntersecting;
        setStickyTitle(stuck ? stickyTitle ?? null : null);
        setStickyDescription(stuck ? stickyDescription ?? null : null);
      },
      { rootMargin: '-56px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [stickyTitle, stickyDescription, setStickyTitle, setStickyDescription]);

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
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  // Phát danh sách hàng đã chọn ra ngoài SAU khi state cập nhật (tránh lệch 1 nhịp)
  useEffect(() => {
    selectionCbRef.current?.(
      table.getFilteredSelectedRowModel().rows.map((r) => r.original),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `table` là ref ổn định từ useReactTable
  }, [rowSelection]);

  // Debounce: chỉ đẩy giá trị vào bảng sau khi ngừng gõ 250ms
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchKey) {
        table.getColumn(searchKey)?.setFilterValue(searchInput || undefined);
      } else {
        setGlobalFilter(searchInput);
      }
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `table` là ref ổn định từ useReactTable
  }, [searchInput, searchKey]);

  const visibleColumns = table.getVisibleLeafColumns();
  const listGridTemplate = visibleColumns
    .map((col) => (col.columnDef.meta as DataTableColumnMeta | undefined)?.list?.width ?? 'minmax(0,1fr)')
    .join(' ');

  const totalRows = table.getRowCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSizeState = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSizeState + 1;
  const endRow = Math.min((pageIndex + 1) * pageSizeState, totalRows);

  const renderPagination = () => {
    if (loading || totalRows === 0) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-border/40 bg-muted/20 px-4 py-1">
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
        <div className="flex items-center gap-1">
          <Select
            value={String(pageSizeState)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger size="sm" className="w-[50px] !h-8 text-xs px-2">
              <SelectValue>{pageSizeState}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs py-1">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="rounded-lg border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <div
          className="grid gap-0 sticky top-0 z-[5] bg-primary text-xs font-semibold text-primary-foreground"
          style={{ gridTemplateColumns: listGridTemplate }}
        >
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header, idx, arr) => {
              const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
              const alignClass = getAlignClass(meta?.align);

              return (
                <div
                  key={header.id}
                  className={cn(
                    'relative flex items-center min-w-0 h-12 px-4 box-border',
                    idx === 0 && 'pl-5',
                    idx === arr.length - 1 && 'pr-5',
                    alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start',
                    meta?.className,
                  )}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  {idx < arr.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 border-r-2 border-white/30" />
                  )}
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
                className="grid items-center gap-0 bg-card"
                style={{ gridTemplateColumns: listGridTemplate }}
              >
                {visibleColumns.map((col, sIdx) => (
                  <div key={col.id} className={cn('relative flex items-center h-12 px-4 box-border', sIdx === 0 && 'pl-5', sIdx === visibleColumns.length - 1 && 'pr-5')}>
                    <Skeleton className="h-5 w-full max-w-[140px]" />
                    {sIdx < visibleColumns.length - 1 && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 border-r-2 border-primary/25" />
                    )}
                  </div>
                ))}
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
                description="Chưa có bản ghi nào phù hợp với bộ lọc hiện tại."
              />
            )}
          </div>
        ) : (
          <div>
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                onClick={enableRowSelection ? () => row.toggleSelected() : onRowClick ? () => onRowClick(row.original) : undefined}
                onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row.original) : undefined}
                className={cn(
                  'grid items-center gap-0 border-b border-border/40 bg-card transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-destructive/10',
                  (enableRowSelection || onRowClick) && 'cursor-pointer',
                  row.getIsSelected() && 'bg-primary/[0.03]',
                )}
                style={{ gridTemplateColumns: listGridTemplate }}
              >
                {row.getVisibleCells().map((cell, idx, arr) => {
                  const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const alignClass = getAlignClass(meta?.align);
                  const list = meta?.list;
                  const value = flexRender(cell.column.columnDef.cell, cell.getContext());
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={cell.id}
                      className={cn(
                        'relative flex items-center min-w-0 h-12 px-4 box-border',
                        isFirst && 'pl-5',
                        idx === arr.length - 1 && 'pr-5',
                        alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start',
                        meta?.className,
                      )}
                    >
                      <span className={cn('truncate text-sm', list?.valueClassName)}>{value}</span>
                      {idx < arr.length - 1 && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 border-r-2 border-primary/25" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {Array.from({ length: Math.min(3, Math.max(0, pageSize - table.getRowModel().rows.length)) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="grid items-center gap-0 bg-card"
                style={{ gridTemplateColumns: listGridTemplate }}
              >
                {visibleColumns.map((col, sIdx) => (
                  <div key={col.id} className={cn('relative flex items-center h-12 px-4 box-border', sIdx === 0 && 'pl-5', sIdx === visibleColumns.length - 1 && 'pr-5')}>
                    {sIdx < visibleColumns.length - 1 && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 border-r-2 border-primary/25" />
                    )}
                  </div>
                ))}
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
    <div className={cn('relative flex flex-col', className)}>
      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} className="absolute top-0 h-px w-full" aria-hidden="true" />

      {/* Unified container: toolbar + chips + table */}
      <div className="rounded-lg border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Toolbar */}
      {(searchable || filters || toolbar) && (
        <div className="sticky top-[-24px] z-10 px-4 py-3 bg-background/95 backdrop-blur-sm flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative w-full max-w-[300px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="!h-9 rounded-lg border-border/60 bg-card pl-9 pr-8 !py-0 !text-[13px] leading-9 focus-visible:border-ring"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-1.5 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {filters}
          {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Chip bộ lọc đang bật */}
      {activeFilters && activeFilters.length > 0 && (
        <div className="sticky top-[2.75rem] z-10 px-4 py-1.5 bg-background/95 backdrop-blur-sm flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Đang lọc:</span>
          {activeFilters.map((f) => (
            <span
              key={f.label}
              className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary/10 pl-2.5 pr-1 text-xs font-medium text-primary"
            >
              <span className="font-normal">{f.label}:</span>
              {f.value}
              <button
                type="button"
                onClick={f.onClear}
                aria-label={`Bỏ lọc ${f.label}`}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 transition-colors hover:bg-primary/30"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {variant === 'list' ? renderList() : (
        <div>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/40 sticky top-0 z-[5] bg-primary">
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
                        description="Chưa có bản ghi nào phù hợp với bộ lọc hiện tại."
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={
                      enableRowSelection
                        ? () => row.toggleSelected()
                        : onRowClick
                        ? () => onRowClick(row.original)
                        : undefined
                    }
                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row.original) : undefined}
                    className={cn((enableRowSelection || onRowClick) && 'cursor-pointer')}
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
    </div>
  );
}
