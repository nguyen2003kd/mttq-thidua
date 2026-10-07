import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1CriteriaGroupsQueryKey, getGetApiV1CriteriaGroupsIdQueryKey } from '@/api/endpoints/criteria-groups';
import { getGetApiV1SubmissionsQueryKey } from '@/api/endpoints/submissions';
import { getGetApiV1FilesQueryKey } from '@/api/endpoints/files';
import { getGetApiV1AuditLogsQueryKey } from '@/api/endpoints/audit-logs';
import { apiQueryKey, dataQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ArrowLeft, Eye, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, DataTable, EmptyState, FileAttachmentList, FileUpload, FilterSelect, FormDialog, PageHeader, PageLoading, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { formatDate } from '@/lib/utils';
import { criteriaGroupsApi, getCriteriaApiError, type CriteriaApi } from '@/features/admin/api/criteriaGroupsApi';
import { useAuthStore } from '@/store/authStore';
import { validateCriteriaApplication } from '@/features/admin/criteriaValidation';
import type { CriteriaItem } from '@/types/domain';

const toDateTimeInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const getCurrentLocalDateTime = () => {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localNow.toISOString().slice(0, 16);
};

const toItem = (criterion: CriteriaApi, order: number): CriteriaItem => ({
  id: criterion.id, name: criterion.content, maxScore: criterion.maxPoint, bonusScore: criterion.maxBonusPoint,
  deadline: criterion.deadline ?? undefined, note: criterion.note ?? undefined, order,
  type: criterion.type === 'Supplementary' ? 'Supplementary' : criterion.type === 'LateAdded' ? 'LateAdded' : 'Standard', status: criterion.status,
});

interface EditorProps {
  open: boolean; onOpenChange: (open: boolean) => void; item: CriteriaItem | null; readonly?: boolean;
  parentDeadline?: string | null;
  onSave: (value: Omit<CriteriaItem, 'id' | 'order' | 'updatedAt'>) => void; saving: boolean;
}

function CriteriaItemDialog({ open, onOpenChange, item, readonly = false, parentDeadline, onSave, saving }: EditorProps) {
  const [name, setName] = useState(''); const [score, setScore] = useState(''); const [bonus, setBonus] = useState('0');
  const [deadline, setDeadline] = useState(''); const [note, setNote] = useState(''); const [error, setError] = useState('');
  const parentDeadlineInput = toDateTimeInput(parentDeadline);
  useEffect(() => { if (!open) return; setName(item?.name ?? ''); setScore(item?.maxScore?.toString() ?? ''); setBonus(item?.bonusScore?.toString() ?? '0'); setDeadline(toDateTimeInput(item?.deadline)); setNote(item?.note ?? ''); setError(''); }, [open, item]);
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (readonly) return onOpenChange(false);
    const maxScore = Number(score); const bonusScore = Number(bonus || 0);
    if (!name.trim()) return setError('Nội dung tiêu chí là bắt buộc.');
    if (!Number.isFinite(maxScore) || maxScore <= 0) return setError('Điểm chuẩn phải lớn hơn 0.');
    if (!Number.isFinite(bonusScore) || bonusScore < 0) return setError('Điểm thưởng tối đa không hợp lệ.');
    if (deadline && new Date(deadline).getTime() < Date.now()) return setError('Hạn nộp không được ở thời gian quá khứ.');
    if (deadline && parentDeadline && new Date(deadline).getTime() > new Date(parentDeadline).getTime()) {
      return setError('Hạn nộp của tiêu chí con không được vượt quá hạn nộp của tiêu chí cha.');
    }
    onSave({ name: name.trim(), maxScore, bonusScore, deadline: deadline || undefined, note: note.trim() || undefined });
  };
  return <FormDialog open={open} onOpenChange={onOpenChange} title={readonly ? 'Xem tiêu chí con' : item ? 'Sửa tiêu chí con' : 'Thêm mới tiêu chí con'} description="Nhập thông tin tiêu chí con." onSubmit={submit} submitLabel={readonly ? 'Đóng' : 'Lưu'} cancelLabel="Đóng" hideCancel={readonly} submitDisabled={saving}>
    <div className="space-y-1.5"><Label htmlFor="child-name">Nội dung <span className="text-destructive">★</span></Label><Input id="child-name" value={name} onChange={(event) => setName(event.target.value)} disabled={readonly || saving} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="child-score">Điểm chuẩn <span className="text-destructive">★</span></Label><Input id="child-score" type="number" min={0} step="0.25" value={score} onChange={(event) => setScore(event.target.value)} disabled={readonly || saving} /></div><div className="space-y-1.5"><Label htmlFor="child-bonus">Điểm thưởng tối đa</Label><Input id="child-bonus" type="number" min={0} step="0.25" value={bonus} onChange={(event) => setBonus(event.target.value)} disabled={readonly || saving} /></div></div>
    <div className="space-y-1.5"><Label htmlFor="child-deadline">Hạn nộp</Label><Input id="child-deadline" type="datetime-local" min={getCurrentLocalDateTime()} max={parentDeadlineInput || undefined} value={deadline} onChange={(event) => setDeadline(event.target.value)} disabled={readonly || saving} /><p className="text-xs text-muted-foreground">Không được quá hạn nộp của tiêu chí cha{parentDeadlineInput ? ` (${parentDeadlineInput.replace('T', ' ')})` : ''}.</p></div>
    <div className="space-y-1.5"><Label htmlFor="child-note">Ghi chú</Label><Textarea id="child-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} disabled={readonly || saving} /></div>
    {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="size-4 shrink-0" />{error}</p>}
  </FormDialog>;
}

