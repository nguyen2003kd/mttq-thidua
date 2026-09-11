import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface FilterDropdownProps {
  /** Nội dung filter: các FilterSelect (giá trị chỉ áp dụng khi bấm Xác nhận) */
  children: ReactNode;
  /** Số filter đang bật — >0 sẽ hiện badge trên nút */
  activeCount?: number;
  /** Chip tóm tắt filter đang bật, hiện trong đầu dropdown */
  activeFilters?: { label: string; value: string; onClear: () => void }[];
  label?: string;
  /** Gọi khi bấm Xóa lọc — ẩn nút nếu không truyền */
  onClear?: () => void;
  className?: string;
}

type FilterControlElement = ReactElement<{ value: string; onChange: (value: string) => void }>;

const isFilterControl = (node: ReactNode): node is FilterControlElement =>
  isValidElement(node)
  && typeof (node.props as { value?: unknown }).value === 'string'
  && typeof (node.props as { onChange?: unknown }).onChange === 'function';

/** Làm phẳng đệ quy children — đi vào cả Fragment để bắt được mọi FilterSelect. */
function flattenFilterChildren(nodes: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.forEach(nodes, (child) => {
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...flattenFilterChildren((child.props as { children?: ReactNode }).children));
    } else {
      out.push(child);
    }
  });
  return out;
}

/**
 * Nút "Bộ lọc" mở dropdown chứa các filter của bảng.
 * Giá trị chọn trong dropdown là bản nháp — chỉ áp dụng khi bấm "Xác nhận" (dropdown tự đóng).
 * "Xóa lọc" đặt lại toàn bộ filter. Đóng khi bấm ra ngoài hoặc nhấn Escape (bỏ thay đổi chưa xác nhận).
 */
export function FilterDropdown({ children, activeCount = 0, activeFilters, label = 'Bộ lọc', onClear, className }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  /** Giá trị nháp theo chỉ số child — chưa áp dụng lên filter thật */
  const [draft, setDraft] = useState<Record<string, string>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target;
      if (rootRef.current && target instanceof Element && !rootRef.current.contains(target) && !target.closest('[data-radix-popper-content-wrapper], [role="listbox"], [role="dialog"]')) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      // Mở dropdown: chụp giá trị hiện tại của các filter làm bản nháp
      const snapshot: Record<string, string> = {};
      flattenFilterChildren(children).forEach((child, index) => {
        if (isFilterControl(child)) snapshot[String(index)] = child.props.value;
      });
      setDraft(snapshot);
    }
    setOpen((v) => !v);
  };

  const confirm = () => {
    flattenFilterChildren(children).forEach((child, index) => {
      if (!isFilterControl(child)) return;
      const next = draft[String(index)];
      if (next !== undefined && next !== child.props.value) child.props.onChange(next);
    });
    setOpen(false);
  };

  const clearAll = () => {
    flattenFilterChildren(children).forEach((child) => {
      if (isFilterControl(child) && child.props.value !== '') child.props.onChange('');
    });
    onClear?.();
    setOpen(false);
  };

  /** Bỏ 1 filter qua chip: gọi onClear của chip + đồng bộ draft để Xác nhận không áp lại. */
  const removeFilter = (chipLabel: string) => {
    flattenFilterChildren(children).forEach((child, index) => {
      if (!isFilterControl(child)) return;
      if ((child.props as { label?: string }).label === chipLabel) {
        setDraft((prev) => ({ ...prev, [String(index)]: '' }));
      }
    });
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          '!h-9 gap-1.5 rounded-lg border px-2.5 text-[13px] font-normal',
          activeCount > 0
            ? 'border-primary/50 bg-primary/[0.06] text-primary'
            : 'border-input bg-card hover:border-muted-foreground/55',
        )}
        onClick={toggle}
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {label}
        {activeCount > 0 && (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>
      {open && (
        <div className={cn('absolute left-0 top-full z-30 mt-1.5 w-64 rounded-lg border border-border bg-card p-3 shadow-md', className)}>
          {activeFilters && activeFilters.length > 0 && (
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5 border-b border-border pb-2.5">
              {activeFilters.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/10 pl-2 pr-1 text-xs font-medium text-primary"
                >
                  <span className="font-normal text-primary/80">{f.label}:</span>
                  {f.value}
                  <button
                    type="button"
                    onClick={() => { removeFilter(f.label); f.onClear(); }}
                    aria-label={`Bỏ lọc ${f.label}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 transition-colors hover:bg-primary/30"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col items-stretch gap-2.5 [&>*]:w-full">
            {flattenFilterChildren(children).map((child, index) => {
              if (!isFilterControl(child)) return child;
              const key = String(index);
              return cloneElement(child, {
                value: draft[key] ?? child.props.value,
                onChange: (value: string) => setDraft((prev) => ({ ...prev, [key]: value })),
              });
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!h-8 border-primary/50 bg-primary/[0.06] px-2 text-[13px] text-primary hover:bg-primary/10 hover:text-primary"
              disabled={!onClear}
              onClick={clearAll}
            >
              Xóa lọc
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirm}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
