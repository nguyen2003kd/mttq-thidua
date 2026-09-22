import { useState, useMemo, useEffect, useRef, isValidElement, type CSSProperties, type ReactNode } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
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
  type Row,
  type VisibilityState,
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
import { FilterDropdown } from './FilterDropdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

const getAlignClass = (align: 'left' | 'center' | 'right' | undefined, fallback: 'left' | 'center' | 'right' = 'left') => {
  const resolved = align ?? fallback;
  return resolved === 'right' ? 'text-right' : resolved === 'center' ? 'text-center' : 'text-left';
};

/** Trích toàn bộ text hiển thị từ nội dung cell (đi qua element/array) để hiện tooltip. */
function extractCellText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractCellText).filter(Boolean).join(' ');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return props.children !== undefined ? extractCellText(props.children) : '';
  }
  return '';
}

export interface DataTableColumnMeta {
  className?: string;
  align?: 'left' | 'center' | 'right';
  /** Không tự bọc Tooltip cho ô có input, button, hoặc nội dung tương tác. */
  disableTooltip?: boolean;
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
  /** Nhận giá trị tìm kiếm đã debounce để gọi API phía server khi cần. */
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  /** Chip hiển thị các bộ lọc đang bật, kèm nút bỏ từng cái */
  activeFilters?: { label: string; value: string; onClear: () => void }[];
  /** Hiện link "Xóa tất cả" cạnh hàng chip */
  onClearFilters?: () => void;
  pageSize?: number;
  /** Ẩn phân trang cho bảng chi tiết cần hiển thị toàn bộ dữ liệu. */
  showPagination?: boolean;
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
  /** Id của hàng đang được chọn (highlight nền primary nhạt) */
  selectedRowId?: string;
  /** Class áp dụng cho thẻ table bên trong, ví dụ min-width / table-fixed. */
  tableClassName?: string;
  /** Class cho vùng cuộn ngang chỉ của bảng, không làm toolbar hay footer bị tràn. */
  tableWrapperClassName?: string;
  /** Class cho container được tạo bên trong component Table. */
  tableContainerClassName?: string;
  /** Thanh hành động dùng chung, có thể dính ở đáy bảng. */
  footer?: ReactNode;
  /** Render toàn bộ hàng cho bảng nghiệp vụ có ô nhập liệu phức tạp. */
  renderRow?: (row: Row<TData>, context: { selected: boolean; index: number; visibleColumnIds: string[] }) => ReactNode;
  /** Hiện menu để người dùng tùy chọn các cột cần xem. */
  enableColumnVisibility?: boolean;
  /** Khóa riêng để ghi nhớ cột đã ẩn/hiện trên từng bảng. */
  columnVisibilityStorageKey?: string;
}

