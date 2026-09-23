import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

import type { Action } from '@/lib/rbac';
import type { ScoreState, Scope } from '@/types/rbac';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  /** RBAC action for confirm button */
  action?: Action;
  state?: ScoreState;
  scope?: Scope;
  /** 2-step: yêu cầu nhập keyword để xác nhận */
  confirmKeyword?: string;
  confirmKeywordHint?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
  action,
  state,
  scope,
  confirmKeyword,
  confirmKeywordHint,
}: ConfirmDialogProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const isTwoStep = !!confirmKeyword;
  const keywordMatch = !isTwoStep || keywordInput.trim() === confirmKeyword;

  const handleConfirm = () => {
    if (keywordMatch) {
      onConfirm();
      setKeywordInput('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setKeywordInput(''); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {variant === 'destructive' && (
              <div className="shrink-0 rounded-lg bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            )}
            <div className="space-y-1.5">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isTwoStep && (
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-keyword">
              {confirmKeywordHint || `Nhập "${confirmKeyword}" để xác nhận`}
            </Label>
            <Input
              id="confirm-keyword"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder={confirmKeyword}
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!keywordMatch}
            action={action}
            state={state}
            scope={scope}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
