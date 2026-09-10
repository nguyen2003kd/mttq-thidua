import { useEffect, useState, type FormEvent } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
import { FormDialog } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CriteriaTableAttachment, Locality, ScoreRecord } from '@/types/domain';

interface PublishResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locality?: Locality;
  record?: ScoreRecord;
  onPublish: (attachments: CriteriaTableAttachment[]) => void;
}
export function PublishResultModal({ open, onOpenChange, locality, record, onPublish }: PublishResultModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setError('');
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Vui lòng đính kèm Quyết định trước khi công bố.');
      return;
    }
    onPublish([{ id: `decision-${Date.now()}`, fileName: file.name, fileSize: file.size }]);
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Công bố kết quả"
      description={`Kết quả chính thức của ${locality?.name ?? 'địa phương'} sẽ được gửi về màn hình COL.01.03.`}
      onSubmit={submit}
      submitLabel="Công bố kết quả"
      cancelLabel="Đóng"
    >
      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Địa phương</p>
          <p className="mt-1 font-semibold">{locality?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Điểm chính thức</p>
          <p className="mt-1 text-xl font-bold text-primary">{record?.totalScore ?? 0}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="decision-file">Đính kèm Quyết định <span className="text-destructive">*</span></Label>
        <div className="rounded-lg border border-dashed p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            {file ? <FileCheck2 className="h-4 w-4 text-success" /> : <Upload className="h-4 w-4" />}
            <span>{file?.name ?? 'Chọn file quyết định đã ký'}</span>
          </div>
          <Input id="decision-file" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Sau khi công bố, hồ sơ chuyển sang trạng thái chỉ đọc và hiển thị cho địa phương.</p>
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
    </FormDialog>
  );
}
