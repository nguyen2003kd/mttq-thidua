import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FileUpload, FormDialog } from '@/components/core';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const revisionSchema = z.object({
  criteriaIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một tiêu chí cần chỉnh sửa.'),
  reason: z.string().trim().min(1, 'Vui lòng nhập nội dung yêu cầu chỉnh sửa.'),
  file: z.instanceof(File).nullable().refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File đính kèm không được vượt quá 20MB.'),
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
  onSubmit: (values: { criteriaIds: string[]; reason: string; file: File | null }) => Promise<boolean>;
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
  onSubmit,
}: RevisionRequestDialogProps) {
  const form = useForm<RevisionForm>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { criteriaIds: [], reason: '', file: null },
  });
  const [submitting, setSubmitting] = useState(false);
  const selectedFile = form.watch('file');
  const selectedCriteriaIds = form.watch('criteriaIds') ?? [];
  const criteriaRef = useRef(criteria);
  criteriaRef.current = criteria;
  const defaultSelectedCriteriaIdsRef = useRef(defaultSelectedCriteriaIds);
  defaultSelectedCriteriaIdsRef.current = defaultSelectedCriteriaIds;

  useEffect(() => {
    if (!open) return;
    const validIds = (defaultSelectedCriteriaIdsRef.current ?? []).filter((id) =>
      criteriaRef.current.some((criterion) => criterion.id === id),
    );
    form.reset({ criteriaIds: validIds, reason: '', file: null });
  }, [form, open]);

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
        const success = await onSubmit(values);
        setSubmitting(false);
        if (success) onOpenChange(false);
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
        <FileUpload
          value={selectedFile ? [selectedFile] : []}
          onChange={(files) => form.setValue('file', files[0] ?? null, { shouldValidate: true })}
          multiple={false}
          maxSizeMb={20}
          error={form.formState.errors.file?.message}
        />
      </div>
    </FormDialog>
  );
}
