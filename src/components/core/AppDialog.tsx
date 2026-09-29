import type { ReactNode } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  /** Lớp max-w-* cho DialogContent (cần kèm bản sm: để đè default sm:max-w-sm). */
  size?: string;
  /** Lớp chiều cao của modal. */
  height?: string;
  children: ReactNode;
  /** Actions bên phải footer (bên trái luôn có nút Đóng). */
  footerActions?: ReactNode;
  closeLabel?: string;
  /** Ẩn toàn bộ footer (nút Đóng + actions). */
  hideFooter?: boolean;
}

/**
 * Modal dùng chung toàn app: header trắng (tiêu đề H2 + nút X, Archetype 3),
 * body trắng scroll, footer căn phải với nút Đóng (primary) cuối cùng bên phải — đồng bộ với DetailDialog.
 */
export function AppDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  size = 'max-w-2xl sm:max-w-2xl',
  height = 'h-[80vh] max-h-[80vh]',
  children,
  footerActions,
  closeLabel = 'Đóng',
  hideFooter = false,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50" />
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex flex-col gap-0 overflow-hidden rounded-lg border-0 p-0 will-change-auto',
          height,
          size,
        )}
      >
        {/* Header - nền trắng, tiêu đề H2 + nút X (Archetype 3) */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-6 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <DialogClose
            render={
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              />
            }
          >
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        {/* Body - nền trắng, scroll */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-white px-6 py-5">
          {children}
        </div>

        {/* Footer - tất cả nút căn phải: actions trước, Đóng cuối cùng bên phải */}
        {!hideFooter && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/40 bg-muted/30 px-6 py-3">
            {footerActions && <div className="flex items-center gap-2">{footerActions}</div>}
            <DialogClose
              render={
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                />
              }
            >
              {closeLabel}
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
