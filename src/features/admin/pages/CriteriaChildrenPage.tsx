import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft, Eye, FilePlus2, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DataTable, EmptyState, FileAttachmentList, FileUpload, FilterSelect, FormDialog, PageHeader, PageLoading } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { useFileUpload } from '@/hooks/useFileUpload';
import { formatDate } from '@/lib/utils';
import { criteriaGroupsApi, getCriteriaApiError, type CriteriaApi } from '@/features/admin/api/criteriaGroupsApi';
import { validateCriteriaApplication } from '@/features/admin/criteriaValidation';
import type { CriteriaItem } from '@/types/domain';

const toItem = (criterion: CriteriaApi, order: number): CriteriaItem => ({
  id: criterion.id, type: criterion.type, name: criterion.content, maxScore: criterion.maxPoint, bonusScore: criterion.maxBonusPoint,
  deadline: criterion.deadline ?? undefined, note: criterion.note ?? undefined, order, status: criterion.status,
});

const MAX_SUPPLEMENTARY_FILE_SIZE = 20 * 1024 * 1024;
const supplementaryCriteriaSchema = z.object({
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung tiêu chí bổ sung.'),
  deadline: z.string(),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do thêm tiêu chí bổ sung.'),
  files: z
    .array(z.instanceof(File))
    .min(1, 'Vui lòng đính kèm ít nhất một file.')
    .refine(
      (files) => files.every((file) => file.size <= MAX_SUPPLEMENTARY_FILE_SIZE),
      'Mỗi file đính kèm không được vượt quá 20MB.',
    ),
});
type SupplementaryCriteriaForm = z.infer<typeof supplementaryCriteriaSchema>;

interface EditorProps {
  open: boolean; onOpenChange: (open: boolean) => void; item: CriteriaItem | null; readonly?: boolean;
  onSave: (value: Omit<CriteriaItem, 'id' | 'order' | 'updatedAt'>) => void; saving: boolean;
}

function CriteriaItemDialog({ open, onOpenChange, item, readonly = false, onSave, saving }: EditorProps) {
  const [name, setName] = useState(''); const [score, setScore] = useState(''); const [bonus, setBonus] = useState('0');
  const [deadline, setDeadline] = useState(''); const [note, setNote] = useState(''); const [error, setError] = useState('');
  useEffect(() => { if (!open) return; setName(item?.name ?? ''); setScore(item?.maxScore?.toString() ?? ''); setBonus(item?.bonusScore?.toString() ?? '0'); setDeadline(item?.deadline?.slice(0, 16) ?? ''); setNote(item?.note ?? ''); setError(''); }, [open, item]);
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (readonly) return onOpenChange(false);
    const maxScore = Number(score); const bonusScore = Number(bonus || 0);
    if (!name.trim()) return setError('Nội dung tiêu chí là bắt buộc.');
    if (!Number.isFinite(maxScore) || maxScore <= 0) return setError('Điểm chuẩn phải lớn hơn 0.');
    if (!Number.isFinite(bonusScore) || bonusScore < 0) return setError('Điểm thưởng tối đa không hợp lệ.');
    onSave({ name: name.trim(), maxScore, bonusScore, deadline: deadline || undefined, note: note.trim() || undefined });
  };
  return <FormDialog open={open} onOpenChange={onOpenChange} title={readonly ? 'Xem tiêu chí con' : item ? 'Sửa tiêu chí con' : 'Thêm mới tiêu chí con'} description="Nhập thông tin tiêu chí con." onSubmit={submit} submitLabel={readonly ? 'Đóng' : 'Lưu'} cancelLabel="Đóng" submitDisabled={saving}>
    <div className="space-y-1.5"><Label htmlFor="child-name">Nội dung <span className="text-destructive">★</span></Label><Input id="child-name" value={name} onChange={(event) => setName(event.target.value)} disabled={readonly || saving} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="child-score">Điểm chuẩn <span className="text-destructive">★</span></Label><Input id="child-score" type="number" min={0} step="0.25" value={score} onChange={(event) => setScore(event.target.value)} disabled={readonly || saving} /></div><div className="space-y-1.5"><Label htmlFor="child-bonus">Điểm thưởng tối đa</Label><Input id="child-bonus" type="number" min={0} step="0.25" value={bonus} onChange={(event) => setBonus(event.target.value)} disabled={readonly || saving} /></div></div>
    <div className="space-y-1.5"><Label htmlFor="child-deadline">Hạn nộp</Label><Input id="child-deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} disabled={readonly || saving} /></div>
    <div className="space-y-1.5"><Label htmlFor="child-note">Ghi chú</Label><Textarea id="child-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} disabled={readonly || saving} /></div>
    {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="size-4 shrink-0" />{error}</p>}
  </FormDialog>;
}

