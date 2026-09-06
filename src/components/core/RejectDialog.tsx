import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
            {localityName
              ? `Trả lại bảng điểm của ${localityName}. Vui lòng nhập lý do.`
              : 'Vui lòng nhập lý do trả lại.'}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Lý do trả lại</Label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do trả lại"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            action="reject"
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
