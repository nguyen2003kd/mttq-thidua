import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, FileText, X } from 'lucide-react';
import { z } from 'zod';
import { Button, FileUpload, FormDialog } from '@/components/core';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const revisionSchema = z.object({
  criteriaIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một tiêu chí cần chỉnh sửa.'),
  reason: z.string().trim().min(1, 'Vui lòng nhập nội dung yêu cầu chỉnh sửa.'),
  file: z.instanceof(File).nullable()
    .refine((file) => !file || file.size > 0, 'Tệp đính kèm đang rỗng. Vui lòng chọn tệp khác.')
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File đính kèm không được vượt quá 20MB.'),
});

type RevisionForm = z.infer<typeof revisionSchema>;

export interface RevisionRequestCriterion {
  id: string;
  code?: string;
  title: string;
}

interface RevisionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  localityName: string;
  criteria: RevisionRequestCriterion[];
  defaultSelectedCriteriaIds?: string[];
  defaultReason?: string;
  inheritedFile?: { id: string; name: string; sizeBytes: number } | null;
  onPreviewInheritedFile?: () => void;
  onSubmit: (values: { criteriaIds: string[]; reason: string; file: File | null; inheritedFileId: string | null }) => Promise<boolean>;
}

/** Dialog chọn nhiều tiêu chí để yêu cầu chỉnh sửa, dùng chung cho các cấp duyệt. */
export function RevisionRequestDialog({
  open,
  onOpenChange,
  title = 'Yêu cầu chỉnh sửa',
  description,
  localityName,
  criteria,
  defaultSelectedCriteriaIds,
  defaultReason,
  inheritedFile,
  onPreviewInheritedFile,
  onSubmit,
}: RevisionRequestDialogProps) {
  const form = useForm<RevisionForm>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { criteriaIds: [], reason: '', file: null },
  });
  const [submitting, setSubmitting] = useState(false);
  const [inheritedFileSelected, setInheritedFileSelected] = useState(true);
  const selectedFile = form.watch('file');
  const selectedCriteriaIds = form.watch('criteriaIds') ?? [];
  const reasonEdited = Boolean(form.formState.dirtyFields.reason);
  const criteriaRef = useRef(criteria);
  criteriaRef.current = criteria;
  const defaultSelectedCriteriaIdsRef = useRef(defaultSelectedCriteriaIds);
  defaultSelectedCriteriaIdsRef.current = defaultSelectedCriteriaIds;
  const defaultReasonRef = useRef(defaultReason);
  defaultReasonRef.current = defaultReason;

  useEffect(() => {
    if (!open) return;
    const validIds = (defaultSelectedCriteriaIdsRef.current ?? []).filter((id) =>
      criteriaRef.current.some((criterion) => criterion.id === id),
    );
    setInheritedFileSelected(true);
    form.reset({ criteriaIds: validIds, reason: defaultReasonRef.current ?? '', file: null });
  }, [form, open]);

  useEffect(() => {
    if (open && !reasonEdited) {
      form.setValue('reason', defaultReason ?? '');
    }
  }, [defaultReason, form, open, reasonEdited]);

  const toggleCriteria = (id: string, checked: boolean) => {
    const current = form.getValues('criteriaIds') ?? [];
    const next = checked
      ? Array.from(new Set([...current, id]))
      : current.filter((value) => value !== id);
    form.setValue('criteriaIds', next, { shouldValidate: true });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description ?? `Yêu cầu ${localityName} bổ sung/chỉnh sửa các tiêu chí đã chọn.`}
      onSubmit={form.handleSubmit(async (values) => {
        setSubmitting(true);
        try {
          const success = await onSubmit({
            ...values,
            inheritedFileId: !values.file && inheritedFileSelected ? inheritedFile?.id ?? null : null,
          });
          if (success) onOpenChange(false);
        } finally {
          setSubmitting(false);
        }
      })}
      submitLabel={submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
      cancelLabel="Đóng"
      submitDisabled={submitting || selectedCriteriaIds.length === 0}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Tiêu chí cần chỉnh sửa <span className="text-destructive">★</span></Label>
          <span className="text-xs font-medium text-muted-foreground">Đã chọn {selectedCriteriaIds.length}/{criteria.length}</span>
        </div>
        {criteria.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            Không có tiêu chí con nào để yêu cầu chỉnh sửa.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border bg-background p-2">
            {criteria.map((criterion) => {
              const checked = selectedCriteriaIds.includes(criterion.id);
              return (
                <label
                  key={criterion.id}
                  htmlFor={`revision-criterion-${criterion.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <Checkbox
                    id={`revision-criterion-${criterion.id}`}
                    checked={checked}
                    onCheckedChange={(value) => toggleCriteria(criterion.id, !!value)}
                  />
                  <span className="min-w-0 flex-1 text-sm leading-6">
                    {criterion.code && <span className="font-semibold">{criterion.code}</span>}
                    <span className={criterion.code ? 'ml-2' : undefined}>{criterion.title}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {form.formState.errors.criteriaIds && <p className="text-xs text-destructive">{form.formState.errors.criteriaIds.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="revision-reason">Nội dung yêu cầu chỉnh sửa <span className="text-destructive">★</span></Label>
        <Textarea id="revision-reason" rows={4} {...form.register('reason')} placeholder="Ví dụ: Minh chứng chưa rõ nét, đề nghị bổ sung ảnh chụp thực tế" />
        {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>File đính kèm</Label>
        {inheritedFile && inheritedFileSelected && !selectedFile && (
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{inheritedFile.name}</p>
              <p className="text-xs text-muted-foreground">Tệp từ yêu cầu trước · {inheritedFile.sizeBytes > 0 ? `${Math.ceil(inheritedFile.sizeBytes / 1024)} KB` : 'Chưa rõ dung lượng'}</p>
            </div>
            {onPreviewInheritedFile && <Button type="button" variant="outline" size="sm" onClick={onPreviewInheritedFile}><Eye className="size-4" />Xem</Button>}
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Bỏ tệp ${inheritedFile.name}`} onClick={() => setInheritedFileSelected(false)}><X className="size-4" /></Button>
          </div>
        )}
        <FileUpload
          value={selectedFile ? [selectedFile] : []}
          onChange={(files) => form.setValue('file', files[0] ?? null, { shouldValidate: true })}
          multiple={false}
          maxSizeMb={20}
          error={form.formState.errors.file?.message}
        />
        {inheritedFile && inheritedFileSelected && !selectedFile && <p className="text-xs text-muted-foreground">Hệ thống sẽ kiểm tra và gửi kèm tệp cũ; chọn tệp mới để thay thế.</p>}
      </div>
    </FormDialog>
  );
}