function SupplementaryCriteriaDialog({
  open,
  onOpenChange,
  onSave,
  saving,
  uploadProgress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: SupplementaryCriteriaForm) => Promise<void>;
  saving: boolean;
  uploadProgress: Record<string, number>;
}) {
  const form = useForm<SupplementaryCriteriaForm>({
    resolver: zodResolver(supplementaryCriteriaSchema),
    defaultValues: { content: '', deadline: '', reason: '', files: [] },
  });
  const files = form.watch('files');

  useEffect(() => {
    if (open) form.reset({ content: '', deadline: '', reason: '', files: [] });
  }, [form, open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm tiêu chí bổ sung"
      description="Yêu cầu địa phương bổ sung nội dung hoặc minh chứng mà không làm thay đổi tổng điểm nhóm."
      onSubmit={form.handleSubmit((value) => void onSave(value))}
      submitLabel="Thêm và gửi địa phương"
      cancelLabel="Đóng"
      submitDisabled={saving}
      size="max-w-6xl"
    >
      <div className="flex items-start gap-3 rounded-md border border-accent/50 bg-accent/10 px-3 py-2.5">
        <FilePlus2 className="mt-0.5 size-4 shrink-0 text-foreground" />
        <div className="min-w-0">
          <Badge className="bg-accent text-foreground">Tiêu chí bổ sung</Badge>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Tiêu chí này không có điểm và không được cộng vào tổng điểm nhóm.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="supplementary-content">Nội dung <span className="text-destructive">★</span></Label>
        <Textarea id="supplementary-content" rows={3} placeholder="Nhập nội dung cần địa phương bổ sung" {...form.register('content')} />
        {form.formState.errors.content && <p role="alert" className="text-xs font-medium text-destructive">{form.formState.errors.content.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="supplementary-deadline">Hạn nộp</Label>
        <Input id="supplementary-deadline" type="datetime-local" {...form.register('deadline')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="supplementary-reason">Lý do thêm tiêu chí bổ sung <span className="text-destructive">★</span></Label>
        <Textarea id="supplementary-reason" rows={3} placeholder="Nêu rõ lý do yêu cầu địa phương bổ sung" {...form.register('reason')} />
        {form.formState.errors.reason && <p role="alert" className="text-xs font-medium text-destructive">{form.formState.errors.reason.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>File đính kèm <span className="text-destructive">★</span></Label>
        <FileUpload
          value={files}
          onChange={(value) => form.setValue('files', value, { shouldDirty: true, shouldValidate: true })}
          maxSizeMb={20}
          maxFiles={10}
          uploading={saving}
          uploadProgress={uploadProgress}
          error={form.formState.errors.files?.message}
        />
      </div>
    </FormDialog>
  );
}

export default function CriteriaChildrenPage() {
  const { id } = useParams<{ id: string }>(); const queryClient = useQueryClient();
  const [search, setSearch] = useState(''); const [type, setType] = useState<CriteriaApi['type'] | ''>(''); const [sort, setSort] = useState('createdAt-desc'); const [selected, setSelected] = useState<CriteriaItem | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const [editor, setEditor] = useState<{ item: CriteriaItem | null; readonly: boolean } | null>(null);
  const [applyOpen, setApplyOpen] = useState(false); const [supplementaryOpen, setSupplementaryOpen] = useState(false); const [saving, setSaving] = useState(false);
  const { uploading, uploadProgress, uploadFiles } = useFileUpload();
  const { data: group, isLoading, error } = useQuery({ queryKey: ['criteria-group', id], queryFn: () => criteriaGroupsApi.get(id!), enabled: Boolean(id) });
  const [sortBy, sortOrder] = sort.split('-') as ['createdAt' | 'content' | 'maxPoint' | 'deadline', 'asc' | 'desc'];
  const { data: criteriaPage, isLoading: isLoadingCriteria } = useQuery({
    queryKey: ['criteria', id, { search: debouncedSearch, type, sortBy, sortOrder }],
    queryFn: () => criteriaGroupsApi.listCriteria(id!, { search: debouncedSearch || undefined, type: type || undefined, sortBy, sortOrder, page: 1, pageSize: 100 }),
    enabled: Boolean(id),
  });
  const groupCriteria = useMemo(() => group?.criteria.map(toItem) ?? [], [group]);
  const criteria = useMemo(() => criteriaPage?.items.map(toItem) ?? [], [criteriaPage]);
  const columns = useMemo<ColumnDef<CriteriaItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nội dung tiêu chí con',
      cell: ({ row }) => <p className="truncate font-medium" title={row.original.name}>{row.original.name}</p>,
      meta: { list: { width: 'minmax(300px,2fr)' } },
    },
    {
      accessorKey: 'maxScore',
      header: 'Điểm chuẩn',
      cell: ({ row }) => row.original.type === 'Supplementary' ? '—' : row.original.maxScore,
      meta: { align: 'right', list: { width: 'minmax(110px,0.7fr)' } },
    },
    {
      accessorKey: 'bonusScore',
      header: 'Điểm thưởng tối đa',
      cell: ({ row }) => row.original.type === 'Supplementary' ? '—' : row.original.bonusScore ?? 0,
      meta: { align: 'right', list: { width: 'minmax(145px,0.85fr)' } },
    },
    {
      accessorKey: 'type',
      header: 'Loại tiêu chí',
      cell: ({ row }) => row.original.type === 'Supplementary'
        ? <Badge className="bg-accent/20 text-foreground">Tiêu chí bổ sung</Badge>
        : <Badge variant="secondary">Tiêu chí thường</Badge>,
      meta: { align: 'center', list: { width: 'minmax(145px,0.9fr)' } },
    },
    {
      accessorKey: 'deadline',
      header: 'Hạn nộp',
      cell: ({ row }) => row.original.deadline ? formatDate(row.original.deadline) : '—',
      meta: { list: { width: 'minmax(145px,0.9fr)' } },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => row.original.status === 'Applied'
        ? <Badge variant="success">Đã áp dụng</Badge>
        : <Badge variant="secondary">Nháp</Badge>,
      meta: { align: 'center', list: { width: 'minmax(120px,0.75fr)' } },
    },
    {
      accessorKey: 'note',
      header: 'Ghi chú',
      cell: ({ row }) => <p className="truncate text-muted-foreground" title={row.original.note}>{row.original.note || '—'}</p>,
      meta: { list: { width: 'minmax(180px,1.1fr)' } },
    },
  ], []);
  if (isLoading) return <PageLoading label="Đang tải nhóm tiêu chí…" />;
  if (!group) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description={error ? getCriteriaApiError(error) : 'Nhóm tiêu chí không tồn tại hoặc đã bị xóa.'} />;
  const saveItem = async (value: Omit<CriteriaItem, 'id' | 'order' | 'updatedAt'>) => {
    const current = editor?.item; const siblingTotal = groupCriteria.filter((item) => item.type !== 'Supplementary' && item.id !== current?.id).reduce((sum, item) => sum + item.maxScore, 0);
    if (siblingTotal + value.maxScore > group.maxPoint) return toast.error(`Tổng điểm tiêu chí (${siblingTotal + value.maxScore}) không được vượt quá ${group.maxPoint} điểm của nhóm.`);
    setSaving(true);
    try {
      const payload = { content: value.name, maxPoint: value.maxScore, maxBonusPoint: value.bonusScore ?? 0, deadline: value.deadline || null, note: value.note };
      if (current) await criteriaGroupsApi.updateCriteria(current.id, { ...payload, changeReason: 'Cập nhật tiêu chí từ giao diện quản lý.' });
      else await criteriaGroupsApi.createBulk(group.id, [{ type: 'Standard', ...payload }]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['criteria-group', id] }),
        queryClient.invalidateQueries({ queryKey: ['criteria', id] }),
      ]);
      toast.success(current ? 'Đã cập nhật tiêu chí.' : 'Đã thêm tiêu chí.'); setEditor(null); setSelected(null);
    } catch (apiError) { toast.error(getCriteriaApiError(apiError)); } finally { setSaving(false); }
  };
  const saveSupplementaryCriteria = async (value: SupplementaryCriteriaForm) => {
    setSaving(true);
    try {
      const uploadedFiles = await uploadFiles(value.files, {
        category: 'supplementary-criteria',
        note: value.reason,
        visibility: 'Private',
      });
      if (uploadedFiles.length !== value.files.length) return;

      await criteriaGroupsApi.createCriteria({
        criteriaGroupId: group.id,
        type: 'Supplementary',
        content: value.content,
        maxPoint: 0,
        maxBonusPoint: 0,
        deadline: value.deadline || null,
        note: value.reason,
        fileIds: uploadedFiles.map((file) => file.id),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['criteria-group', id] }),
        queryClient.invalidateQueries({ queryKey: ['criteria', id] }),
        queryClient.invalidateQueries({ queryKey: ['specialist-submissions'] }),
      ]);
      setSupplementaryOpen(false);
      setSelected(null);
      toast.success('Đã thêm tiêu chí bổ sung và gửi thông báo đến các địa phương.');
    } catch (apiError) {
      toast.error(getCriteriaApiError(apiError));
    } finally {
      setSaving(false);
    }
  };
  const apply = async () => {
    setSaving(true);
    try {
      const latestGroup = await criteriaGroupsApi.get(group.id);
      const validation = validateCriteriaApplication(
        latestGroup.maxPoint,
        latestGroup.criteria.map((item) => item.maxPoint),
      );
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      await criteriaGroupsApi.apply(group.id);
      await queryClient.invalidateQueries({ queryKey: ['criteria-group', id] });
      await queryClient.invalidateQueries({ queryKey: ['criteria-groups'] });
      toast.success('Đã áp dụng nhóm tiêu chí cho các đơn vị địa phương.');
      setApplyOpen(false);
    }
    catch (apiError) { toast.error(getCriteriaApiError(apiError)); } finally { setSaving(false); }
  };
  const openApplyDialog = () => {
    const validation = validateCriteriaApplication(group.maxPoint, groupCriteria.map((item) => item.maxScore));
    if (!validation.success) return toast.error(validation.message);
    setApplyOpen(true);
  };
  return <div className="flex min-h-full flex-col gap-5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/chuyen-vien/tieu-chi" className="hover:text-primary">Quản lý tiêu chí</Link><span>/</span><span className="font-medium text-foreground">{group.name}</span></div>
    <PageHeader title="Danh sách tiêu chí con" description={`${group.name} · Tổng ${groupCriteria.filter((item) => item.type !== 'Supplementary').reduce((sum, item) => sum + item.maxScore, 0)}/${group.maxPoint} điểm`} actions={<Button variant="outline" render={<Link to="/chuyen-vien/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />
    <div className="flex-1 space-y-4">
      {group.status !== 'Draft' && <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Nhóm đã {group.status === 'Applied' ? 'áp dụng' : 'đóng'} — vẫn có thể sửa tiêu chí, mọi thay đổi được ghi nhận lịch sử.</div>}
      <section className="overflow-hidden rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
        <div className="bg-primary px-4 py-3 text-primary-foreground">
          <p className="text-sm font-semibold">Quyết định</p>
          <p className="mt-0.5 text-xs text-white/75">File đính kèm khi áp dụng nhóm tiêu chí</p>
        </div>
        <div className="p-3">{/* canUpload addLabel="Thêm quyết định" uploadCategory="notice" — bật lại khi cần tải thêm quyết định */}<FileAttachmentList entityType="CriteriaGroup" entityId={group.id} emptyText="Chưa có quyết định nào" /></div>
      </section>
      <DataTable
        data={criteria}
        columns={columns}
        loading={isLoadingCriteria}
        variant="list"
        getRowId={(item) => item.id}
        selectedRowId={selected?.id}
        searchable
        searchKey="name"
        onSearchChange={setSearch}
        searchPlaceholder="Tìm nội dung hoặc ghi chú tiêu chí..."
        pageSize={10}
        onRowClick={setSelected}
        filters={(
          <>
            <FilterSelect label="Loại" value={type} onChange={setType} options={[{ value: 'Standard', label: 'Tiêu chuẩn' }, { value: 'Supplementary', label: 'Bổ sung' }]} />
            <FilterSelect label="Sắp xếp" value={sort} onChange={setSort} allLabel="Mới nhất" options={[{ value: 'content-asc', label: 'Nội dung A–Z' }, { value: 'maxPoint-desc', label: 'Điểm cao nhất' }, { value: 'deadline-asc', label: 'Hạn nộp gần nhất' }]} />
          </>
        )}
        activeFilters={[
          ...(type ? [{ label: 'Loại', value: type === 'Standard' ? 'Tiêu chuẩn' : 'Bổ sung', onClear: () => setType('') }] : []),
          ...(sort !== 'createdAt-desc' ? [{ label: 'Sắp xếp', value: sort === 'content-asc' ? 'Nội dung A–Z' : sort === 'maxPoint-desc' ? 'Điểm cao nhất' : 'Hạn nộp gần nhất', onClear: () => setSort('createdAt-desc') }] : []),
        ]}
        onClearFilters={type || sort !== 'createdAt-desc' ? () => { setType(''); setSort('createdAt-desc'); } : undefined}
        toolbar={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="info" disabled={!selected} onClick={() => selected && setEditor({ item: selected, readonly: true })}><Eye className="size-4" />Xem</Button>
            <Button variant="warning" disabled={!selected || selected.type === 'Supplementary'} title={selected?.type === 'Supplementary' ? 'Tiêu chí bổ sung không được sửa điểm.' : undefined} onClick={() => selected && setEditor({ item: selected, readonly: false })}><Pencil className="size-4" />Sửa</Button>
            <Button variant="outline" disabled={!selected} className="border-danger text-danger hover:bg-danger/5" onClick={() => toast.error('API hiện chưa hỗ trợ xóa tiêu chí.')}><Trash2 className="size-4" />Xóa</Button>
            <Button disabled={group.status === 'Closed'} onClick={() => group.status === 'Applied' ? setSupplementaryOpen(true) : setEditor({ item: null, readonly: false })}>
              {group.status === 'Applied' ? <FilePlus2 className="size-4" /> : <Plus className="size-4" />}
              {group.status === 'Applied' ? 'Thêm tiêu chí bổ sung' : 'Thêm mới'}
            </Button>
            <Button disabled={group.status !== 'Draft'} onClick={openApplyDialog}><Send className="size-4" />Áp dụng tiêu chí</Button>
          </div>
        )}
        emptyState={{ title: 'Chưa có tiêu chí con', description: 'Thêm tiêu chí con đầu tiên cho nhóm tiêu chí này.' }}
      />
    </div>
    <CriteriaItemDialog open={!!editor} onOpenChange={(open) => { if (!open) setEditor(null); }} item={editor?.item ?? null} readonly={editor?.readonly} onSave={saveItem} saving={saving} />
    <SupplementaryCriteriaDialog open={supplementaryOpen} onOpenChange={setSupplementaryOpen} onSave={saveSupplementaryCriteria} saving={saving || uploading} uploadProgress={uploadProgress} />
    <FormDialog open={applyOpen} onOpenChange={setApplyOpen} title="Áp dụng tiêu chí cho địa phương" description="Hệ thống sẽ tạo phiếu chấm cho mỗi user cấp xã/phường." onSubmit={(event) => { event.preventDefault(); void apply(); }} submitLabel="Áp dụng" cancelLabel="Đóng" submitDisabled={saving}><p className="rounded-md border border-primary/20 bg-primary/[0.04] p-3 text-sm">Sau khi áp dụng, hệ thống sẽ tạo phiếu chấm cho mỗi user cấp xã/phường.</p></FormDialog>
  </div>;
}
