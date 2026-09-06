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
  size = 'max-w-lg',
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(size)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
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
