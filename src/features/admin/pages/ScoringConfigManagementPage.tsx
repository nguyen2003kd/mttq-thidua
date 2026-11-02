import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FilterTextInput, FormDialog, ConfirmDialog } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import {
  scoringConfigsApi,
  getScoringConfigApiError,
  type ScoringConfigApi,
  type ScoringConfigLevelPayload,
} from '../api/scoringConfigsApi';

interface LevelFormState {
  name: string;
  minPoint: string;
  maxPoint: string;
}

type LevelErrors = Record<number, string>;

const emptyForm = { name: '', description: '', levels: [] as LevelFormState[] };

const defaultLevels: LevelFormState[] = [
  { name: 'Xuất sắc', minPoint: '95', maxPoint: '100' },
  { name: 'Tốt', minPoint: '85', maxPoint: '95' },
  { name: 'Khá', minPoint: '70', maxPoint: '85' },
  { name: 'Trung bình', minPoint: '0', maxPoint: '70' },
];

function formatPoint(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
}

/**
 * Mô tả khoảng của mức dạng "85 ≤ điểm < 95" — dễ đọc cho mọi người dùng.
 * Quy ước: biên dưới luôn gồm; biên trên KHÔNG gồm khi có mức khác bắt đầu đúng tại đó
 * (điểm biên thuộc mức cao hơn — vd đúng 95 điểm là "Xuất sắc", không phải "Tốt").
 */
function levelRangeText(levels: LevelFormState[], index: number): string {
  const level = levels[index];
  const min = Number(level.minPoint);
  const max = Number(level.maxPoint);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return '—';
  const sharedBoundary = levels.some((other, otherIndex) => otherIndex !== index && Number(other.minPoint) === max);
  return `${formatPoint(min)} ≤ điểm ${sharedBoundary ? '<' : '≤'} ${formatPoint(max)}`;
}

/** includeMax suy từ dữ liệu: chỉ mức KHÔNG có mức khác bắt đầu đúng tại Đến điểm mới gồm biên trên. */
function resolveIncludeMax(levels: LevelFormState[], index: number): boolean {
  const max = Number(levels[index].maxPoint);
  return !levels.some((other, otherIndex) => otherIndex !== index && Number(other.minPoint) === max);
}

/** Tìm các khoảng HỞ chưa thuộc mức nào (0 → mức đầu, giữa các mức, mức cuối → 100). */
function findCoverageGaps(levels: LevelFormState[]): Array<{ from: number; to: number }> {
  const ordered = levels
    .map((level) => ({ min: Number(level.minPoint), max: Number(level.maxPoint) }))
    .filter((level) => Number.isFinite(level.min) && Number.isFinite(level.max))
    .sort((a, b) => a.min - b.min);
  const gaps: Array<{ from: number; to: number }> = [];
  let cursor = 0;
  for (const level of ordered) {
    if (level.min > cursor) gaps.push({ from: cursor, to: level.min });
    cursor = Math.max(cursor, level.max);
  }
  if (cursor < 100) gaps.push({ from: cursor, to: 100 });
  return gaps.filter((gap) => gap.to > gap.from);
}

/** Validate các mức: tên bắt buộc, 0 ≤ từ < đến (thang tự do), không chồng lấn và PHỦ KÍN liên tục từ 0.
 *  `live = true` khi đang nhập — bỏ qua check tên trống (chỉ check khi Lưu) để không nhắc while đang gõ. */
function validateLevels(levels: LevelFormState[], live = false): { errors: LevelErrors; valid: boolean } {
  const errors: LevelErrors = {};
  const parsed = levels.map((level, index) => {
    if (!live && !level.name.trim()) errors[index] = 'Vui lòng nhập tên mức xếp loại.';
    const min = Number(level.minPoint);
    const max = Number(level.maxPoint);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || min >= max) {
      errors[index] = 'Điểm phải thỏa 0 ≤ Từ điểm < Đến điểm.';
      return { index, min: Number.NaN, max: Number.NaN, name: level.name };
    }
    return { index, min, max, name: level.name };
  });
  const ordered = parsed.filter((level) => Number.isFinite(level.min)).sort((a, b) => a.min - b.min);
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].min < ordered[i - 1].max) {
      errors[ordered[i].index] = `Các mức không được chồng lấn khoảng điểm (mức "${ordered[i].name}" bắt đầu trước khi mức "${ordered[i - 1].name}" kết thúc).`;
    }
  }
  // Phủ kín liên tục từ 0 đến mức cao nhất — khoảng hở bị CHẶN (điểm rơi vào đó không có xếp loại).
  let cursor = 0;
  for (const level of ordered) {
    if (level.min > cursor) {
      errors[level.index] = `Khoảng ${formatPoint(cursor)}–${formatPoint(level.min)} điểm chưa thuộc mức nào — các mức phải phủ kín liên tục từ 0.`;
    }
    cursor = Math.max(cursor, level.max);
  }
  return { errors, valid: Object.keys(errors).length === 0 };
}

