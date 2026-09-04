import { useState, useMemo, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ListDialogItem {
  id: string;
  label: string;
  description?: string;
  badge?: ReactNode;
}

export interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  items: ListDialogItem[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Số lượng item tối đa hiển thị trước khi cuộn */
  maxItemsVisible?: number;
  /** Nội dung footer (vd: nút hành động) */
  footer?: ReactNode;
  /** Render tùy chỉnh cho mỗi item */
  renderItem?: (item: ListDialogItem) => ReactNode;
  className?: string;
}

export function ListDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  searchable = true,
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không có mục nào.',
  maxItemsVisible = 8,
  footer,
  renderItem,
  className,
}: ListDialogProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-lg p-0 gap-0', className)}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {searchable && (
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-lg border-border/60 bg-card pl-9 pr-8 text-[13px] focus-visible:border-ring"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-1.5 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div
          className="overflow-y-auto px-2 py-1"
          style={{ maxHeight: `${maxItemsVisible * 3.25}rem` }}
        >
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((item) =>
                renderItem ? (
                  renderItem(item)
                ) : (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      {item.description && (
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    {item.badge}
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {footer && (
          <div className="border-t bg-muted/50 px-5 py-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