export default function CriteriaChildrenPage() {
  const { id } = useParams<{ id: string }>(); const queryClient = useQueryClient();
  const { filters: { search: initialSearch, sort }, setters: { sort: setSort } } = useQueryFilters({ search: '', sort: 'createdAt-desc' });
  const [search, setSearch] = useState(initialSearch);
  const [selected, setSelected] = useState<CriteriaItem | null>(null);
  const [editor, setEditor] = useState<{ item: CriteriaItem | null; readonly: boolean } | null>(null);
  const [applyOpen, setApplyOpen] = useState(false); const [saving, setSaving] = useState(false);
  const [applyFiles, setApplyFiles] = useState<File[]>([]); const [applyError, setApplyError] = useState('');
  const [applyValidationMessage, setApplyValidationMessage] = useState('');
  const { uploading, uploadProgress, uploadFiles } = useFileUpload();
  const { data: group, isLoading, error } = useQuery({ queryKey: dataQueryKey(getGetApiV1CriteriaGroupsIdQueryKey(id ?? '')), queryFn: () => criteriaGroupsApi.get(id!), enabled: Boolean(id) });
  const [sortBy, sortOrder] = sort.split('-') as ['createdAt' | 'content' | 'maxPoint' | 'deadline', 'asc' | 'desc'];
  const { data: criteriaPage, isLoading: isLoadingCriteria } = useQuery({
    queryKey: dataQueryKey([...getGetApiV1CriteriaGroupsIdQueryKey(id ?? ''), 'criteria'], { search, type: 'Standard', sortBy, sortOrder, page: 1, pageSize: 100 }),
    queryFn: () => criteriaGroupsApi.listCriteria(id!, { search: search || undefined, type: 'Standard', sortBy, sortOrder, page: 1, pageSize: 100 }),
    enabled: Boolean(id),
  });
  const canDeleteCriteria = useAuthStore((state) => state.user?.role === 'SPECIALIST');
  const invalidateCriteria = () => invalidateQueryResources(queryClient, [
    getGetApiV1CriteriaGroupsQueryKey(),
    apiQueryKey({}, { url: '/api/v1/criteria' }),
    getGetApiV1SubmissionsQueryKey(),
    apiQueryKey({}, { url: '/api/v1/submission-results' }),
    getGetApiV1AuditLogsQueryKey(),
  ]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (criteriaId: string) => criteriaGroupsApi.deleteCriteria(criteriaId),
    onSuccess: async (updatedGroup) => {
      await invalidateCriteria();
      setDeleteOpen(false);
      setSelected(null);
      toast.success(`Đã xóa tiêu chí. Tổng điểm tối đa của nhóm vẫn giữ nguyên ${updatedGroup.maxPoint} điểm.`);
    },
    onError: (apiError) => toast.error(getCriteriaApiError(apiError)),
  });
  const groupCriteria = useMemo(() => group?.criteria.filter((criterion) => (criterion.type === 'Standard' || criterion.type === 'LateAdded') && criterion.status !== 'Deleted').map(toItem) ?? [], [group]);
  const appliedCriteria = useMemo(() => groupCriteria.filter((item) => item.status === 'Applied'), [groupCriteria]);
  const criteriaMaxPointTotal = useMemo(() => groupCriteria.reduce((total, item) => total + item.maxScore, 0), [groupCriteria]);
  const criteria = useMemo(() => criteriaPage?.items.map(toItem) ?? [], [criteriaPage]);
  const columns = useMemo<ColumnDef<CriteriaItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nội dung tiêu chí con',
      cell: ({ row }) => <TruncatedText value={row.original.name} className="font-medium" />,
      meta: { list: { width: 'minmax(300px,2fr)' } },
    },
    {
      accessorKey: 'maxScore',
      header: 'Điểm chuẩn',
      meta: { align: 'center', list: { width: 'minmax(110px,0.7fr)' } },
    },
    {
      accessorKey: 'bonusScore',
      header: 'Điểm thưởng tối đa',
      cell: ({ row }) => row.original.bonusScore ?? 0,
      meta: { align: 'center', list: { width: 'minmax(145px,0.85fr)' } },
    },
    {
      accessorKey: 'deadline',
      header: 'Hạn nộp',
      sortDescFirst: true,
      cell: ({ row }) => row.original.deadline ? formatDate(row.original.deadline) : '—',
      meta: { list: { width: 'minmax(145px,0.9fr)' } },
    },
    {
      accessorFn: (row) => row.status === 'Deleted' ? 'Vô hiệu' : row.status === 'Applied' ? 'Đã áp dụng' : 'Nháp',
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => row.original.status === 'Deleted'
        ? <Badge variant="secondary">Vô hiệu</Badge>
        : row.original.status === 'Applied'
          ? <Badge variant="success">Đã áp dụng</Badge>
          : <Badge variant="secondary">Nháp</Badge>,
      meta: { align: 'center', list: { width: 'minmax(120px,0.75fr)' } },
    },
    {
      accessorKey: 'note',
      header: 'Ghi chú',
      cell: ({ row }) => <TruncatedText value={row.original.note} className="text-muted-foreground" />,
      meta: { list: { width: 'minmax(180px,1.1fr)' } },
    },
  ], []);
  if (isLoading) return <PageLoading label="Đang tải nhóm tiêu chí…" />;
  if (!group) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description={error ? getCriteriaApiError(error) : 'Nhóm tiêu chí không tồn tại hoặc đã bị xóa.'} />;
  const pointValidation = validateCriteriaApplication(group.maxPoint, appliedCriteria.map((item) => item.maxScore));
  const canApply = group.status === 'Draft' && pointValidation.success;
  const openCreateEditor = () => {
    if (Math.round(criteriaMaxPointTotal * 100) >= Math.round(group.maxPoint * 100)) {
      const message = criteriaMaxPointTotal > group.maxPoint
        ? `Tổng điểm tối đa của các tiêu chí con (${criteriaMaxPointTotal}) đã vượt quá ${group.maxPoint} điểm của nhóm tiêu chí.`
        : `Tổng điểm tối đa của các tiêu chí con đã đủ ${group.maxPoint} điểm, bằng điểm tối đa của nhóm tiêu chí. Không thể thêm tiêu chí mới.`;
      toast.warning(message);
      return;
    }
    setEditor({ item: null, readonly: false });
  };
  const saveItem = async (value: Omit<CriteriaItem, 'id' | 'order' | 'updatedAt'>) => {
    const current = editor?.item; const siblingTotal = groupCriteria.filter((item) => item.id !== current?.id).reduce((sum, item) => sum + item.maxScore, 0);
    if (siblingTotal + value.maxScore > group.maxPoint) return toast.error(`Tổng điểm tiêu chí (${siblingTotal + value.maxScore}) không được vượt quá ${group.maxPoint} điểm của nhóm.`);
    setSaving(true);
    try {
      const payload = { content: value.name, maxPoint: value.maxScore, maxBonusPoint: value.bonusScore ?? 0, deadline: value.deadline || null, note: value.note };
      if (current) await criteriaGroupsApi.updateCriteria(current.id, { ...payload, changeReason: 'Cập nhật tiêu chí từ giao diện quản lý.' });
      else await criteriaGroupsApi.createBulk(group.id, [{ type: 'Standard', ...payload }]);
      await invalidateCriteria();
      toast.success(current ? 'Đã cập nhật tiêu chí.' : 'Đã thêm tiêu chí.'); setEditor(null); setSelected(null); setApplyValidationMessage('');
    } catch (apiError) { toast.error(getCriteriaApiError(apiError)); } finally { setSaving(false); }
  };
  const apply = async () => {
    setSaving(true);
    try {
      const latestGroup = await queryClient.fetchQuery({
        queryKey: dataQueryKey(getGetApiV1CriteriaGroupsIdQueryKey(group.id)),
        queryFn: () => criteriaGroupsApi.get(group.id),
        staleTime: 0,
      });
      const validation = validateCriteriaApplication(
        latestGroup.maxPoint,
        latestGroup.criteria.filter((item) => item.status === 'Applied').map((item) => item.maxPoint),
      );
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      await criteriaGroupsApi.apply(group.id);
      if (applyFiles.length > 0) {
        const uploadedFiles = await uploadFiles(applyFiles, {
          entityType: 'CriteriaGroup',
          entityId: group.id,
          category: 'notice',
        });
        if (uploadedFiles.length !== applyFiles.length) {
          toast.warning('Nhóm tiêu chí đã được áp dụng nhưng có file thông báo tải lên không thành công.');
        }
      }
      await invalidateQueryResources(queryClient, [
        getGetApiV1CriteriaGroupsQueryKey(),
        getGetApiV1SubmissionsQueryKey(),
        getGetApiV1FilesQueryKey(),
        getGetApiV1AuditLogsQueryKey(),
      ]);
      toast.success('Đã áp dụng nhóm tiêu chí cho các đơn vị địa phương.');
      setApplyOpen(false);
      setApplyFiles([]);
      setApplyError('');
    }
    catch (apiError) { toast.error(getCriteriaApiError(apiError)); } finally { setSaving(false); }
  };
  const openApplyDialog = () => {
    const validation = validateCriteriaApplication(group.maxPoint, appliedCriteria.map((item) => item.maxScore));
    if (!validation.success) {
      setApplyValidationMessage(validation.message ?? 'Không thể áp dụng nhóm tiêu chí.');
      return;
    }
    setApplyValidationMessage('');
    setApplyFiles([]);
    setApplyError('');
    setApplyOpen(true);
  };
  return <div className="flex min-h-full flex-col gap-5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/chuyen-vien/tieu-chi" className="hover:text-primary">Quản lý tiêu chí</Link><span>/</span><span className="font-medium text-foreground">{group.name}</span></div>
    <PageHeader title="Danh sách tiêu chí con" description={`${group.name} · Tổng ${pointValidation.childTotal}/${group.maxPoint} điểm`} actions={<Button variant="back" render={<Link to="/chuyen-vien/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />
    <div className="flex-1 space-y-4">
      {applyValidationMessage && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
          <div className="flex min-w-0 items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Không thể áp dụng nhóm tiêu chí</p>
              <p className="mt-0.5 text-danger/90">{applyValidationMessage}</p>
            </div>
          </div>
          <Badge className="shrink-0 border border-danger/25 bg-background text-danger">{pointValidation.childTotal}/{group.maxPoint} điểm</Badge>
        </div>
      )}
      {group.status !== 'Draft' && <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Nhóm đã {group.status === 'Applied' ? 'áp dụng' : group.status === 'Published' ? 'công bố — chỉ có thể xem tiêu chí, không thể chỉnh sửa' : 'đóng'}{group.status !== 'Published' ? ' — vẫn có thể sửa tiêu chí, mọi thay đổi được ghi nhận lịch sử' : ''}.</div>}
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
        onSearchChange={setSearch}
        searchPlaceholder="Tìm nội dung hoặc ghi chú tiêu chí..."
        pageSize={10}
        onRowClick={setSelected}
        filters={(
          <>
            <FilterSelect label="Sắp xếp" value={sort} onChange={setSort} allLabel="Mới nhất" options={[{ value: 'content-asc', label: 'Nội dung A–Z' }, { value: 'maxPoint-desc', label: 'Điểm cao nhất' }, { value: 'deadline-asc', label: 'Hạn nộp gần nhất' }]} />
          </>
        )}
        activeFilters={[
          ...(sort !== 'createdAt-desc' ? [{ label: 'Sắp xếp', value: sort === 'content-asc' ? 'Nội dung A–Z' : sort === 'maxPoint-desc' ? 'Điểm cao nhất' : 'Hạn nộp gần nhất', onClear: () => setSort('createdAt-desc') }] : []),
        ]}
        onClearFilters={sort !== 'createdAt-desc' ? () => setSort('createdAt-desc') : undefined}
        toolbar={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="info" hideWhen={!selected} disabled={!selected} disabledReason="Chọn một tiêu chí con để xem." onClick={() => selected && setEditor({ item: selected, readonly: true })}><Eye className="size-4" />Xem</Button>
            <Button variant="edit" hideWhen={!selected} disabled={!selected || selected.status === 'Deleted' || group.status === 'Published'} disabledReason={!selected ? 'Chọn một tiêu chí con để chỉnh sửa.' : selected.status === 'Deleted' ? 'Tiêu chí đã vô hiệu, không thể chỉnh sửa.' : group.status === 'Published' ? 'Nhóm tiêu chí đã công bố, không thể chỉnh sửa tiêu chí con.' : undefined} onClick={() => selected && selected.status !== 'Deleted' && group.status !== 'Published' && setEditor({ item: selected, readonly: false })}><Pencil className="size-4" />Sửa</Button>
            <Button
              variant="destructive"
              hideWhen={!selected}
              disabled={!selected || selected.status === 'Deleted' || !canDeleteCriteria || (group.status !== 'Draft' && group.status !== 'Applied') || groupCriteria.length <= 1 || deleteMutation.isPending}
              disabledReason={!selected ? 'Chọn một tiêu chí con để xóa.' : selected.status === 'Deleted' ? 'Tiêu chí đã vô hiệu.' : !canDeleteCriteria ? 'Chỉ Chuyên viên trưởng được xóa tiêu chí.' : group.status !== 'Draft' && group.status !== 'Applied' ? 'Không thể xóa tiêu chí sau khi nhóm đã đóng hoặc công bố.' : groupCriteria.length <= 1 ? 'Nhóm cần còn ít nhất một tiêu chí con.' : deleteMutation.isPending ? 'Đang xóa tiêu chí.' : undefined}
              onClick={() => { if (selected && selected.status !== 'Deleted' && canDeleteCriteria) setDeleteOpen(true); }}
            >
              <Trash2 className="size-4" />Xóa
            </Button>
            <Button
              variant="success"
              disabled={group.status === 'Published'}
              disabledReason={group.status === 'Published' ? 'Nhóm tiêu chí đã công bố, không thể thêm tiêu chí con mới.' : undefined}
              onClick={openCreateEditor}
            ><Plus className="size-4" />Thêm mới</Button>
            <Button
              disabled={!canApply}
              disabledReason={
                group.status !== 'Draft'
                  ? 'Chỉ nhóm tiêu chí ở trạng thái Nháp mới có thể áp dụng.'
                  : pointValidation.message ?? undefined
              }
              onClick={() => { if (canApply) openApplyDialog(); }}
            >
              <Send className="size-4" />Áp dụng tiêu chí cho địa phương
            </Button>
          </div>
        )}
        emptyState={search
          ? { title: 'Không tìm thấy tiêu chí con', description: 'Thử từ khóa khác.' }
          : { title: 'Chưa có tiêu chí con', description: 'Thêm tiêu chí con đầu tiên cho nhóm tiêu chí này.' }}
      />
    </div>
    <CriteriaItemDialog open={!!editor} onOpenChange={(open) => { if (!open) setEditor(null); }} item={editor?.item ?? null} readonly={editor?.readonly} parentDeadline={group.deadline} onSave={saveItem} saving={saving} />
    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Xóa tiêu chí con"
      description={selected ? (group.status === 'Draft'
        ? 'Bạn có chắc muốn xóa tiêu chí? Tiêu chí sẽ bị xóa hoàn toàn.'
        : `Bạn có chắc muốn xóa tiêu chí “${selected.name}” (${selected.maxScore} điểm)? Tiêu chí sẽ chuyển sang trạng thái Vô hiệu, dữ liệu điểm và lịch sử vẫn được giữ lại. Tổng điểm tối đa của nhóm vẫn giữ nguyên ${group.maxPoint} điểm.`)
        : 'Chọn tiêu chí cần xóa.'}
      confirmLabel={deleteMutation.isPending ? 'Đang xóa…' : 'Xóa tiêu chí'}
      cancelLabel="Hủy"
      variant="destructive"
      onConfirm={() => { if (selected && canDeleteCriteria) deleteMutation.mutate(selected.id); }}
    />
    <FormDialog
      open={applyOpen}
      onOpenChange={(open) => { setApplyOpen(open); if (!open) { setApplyFiles([]); setApplyError(''); } }}
      title="Áp dụng tiêu chí cho địa phương"
      description={`Bảng “${group.name}” sẽ được gửi đến toàn bộ địa phương trong hệ thống.`}
      onSubmit={(event) => {
        event.preventDefault();
        if (applyFiles.some((file) => file.size > 20 * 1024 * 1024)) {
          setApplyError('File thông báo không được vượt quá 20MB.');
          return;
        }
        void apply();
      }}
      submitLabel="Áp dụng"
      cancelLabel="Đóng"
      submitAction="assign"
      submitDisabled={saving || uploading}
      size="max-w-xl sm:max-w-xl"
    >
      <div className="rounded-md border border-primary/20 bg-primary/[0.04] p-3">
        <p className="font-medium">Địa phương <span className="text-destructive">★</span></p>
        <p className="mt-1 text-sm text-muted-foreground">Áp dụng cho toàn bộ địa phương trong hệ thống.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Đính kèm file thông báo</Label>
        <FileUpload
          value={applyFiles}
          onChange={(files) => { setApplyFiles(files); setApplyError(''); }}
          uploading={uploading}
          uploadProgress={uploadProgress}
          maxSizeMb={20}
        />
      </div>
      {applyError && <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm font-medium text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{applyError}</p>}
    </FormDialog>
  </div>;
}