/** Control chọn cột hiển thị trong dropdown Bộ lọc — nhận giá trị nháp (id cột hiển thị nối dấu phẩy), chỉ áp dụng khi bấm Xác nhận. */
function ColumnVisibilityDraftControl({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string }[];
}) {
  const visibleIds = useMemo(() => new Set(value ? value.split(',') : []), [value]);
  return (
    <div className="border-t border-border pt-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Cột hiển thị</p>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {visibleIds.size}/{items.length} cột
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map(({ id, label }) => {
          const visible = visibleIds.has(id);
          return (
            <label
              key={id}
              className={cn(
                'flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] transition-colors hover:bg-muted',
                visible ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <Checkbox
                checked={visible}
                disabled={visible && visibleIds.size === 1}
                onCheckedChange={(checked) => {
                  const next = new Set(visibleIds);
                  if (checked) next.add(id); else next.delete(id);
                  onChange(Array.from(next).join(','));
                }}
              />
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKey,
  onSearchChange,
  filters,
  activeFilters,
  onClearFilters,
  pageSize = 10,
  showPagination = true,
  enableRowSelection = false,
  onRowSelectionChange,
  emptyState,
  toolbar,
  variant = 'table',
  className,
  onRowClick,
  onRowDoubleClick,
  getRowId,
  selectedRowId,
  tableClassName,
  tableWrapperClassName,
  tableContainerClassName,
  footer,
  renderRow,
  stickyTitle,
  stickyDescription,
  enableColumnVisibility = true,
  columnVisibilityStorageKey,
}: DataTableProps<TData, TValue>) {
  const resolvedColumnVisibilityStorageKey = useMemo(
    () => columnVisibilityStorageKey ?? `${stickyTitle ?? 'table'}:${columns.map((column) => String(column.id ?? ('accessorKey' in column ? column.accessorKey : '') ?? '')).join('|')}`,
    [columnVisibilityStorageKey, columns, stickyTitle],
  );
  const selectionCbRef = useRef(onRowSelectionChange);
  selectionCbRef.current = onRowSelectionChange;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(window.localStorage.getItem(`datatable-columns:${resolvedColumnVisibilityStorageKey}`) ?? '{}') as VisibilityState;
    } catch {
      return {};
    }
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchInput = useDebounce(searchInput, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const listHeaderInnerRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const hasToolbar = Boolean(searchable || filters || toolbar || enableColumnVisibility);
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

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) {
      setToolbarHeight(0);
      return;
    }
    const updateToolbarHeight = () => setToolbarHeight(toolbarElement.getBoundingClientRect().height);
    updateToolbarHeight();
    const observer = new ResizeObserver(updateToolbarHeight);
    observer.observe(toolbarElement);
    return () => observer.disconnect();
  }, [hasToolbar]);

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
      columnVisibility,
      globalFilter,
    },
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`datatable-columns:${resolvedColumnVisibilityStorageKey}`, JSON.stringify(columnVisibility));
  }, [columnVisibility, resolvedColumnVisibilityStorageKey]);

  // `initialState` của TanStack Table chỉ chạy ở lần mount. Đồng bộ page size
  // khi dữ liệu/API đến muộn để bảng chi tiết không bị giữ lại số dòng cũ.
  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  // Phát danh sách hàng đã chọn ra ngoài SAU khi state cập nhật (tránh lệch 1 nhịp)
  useEffect(() => {
    selectionCbRef.current?.(
      table.getFilteredSelectedRowModel().rows.map((r) => r.original),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `table` là ref ổn định từ useReactTable
  }, [rowSelection]);

  // Chỉ lọc bảng hoặc gọi API sau khi người dùng ngừng gõ.
  useEffect(() => {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(debouncedSearchInput || undefined);
    } else {
      setGlobalFilter(debouncedSearchInput);
    }
    onSearchChange?.(debouncedSearchInput.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `table` là ref ổn định từ useReactTable
  }, [debouncedSearchInput, searchKey, onSearchChange]);

  const visibleColumns = table.getVisibleLeafColumns();
  const toggleableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const visibleToggleableColumns = toggleableColumns.filter((column) => column.getIsVisible());
  const columnVisibilityItems = toggleableColumns.map((column) => {
    const headerDef = column.columnDef.header;
    let label = column.id;
    if (typeof headerDef === 'string') {
      label = headerDef;
    } else if (headerDef) {
      // getFlatHeaders chỉ chứa header đang hiển thị — cột bị ẩn phải lấy label từ columnDef
      const header = table.getFlatHeaders().find((item) => item.column.id === column.id);
      if (header) {
        label = extractCellText(flexRender(headerDef, header.getContext())).trim() || column.id;
      }
    }
    return { column, label: label || column.id };
  });
  const showColumnVisibility = enableColumnVisibility && toggleableColumns.length > 1;
  /** Áp dụng danh sách id cột hiển thị (chuỗi nối dấu phẩy). Giá trị rỗng = hiện tất cả (mặc định). */
  const applyColumnVisibility = (value: string) => {
    const visibleIds = new Set(value ? value.split(',') : toggleableColumns.map((column) => column.id));
    toggleableColumns.forEach((column) => column.toggleVisibility(visibleIds.has(column.id)));
  };
  const listGridTemplate = visibleColumns
    .map((col) => (col.columnDef.meta as DataTableColumnMeta | undefined)?.list?.width ?? 'minmax(0,1fr)')
    .join(' ');
  const listMinWidth = visibleColumns.reduce((width, column) => {
    const track = (column.columnDef.meta as DataTableColumnMeta | undefined)?.list?.width ?? '';
    const minWidth = Number(track.match(/minmax\((\d+)px/)?.[1] ?? 0);
    return width + minWidth;
  }, 0);

  const totalRows = table.getRowCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSizeState = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSizeState + 1;
  const endRow = Math.min((pageIndex + 1) * pageSizeState, totalRows);

  const renderPagination = () => {
    if (!showPagination || loading || totalRows === 0) return null;
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
            <SelectTrigger size="sm" className="w-16 !h-8 gap-1 text-xs px-2.5">
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
      <>
        {/* Header nằm ngoài vùng cuộn ngang để sticky theo vùng cuộn trang. */}
        <div
          className="sticky top-[var(--toolbar-height)] z-20 overflow-hidden bg-primary shadow-[0_2px_0_rgba(168,32,44,0.18)]"
          style={{ '--toolbar-height': `${toolbarHeight}px` } as CSSProperties}
        >
          <div
            ref={listHeaderInnerRef}
            className="grid gap-0 text-xs font-semibold text-primary-foreground will-change-transform"
            style={{
              gridTemplateColumns: listGridTemplate,
              minWidth: listMinWidth ? `${listMinWidth}px` : undefined,
            }}
          >
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header, idx, arr) => {
              const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
              const alignClass = getAlignClass(meta?.align, idx === 0 ? 'left' : 'center');

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
                  {header.isPlaceholder ? null : (() => {
                    const headerContent = flexRender(header.column.columnDef.header, header.getContext());
                    const headerText = extractCellText(headerContent).trim();
                    return headerText ? (
                      <Tooltip>
                        <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{headerContent}</TooltipTrigger>
                        <TooltipContent className="max-w-80 whitespace-normal">{headerText}</TooltipContent>
                      </Tooltip>
                    ) : headerContent;
                  })()}
                  {idx < arr.length - 1 && (
                    <span className="absolute right-0 top-0 h-full border-r border-white/30" />
                  )}
                </div>
              );
            }),
          )}
          </div>
        </div>

      <div
        className="isolate overflow-x-auto"
        onScroll={(event) => {
          if (listHeaderInnerRef.current) {
            listHeaderInnerRef.current.style.transform = `translateX(-${event.currentTarget.scrollLeft}px)`;
          }
        }}
      >
        <div style={{ minWidth: listMinWidth ? `${listMinWidth}px` : undefined }}>
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
                    <div key={col.id} className={cn('relative flex items-center h-11 px-4 box-border', sIdx === 0 && 'pl-5', sIdx === visibleColumns.length - 1 && 'pr-5')}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    {sIdx < visibleColumns.length - 1 && (
                      <span className="absolute right-0 top-0 h-full border-r border-primary/15" />
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
                  'relative z-0 grid items-center gap-0 border-b border-border/40 bg-card transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted',
                  (enableRowSelection || onRowClick) && 'cursor-pointer',
                  (row.getIsSelected() || row.id === selectedRowId) && 'bg-primary/10',
                )}
                style={{ gridTemplateColumns: listGridTemplate }}
              >
                {row.getVisibleCells().map((cell, idx, arr) => {
                  const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const alignClass = getAlignClass(meta?.align, idx === 0 ? 'left' : 'center');
                  const list = meta?.list;
                  const value = flexRender(cell.column.columnDef.cell, cell.getContext());
                  const text = meta?.disableTooltip ? '' : extractCellText(value).trim();
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={cell.id}
                      className={cn(
                        'relative flex items-center min-w-0 h-11 px-4 box-border',
                        isFirst && 'pl-5',
                        idx === arr.length - 1 && 'pr-5',
                        alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start',
                        meta?.className,
                      )}
                    >
                      {text ? (
                        <Tooltip>
                          <TooltipTrigger render={<span className={cn('truncate text-sm', list?.valueClassName)} />}>{value}</TooltipTrigger>
                          <TooltipContent className="max-w-80 whitespace-normal">{text}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className={cn('truncate text-sm', list?.valueClassName)}>{value}</span>
                      )}
                      {idx < arr.length - 1 && (
                        <span className="absolute right-0 top-0 h-full border-r border-primary/15" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        </div>
      </div>
      {/* Pagination stays outside the horizontal scroller so it remains fully visible. */}
      {renderPagination()}
      </>
    );
  };

  return (
    <TooltipProvider delay={300}>
      <div className={cn('relative flex flex-col', className)}>
      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} className="absolute top-0 h-px w-full" aria-hidden="true" />

      {/* Unified container: toolbar + chips + table */}
      <div className="overflow-visible rounded-lg border border-primary shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
      {/* Toolbar */}
      {hasToolbar && (
        <div ref={toolbarRef} className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
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
          {filters && (
            <FilterDropdown activeCount={activeFilters?.length ?? 0} activeFilters={activeFilters} onClear={onClearFilters}>
              {filters}
              {showColumnVisibility && (
                <ColumnVisibilityDraftControl
                  value={visibleToggleableColumns.map((column) => column.id).join(',')}
                  onChange={applyColumnVisibility}
                  items={columnVisibilityItems.map(({ column, label }) => ({ id: column.id, label }))}
                />
              )}
            </FilterDropdown>
          )}
          <div className="ml-auto flex items-center gap-2">
            {!filters && showColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" />}>
                  <SlidersHorizontal className="size-4" /> Cột hiển thị
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Chọn cột hiển thị</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columnVisibilityItems.map(({ column, label }) => {
                      const visible = column.getIsVisible();
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={visible}
                          disabled={visible && visibleToggleableColumns.length === 1}
                          onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {toolbar}
          </div>
        </div>
      )}

      {/* Table */}
      {variant === 'list' ? renderList() : (
        <div>
          <div className={cn('overflow-visible', tableWrapperClassName)}>
          <Table className={tableClassName} containerClassName={cn('!overflow-visible', tableContainerClassName)}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} style={{ '--toolbar-height': `${toolbarHeight}px` } as CSSProperties} className="sticky top-[var(--toolbar-height)] z-20 border-border/40 bg-primary shadow-[0_2px_0_rgba(168,32,44,0.18)] hover:bg-transparent">
                  {headerGroup.headers.map((header, idx) => {
                    const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                    const alignClass = getAlignClass(meta?.align, idx === 0 ? 'left' : 'center');

                    return (
                      <TableHead key={header.id} className={cn('bg-primary text-primary-foreground', alignClass, meta?.className)}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-1.5',
                              header.column.getCanSort() && 'cursor-pointer select-none hover:text-white/75',
                              alignClass === 'text-right' && 'justify-end',
                              alignClass === 'text-center' && 'justify-center',
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {(() => {
                              const headerContent = flexRender(header.column.columnDef.header, header.getContext());
                              const headerText = extractCellText(headerContent).trim();
                              return headerText ? (
                                <Tooltip>
                                  <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{headerContent}</TooltipTrigger>
                                  <TooltipContent className="max-w-80 whitespace-normal">{headerText}</TooltipContent>
                                </Tooltip>
                              ) : headerContent;
                            })()}
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
                table.getRowModel().rows.map((row, index) => {
                  const selected = row.getIsSelected() || row.id === selectedRowId;
                  if (renderRow) {
                    return renderRow(row, {
                      selected,
                      index,
                      visibleColumnIds: table.getVisibleLeafColumns().map((column) => column.id),
                    });
                  }

                  return (
                    <TableRow
                      key={row.id}
                      data-state={selected ? 'selected' : undefined}
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
                      {row.getVisibleCells().map((cell, idx) => {
                        const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                        const alignClass = getAlignClass(meta?.align, idx === 0 ? 'left' : 'center');
                        const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                        const text = meta?.disableTooltip ? '' : extractCellText(content).trim();

                        return (
                          <TableCell key={cell.id} className={cn(alignClass, meta?.className)}>
                            {text ? (
                              <Tooltip>
                                <TooltipTrigger render={<span className="block" />}>{content}</TooltipTrigger>
                                <TooltipContent className="max-w-80 whitespace-normal">{text}</TooltipContent>
                              </Tooltip>
                            ) : content}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>

          {renderPagination()}
          {footer && (
            <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_16px_-12px_rgba(31,27,26,0.28)] backdrop-blur">
              {footer}
            </div>
          )}
        </div>
      )}
      </div>
      </div>
      </TooltipProvider>
  );
}
