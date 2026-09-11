import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogOverlay,
} from '@/components/ui/dialog';
import { X, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { cn } from '@/lib/utils';

export interface DetailDialogItem {
  label: string;
  value: React.ReactNode;
}

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  items: DetailDialogItem[];
  maxWidth?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  closeLabel?: string;
  deleteLabel?: string;
  editLabel?: string;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  items,
  maxWidth = 'max-w-2xl',
  onDelete,
  onEdit,
  closeLabel = 'Đóng',
  deleteLabel = 'Xóa',
  editLabel = 'Sửa',
}: DetailDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    setConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-[#1F1B1A]/50 backdrop-blur-sm" />
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex flex-col p-0 gap-0 !w-[50vw] h-[80vh] max-h-[80vh] !max-w-none rounded-lg border-0 overflow-hidden',
          maxWidth,
        )}
      >
        {/* Header - red background */}
        <div className="flex items-center justify-between bg-destructive px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-white/80">{subtitle}</p>
            )}
          </div>
          <DialogClose
            render={
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
              />
            }
          >
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        {/* Body - white background */}
        <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex justify-between gap-4',
                  idx < items.length - 1 && 'border-b border-border/40 pb-3',
                )}
              >
                <span className="text-sm text-muted-foreground whitespace-nowrap">{item.label}</span>
                <span className="text-sm font-medium text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-muted/30 px-6 py-3">
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
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleteLabel}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/80"
              >
                <Pencil className="h-3.5 w-3.5" />
                {editLabel}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa "${subtitle}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </Dialog>
  );
}
