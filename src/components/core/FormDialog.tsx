import type { FormEvent, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import type { Action } from '@/lib/rbac';

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Caller lo validate + gọi mutation; nên tự đóng dialog khi thành công. */
  onSubmit: (e: FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  /** RBAC cho nút submit. */
  submitAction?: Action;
  /** Lớp max-w-* cho DialogContent. */
  size?: string;
  children: ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = 'Lưu',
  cancelLabel = 'Hủy',
  submitDisabled,
  submitAction,
  size = 'max-w-lg sm:max-w-lg',
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0', size)}>
        <DialogHeader className="border-b bg-muted/25 px-6 py-5 pr-12">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="max-h-[calc(100dvh-13rem)] space-y-5 overflow-y-auto px-6 py-5">
            {children}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button type="submit" action={submitAction} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
