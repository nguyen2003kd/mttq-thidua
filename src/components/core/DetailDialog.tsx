import { Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { AppDialog } from './AppDialog';
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
    <>
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        subtitle={subtitle}
        size={maxWidth ? `${maxWidth} ${maxWidth.replace('max-w-', 'sm:max-w-')}` : undefined}
        closeLabel={closeLabel}
        footerActions={(
          <>
            {onDelete && (
              <button type="button" onClick={handleDeleteClick} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                <Trash2 className="h-3.5 w-3.5" />
                {deleteLabel}
              </button>
            )}
            {onEdit && (
              <button type="button" onClick={onEdit} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/80">
                <Pencil className="h-3.5 w-3.5" />
                {editLabel}
              </button>
            )}
          </>
        )}
      >
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
      </AppDialog>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa "${subtitle}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
