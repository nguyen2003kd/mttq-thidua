import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Plus, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, FileAttachmentList, FilterSelect, FormDialog, PageHeader } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CriteriaGrid } from '@/features/workflow/components';
import { useDebounce } from '@/hooks/useDebounce';
import { criteriaGroupsApi, getCriteriaApiError, type CriteriaApi } from '@/features/admin/api/criteriaGroupsApi';
import type { CriteriaItem } from '@/types/domain';

const toItem = (criterion: CriteriaApi, order: number): CriteriaItem => ({
  id: criterion.id, name: criterion.content, maxScore: criterion.maxPoint, bonusScore: criterion.maxBonusPoint,
  deadline: criterion.deadline ?? undefined, note: criterion.note ?? undefined, order,
});

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

export default function CriteriaChildrenPage() {
  const { id } = useParams<{ id: string }>(); const queryClient = useQueryClient();
  const [search, setSearch] = useState(''); const [type, setType] = useState<CriteriaApi['type'] | ''>(''); const [sort, setSort] = useState('createdAt-desc'); const [selected, setSelected] = useState<CriteriaItem | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const [editor, setEditor] = useState<{ item: CriteriaItem | null; readonly: boolean } | null>(null);
  const [applyOpen, setApplyOpen] = useState(false); const [saving, setSaving] = useState(false);
  const { data: group, isLoading, error } = useQuery({ queryKey: ['criteria-group', id], queryFn: () => criteriaGroupsApi.get(id!), enabled: Boolean(id) });
  const [sortBy, sortOrder] = sort.split('-') as ['createdAt' | 'content' | 'maxPoint' | 'deadline', 'asc' | 'desc'];
  const { data: criteriaPage, isLoading: isLoadingCriteria } = useQuery({
    queryKey: ['criteria', id, { search: debouncedSearch, type, sortBy, sortOrder }],
    queryFn: () => criteriaGroupsApi.listCriteria(id!, { search: debouncedSearch || undefined, type: type || undefined, sortBy, sortOrder, page: 1, pageSize: 100 }),
    enabled: Boolean(id),
  });
  const groupCriteria = useMemo(() => group?.criteria.map(toItem) ?? [], [group]);
  const criteria = useMemo(() => criteriaPage?.items.map(toItem) ?? [], [criteriaPage]);
  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Đang tải nhóm tiêu chí…</div>;
  if (!group) return <EmptyState title="Không tìm thấy nhóm tiêu chí" description={error ? getCriteriaApiError(error) : 'Nhóm tiêu chí không tồn tại hoặc đã bị xóa.'} />;
  const applied = group.status === 'Applied' || group.status === 'Closed';
  const saveItem = async (value: Omit<CriteriaItem, 'id' | 'order' | 'updatedAt'>) => {
    const current = editor?.item; const siblingTotal = groupCriteria.filter((item) => item.id !== current?.id).reduce((sum, item) => sum + item.maxScore, 0);
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
  const apply = async () => {
    if (groupCriteria.length === 0) return toast.error('Cần có ít nhất một tiêu chí trước khi áp dụng.');
    const totalMax = groupCriteria.reduce((sum, item) => sum + item.maxScore, 0);
    if (totalMax > group.maxPoint) {
      return toast.error(`Tổng điểm tối đa của các tiêu chí (${totalMax.toFixed(2)}) vượt quá điểm tối đa của nhóm (${group.maxPoint.toFixed(2)}). Hãy chỉnh sửa điểm tiêu chí trước khi áp dụng.`);
    }
    setSaving(true);
    try { await criteriaGroupsApi.apply(group.id); await queryClient.invalidateQueries({ queryKey: ['criteria-group', id] }); await queryClient.invalidateQueries({ queryKey: ['criteria-groups'] }); toast.success('Đã áp dụng nhóm tiêu chí cho các đơn vị địa phương.'); setApplyOpen(false); }
    catch (apiError) { toast.error(getCriteriaApiError(apiError)); } finally { setSaving(false); }
  };
  return <div className="flex min-h-full flex-col gap-5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/chuyen-vien/tieu-chi" className="hover:text-primary">Quản lý tiêu chí</Link><span>/</span><span className="font-medium text-foreground">{group.name}</span></div>
    <PageHeader title="Danh sách tiêu chí con" description={`${group.name} · Tổng ${groupCriteria.reduce((sum, item) => sum + item.maxScore, 0)}/${group.maxPoint} điểm`} actions={<Button variant="outline" render={<Link to="/chuyen-vien/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />
    <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_1px_360px]">
      <div className="space-y-4">
        {applied && <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Nhóm đã {group.status === 'Applied' ? 'áp dụng' : 'đóng'} nên không thể sửa tiêu chí.</div>}
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm nội dung hoặc ghi chú tiêu chí" /></div><FilterSelect label="Loại" value={type} onChange={setType} options={[{ value: 'Standard', label: 'Tiêu chuẩn' }, { value: 'Supplementary', label: 'Bổ sung' }]} /><FilterSelect label="Sắp xếp" value={sort} onChange={setSort} allLabel="Mới nhất" options={[{ value: 'content-asc', label: 'Nội dung A–Z' }, { value: 'maxPoint-desc', label: 'Điểm cao nhất' }, { value: 'deadline-asc', label: 'Hạn nộp gần nhất' }]} /><Button disabled={applied} onClick={() => setEditor({ item: null, readonly: false })}><Plus className="size-4" />Thêm mới</Button><Button variant="outline" disabled={!selected || applied} onClick={() => selected && setEditor({ item: selected, readonly: false })}>Sửa</Button><Button variant="outline" disabled={!selected} onClick={() => selected && setEditor({ item: selected, readonly: true })}>Xem</Button><Button disabled={applied || groupCriteria.length === 0} onClick={() => setApplyOpen(true)}><Send className="size-4" />Áp dụng tiêu chí</Button></div>
        {isLoadingCriteria ? <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Đang lọc tiêu chí…</div> : <CriteriaGrid items={criteria} selectedId={selected?.id} onSelect={setSelected} onView={(item) => setEditor({ item, readonly: true })} onEdit={(item) => { if (!applied) setEditor({ item, readonly: false }); }} onDelete={() => toast.error('API hiện chưa hỗ trợ xóa tiêu chí.')} />}
      </div>
      <div aria-hidden="true" className="hidden w-px bg-border lg:block" />
      <aside className="lg:pl-2">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="bg-primary px-4 py-3 text-primary-foreground">
            <p className="text-sm font-semibold">Quyết định</p>
            <p className="mt-0.5 text-xs text-white/75">File đính kèm khi áp dụng nhóm tiêu chí</p>
          </div>
          <div className="p-3">{/* canUpload addLabel="Thêm quyết định" uploadCategory="notice" — bật lại khi cần tải thêm quyết định */}<FileAttachmentList entityType="CriteriaGroup" entityId={group.id} emptyText="Chưa có quyết định nào" /></div>
        </div>
      </aside>
    </div>
    <CriteriaItemDialog open={!!editor} onOpenChange={(open) => { if (!open) setEditor(null); }} item={editor?.item ?? null} readonly={editor?.readonly} onSave={saveItem} saving={saving} />
    <FormDialog open={applyOpen} onOpenChange={setApplyOpen} title="Áp dụng tiêu chí cho địa phương" description="Hệ thống sẽ tạo phiếu chấm cho mỗi user cấp xã/phường." onSubmit={(event) => { event.preventDefault(); void apply(); }} submitLabel="Áp dụng" cancelLabel="Đóng" submitDisabled={saving}><p className="rounded-md border border-primary/20 bg-primary/[0.04] p-3 text-sm">Sau khi áp dụng, hệ thống sẽ tạo phiếu chấm cho mỗi user cấp xã/phường.</p></FormDialog>
  </div>;
}
