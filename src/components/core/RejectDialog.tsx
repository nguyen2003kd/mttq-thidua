import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './Button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Action } from '@/lib/rbac';
import type { ScoreState, Scope } from '@/types/rbac';

export interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tên địa phương — hiển thị trong mô tả. */
  localityName?: string;
  /** RBAC cho nút xác nhận. */
  state?: ScoreState;
  scope?: Scope;
  /** Gọi với lý do đã trim khi người dùng xác nhận. */
  onConfirm: (reason: string) => void;
  title?: string;
  confirmLabel?: string;
  /** Mô tả riêng cho các luồng không phải "trả lại" (ví dụ: nhận xét). */
  description?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Mặc định dùng quyền `reject`; nhận xét có thể tái dùng quyền duyệt. */
  submitAction?: Action;
  confirmVariant?: 'default' | 'destructive';
}

export function RejectDialog({
  open,
  onOpenChange,
  localityName,
  state,
  scope,
  onConfirm,
  title = 'Trả lại hồ sơ',
  confirmLabel = 'Trả lại',
  description,
  reasonLabel = 'Lý do trả lại',
  reasonPlaceholder = 'Nhập lý do trả lại',
  submitAction = 'reject',
  confirmVariant = 'destructive',
}: RejectDialogProps) {
  const [reason, setReason] = useState('');

  const close = () => {
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {description ?? (localityName
              ? `Trả lại bảng điểm của ${localityName}. Vui lòng nhập lý do.`
              : 'Vui lòng nhập lý do trả lại.')}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">{reasonLabel} <span className="text-destructive">*</span></Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              autoComplete="off"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button
            variant={confirmVariant}
            action={submitAction}
            state={state}
            scope={scope}
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
