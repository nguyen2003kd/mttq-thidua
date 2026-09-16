import { useState, type FormEvent } from 'react';
import { FileCheck2 } from 'lucide-react';
import { FormDialog, TruncatedText } from '@/components/core';

interface ForwardSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName?: string;
  groupName?: string;
  onConfirm: () => void | Promise<void>;
}

export function ForwardSubmissionDialog({ open, onOpenChange, localityName, groupName, onConfirm }: ForwardSubmissionDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Lỗi đã được toast ở caller — giữ dialog mở
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xác nhận chuyển hồ sơ"
      description="Chuyển hồ sơ đã thẩm định lên Lãnh đạo ban."
      onSubmit={submit}
      submitLabel={submitting ? 'Đang xử lý…' : 'Xác nhận'}
      submitDisabled={submitting}
      cancelLabel="Đóng"
    >
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileCheck2 className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold leading-5 text-foreground">Hồ sơ đã hoàn tất thẩm định</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Sau khi xác nhận, kết quả chấm điểm sẽ được chuyển lên Lãnh đạo ban để phê duyệt. Bạn sẽ không thể chỉnh sửa điểm sau bước này.
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Địa phương</dt>
          <TruncatedText as="dd" value={localityName} className="mt-1 font-semibold text-foreground" />
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Nhóm tiêu chí</dt>
          <TruncatedText as="dd" value={groupName} className="mt-1 font-semibold text-foreground" />
        </div>
      </dl>
    </FormDialog>
  );
}
