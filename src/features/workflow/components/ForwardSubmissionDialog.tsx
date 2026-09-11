import { useEffect, useState, type FormEvent } from 'react';
import { FormDialog, FileUpload } from '@/components/core';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface ForwardSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: { file: File | null; description: string }) => void;
}

export function ForwardSubmissionDialog({ open, onOpenChange, onConfirm }: ForwardSubmissionDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setFile(null); setDescription(''); setError(''); } }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (file && file.size > MAX_FILE_SIZE) { setError('Tệp hồ sơ không được vượt quá 20MB.'); return; }
    onConfirm({ file, description: description.trim() });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Gửi yêu cầu" description="Chuyển hồ sơ đã thẩm định lên Lãnh đạo ban." onSubmit={submit} submitLabel="Gửi yêu cầu" cancelLabel="Đóng">
      <div className="space-y-1.5">
        <Label>Đính kèm file hồ sơ</Label>
        <FileUpload value={file ? [file] : []} onChange={(files) => setFile(files[0] ?? null)} multiple={false} error={error} />
      </div>
      <div className="space-y-1.5"><Label htmlFor="forward-description">Diễn giải hồ sơ</Label><Textarea id="forward-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Nhập thông tin cần lưu ý khi chuyển hồ sơ" /></div>
    </FormDialog>
  );
}