export default function ScoringConfigManagementPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { filters: { configSearch: search }, setters: { configSearch: setSearch } } = useQueryFilters({ configSearch: '' });
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ScoringConfigApi | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [levelErrors, setLevelErrors] = useState<LevelErrors>({});

  // Validate live khi đang nhập — sửa điểm xong là lỗi tự biến mất (lỗi tên trống chỉ check khi Lưu).
  useEffect(() => {
    setLevelErrors(validateLevels(form.levels, true).errors);
  }, [form.levels]);

  const configsQuery = useQuery({
    queryKey: ['scoring-configs', 'list', { search: debouncedSearch }],
    queryFn: () => scoringConfigsApi.list({ search: debouncedSearch || undefined, page: 1, pageSize: 100 }),
  });
  const configs = configsQuery.data?.items ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['scoring-configs'] });

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', description: '', levels: defaultLevels.map((level) => ({ ...level })) });
    setLevelErrors({});
    setCreateOpen(true);
  };

  const openEdit = (config: ScoringConfigApi) => {
    setSelected(config);
    setForm({
      name: config.name,
      description: config.description ?? '',
      levels: config.levels.map((level) => ({
        name: level.name,
        minPoint: String(level.minPoint),
        maxPoint: String(level.maxPoint),
      })),
    });
    setLevelErrors({});
    setEditOpen(true);
  };

  const updateLevel = (index: number, patch: Partial<LevelFormState>) => {
    setForm((current) => ({
      ...current,
      levels: current.levels.map((level, levelIndex) => (levelIndex === index ? { ...level, ...patch } : level)),
    }));
  };

  const addLevel = () => setForm((current) => ({ ...current, levels: [...current.levels, { name: '', minPoint: '', maxPoint: '' }] }));

  const removeLevel = (index: number) => {
    setForm((current) => ({ ...current, levels: current.levels.filter((_, levelIndex) => levelIndex !== index) }));
    setLevelErrors((current) => {
      const next: LevelErrors = {};
      Object.entries(current).forEach(([key, message]) => {
        const levelIndex = Number(key);
        if (levelIndex !== index) next[levelIndex > index ? levelIndex - 1 : levelIndex] = message;
      });
      return next;
    });
  };

  const buildPayload = () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên cấu hình điểm.');
      return null;
    }
    if (form.levels.length === 0) {
      toast.error('Cấu hình cần ít nhất một mức xếp loại.');
      return null;
    }
    const { errors, valid } = validateLevels(form.levels);
    setLevelErrors(errors);
    if (!valid) return null;
    const levels: ScoringConfigLevelPayload[] = form.levels.map((level, index) => ({
      name: level.name.trim(),
      minPoint: Number(level.minPoint),
      maxPoint: Number(level.maxPoint),
      includeMin: true,
      includeMax: resolveIncludeMax(form.levels, index),
      sortOrder: index + 1,
    }));
    return { name: form.name.trim(), description: form.description.trim() || null, levels };
  };

  const createMutation = useMutation({
    mutationFn: (payload: NonNullable<ReturnType<typeof buildPayload>>) => scoringConfigsApi.create(payload),
    onSuccess: async () => {
      toast.success('Đã tạo cấu hình điểm');
      setCreateOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(getScoringConfigApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NonNullable<ReturnType<typeof buildPayload>> }) => scoringConfigsApi.update(id, payload),
    onSuccess: async () => {
      toast.success('Đã cập nhật cấu hình điểm');
      setEditOpen(false);
      setSelected(null);
      await invalidate();
    },
    onError: (e) => toast.error(getScoringConfigApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scoringConfigsApi.remove(id),
    onSuccess: async () => {
      toast.success('Đã xóa cấu hình điểm');
      setDeleteOpen(false);
      setSelected(null);
      await invalidate();
    },
    onError: (e) => toast.error(getScoringConfigApiError(e)),
  });

  const columns = useMemo<ColumnDef<ScoringConfigApi>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tên cấu hình',
      meta: { className: 'font-medium', list: { width: 'minmax(180px, 1fr)' } },
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ row }) => row.original.description || '—',
      meta: { list: { width: 'minmax(160px, 1.4fr)' } },
    },
    {
      id: 'levels',
      header: 'Mức xếp loại',
      cell: ({ row }) => (
        <span className="text-[13px] text-foreground/80">
          {row.original.levels.map((level) => level.name).join(' · ')}
        </span>
      ),
      meta: { list: { width: 'minmax(220px, 1.6fr)' } },
    },
    {
      accessorKey: 'usedByPeriodCount',
      header: 'Đang dùng',
      cell: ({ row }) => (
        <span className={row.original.usedByPeriodCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
          {row.original.usedByPeriodCount} kỳ
        </span>
      ),
      meta: { align: 'center', list: { width: '110px' } },
    },
  ], []);

  const formDialog = (
    <FormDialog
      open={createOpen || editOpen}
      onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditOpen(false); setSelected(null); } }}
      title={editOpen ? 'Cập nhật cấu hình điểm' : 'Tạo cấu hình điểm'}
      description="Đặt tên cho cấu hình và khai báo các mức xếp loại theo khoảng điểm."
      onSubmit={(e) => {
        e.preventDefault();
        const payload = buildPayload();
        if (!payload) return;
        if (editOpen && selected) updateMutation.mutate({ id: selected.id, payload });
        else createMutation.mutate(payload);
      }}
      submitLabel={createMutation.isPending || updateMutation.isPending ? 'Đang lưu…' : 'Lưu'}
      submitDisabled={createMutation.isPending || updateMutation.isPending}
      cancelLabel="Đóng"
      size="max-w-3xl sm:max-w-3xl"
    >
      <div className="space-y-1.5">
        <Label htmlFor="sc-name">Tên cấu hình <span className="text-destructive">*</span></Label>
        <Input id="sc-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Thang điểm chuẩn 2026" maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sc-desc">Mô tả</Label>
        <Input id="sc-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về thang điểm" maxLength={1000} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Mức xếp loại <span className="text-destructive">*</span></Label>
          <Button type="button" variant="outline" size="sm" onClick={addLevel}><Plus className="size-4" />Thêm mức</Button>
        </div>
        <div className="space-y-2">
          {form.levels.map((level, index) => (
            <div key={index} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_100px_100px_minmax(150px,1fr)_auto] sm:items-center">
                <div className="space-y-1">
                  <Input
                    aria-label="Tên mức xếp loại"
                    value={level.name}
                    onChange={(e) => updateLevel(index, { name: e.target.value })}
                    placeholder="VD: Xuất sắc"
                    maxLength={100}
                  />
                  {levelErrors[index] && <p role="alert" className="text-xs font-medium text-destructive">{levelErrors[index]}</p>}
                </div>
                <Input
                  aria-label="Từ điểm"
                  type="number" min={0} step="0.5"
                  value={level.minPoint}
                  onChange={(e) => updateLevel(index, { minPoint: e.target.value })}
                  placeholder="Từ"
                />
                <Input
                  aria-label="Đến điểm"
                  type="number" min={0} step="0.5"
                  value={level.maxPoint}
                  onChange={(e) => updateLevel(index, { maxPoint: e.target.value })}
                  placeholder="Đến"
                />
                <span className="text-[13px] font-medium tabular-nums text-foreground/80">
                  {levelRangeText(form.levels, index)}
                </span>
                <Button
                  type="button"
                  variant="ghost" size="icon" className="size-9 text-destructive hover:bg-destructive/10"
                  disabled={form.levels.length <= 1}
                  onClick={() => removeLevel(index)}
                  aria-label="Xóa mức xếp loại"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Thang điểm tự do (không giới hạn 100) — các mức phải phủ kín liên tục từ 0 đến mức cao nhất, không chồng lấn, không để khoảng hở. Điểm biên luôn thuộc mức cao hơn.</p>
        {(() => {
          const gaps = findCoverageGaps(form.levels);
          if (gaps.length === 0) return null;
          return (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Khoảng {gaps.map((gap) => `${formatPoint(gap.from)}–${formatPoint(gap.to)}`).join(', ')} điểm chưa thuộc mức nào —
              điểm rơi vào đó sẽ không có xếp loại. Hãy điều chỉnh các mức để phủ kín 0–100.
            </p>
          );
        })()}
      </div>
    </FormDialog>
  );

  return (
    <div>
      {!embedded && <PageHeader
        title="Cấu hình điểm"
        description="Khai báo các thang điểm gồm các mức xếp loại — áp dụng cho từng kỳ thi đua khi tạo kỳ."
        className="pb-3 border-b-0"
      />}

      <DataTable
        data={configs}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        selectedRowId={selected?.id}
        loading={configsQuery.isLoading}
        pageSize={10}
        onRowClick={setSelected}
        onRowDoubleClick={openEdit}
        filters={
          <FilterTextInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm cấu hình…"
            className="h-9 w-64"
          />
        }
        onClearFilters={() => setSearch('')}
        emptyState={search.trim()
          ? { title: 'Không tìm thấy cấu hình điểm', description: 'Thử từ khóa khác.' }
          : { title: 'Chưa có cấu hình điểm', description: 'Tạo cấu hình đầu tiên để áp dụng cho kỳ thi đua.' }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            {selected && !editOpen && !deleteOpen && !createOpen && (
              <>
                <Button variant="edit" size="sm" onClick={() => openEdit(selected)}>Chỉnh sửa</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selected.usedByPeriodCount > 0}
                  title={selected.usedByPeriodCount > 0 ? `Đang dùng bởi ${selected.usedByPeriodCount} kỳ thi đua` : undefined}
                  onClick={() => setDeleteOpen(true)}
                >
                  Xóa
                </Button>
              </>
            )}
            <Button variant="default" size="sm" onClick={openCreate}><Plus className="size-4" />Tạo cấu hình</Button>
          </div>
        }
      />

      {formDialog}

      <ConfirmDialog
        open={deleteOpen && Boolean(selected)}
        onOpenChange={setDeleteOpen}
        title="Xóa cấu hình điểm?"
        description={`Cấu hình "${selected?.name}" và ${selected?.levels.length ?? 0} mức xếp loại sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={() => { if (selected) deleteMutation.mutate(selected.id); }}
      />
    </div>
  );
}
