import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, FormDialog } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatVietnamDeadline, parseVietnamDateTime, toVietnamDateTimeInput, toVietnamOffsetDateTime } from '@/lib/vietnamDateTime';

export interface DeadlineExtensionGrant {
  extendedDeadline: string;
  reason?: string | null;
}

interface DeadlineExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName: string;
  groupName: string;
  groupDeadline?: string | null;
  currentGrant?: DeadlineExtensionGrant | null;
  onSubmit: (values: { extendedDeadline: string; reason: string }) => Promise<boolean>;
  onRevoke?: () => Promise<boolean>;
}

const toLocalInputValue = toVietnamDateTimeInput;


/** Dialog gia hạn nộp hồ sơ cho một địa phương trên một nhóm tiêu chí. */
export function DeadlineExtensionDialog({
  open,
  onOpenChange,
  localityName,
  groupName,
  groupDeadline,
  currentGrant,
  onSubmit,
  onRevoke,
}: DeadlineExtensionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setDeadline(toLocalInputValue(currentGrant?.extendedDeadline));
    setReason(currentGrant?.reason ?? '');
  }, [open, currentGrant]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const deadlineMs = parseVietnamDateTime(deadline);
    if (!Number.isFinite(deadlineMs)) return;
    setSubmitting(true);
    try {
      const success = await onSubmit({ extendedDeadline: toVietnamOffsetDateTime(deadline)!, reason: reason.trim() });
      if (success) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Gia hạn nộp cho địa phương"
      description={`${localityName} · ${groupName}${groupDeadline ? ` · Hạn gốc: ${formatVietnamDeadline(groupDeadline)}` : ' · Chưa có hạn nộp'}`}
      onSubmit={(event) => { void handleSubmit(event); }}
      submitLabel={submitting ? 'Đang lưu…' : 'Lưu gia hạn'}
      cancelLabel="Đóng"
      submitDisabled={submitting || !deadline}
    >
      {currentGrant && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm">
          <span className="min-w-0">Đang gia hạn đến <strong>{formatVietnamDeadline(currentGrant.extendedDeadline)}</strong></span>
          {onRevoke && (
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:bg-destructive/10" disabled={revoking}
              onClick={() => {
                setRevoking(true);
                void onRevoke().then((success) => { if (success) onOpenChange(false); }).finally(() => setRevoking(false));
              }}
            ><Trash2 className="size-4" />Thu hồi</Button>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="deadline-ext-date">Hạn nộp mới <span className="text-destructive">★</span></Label>
        <Input id="deadline-ext-date" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deadline-ext-reason">Lý do gia hạn</Label>
        <Textarea id="deadline-ext-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Địa phương gặp sự cố chưa kịp nộp hồ sơ" />
      </div>
    </FormDialog>
  );
}
