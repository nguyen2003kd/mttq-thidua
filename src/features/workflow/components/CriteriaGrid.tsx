import { Checkbox } from '@/components/ui/checkbox';
import { TableColumnVisibility } from '@/components/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { CriteriaItem } from '@/types/domain';

interface CriteriaGridProps {
  items: CriteriaItem[];
  selectedId?: string | null;
  selectedIds?: string[];
  onSelect: (item: CriteriaItem) => void;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export function CriteriaGrid({ items, selectedId, selectedIds, onSelect, onToggleSelect, onToggleSelectAll }: CriteriaGridProps) {
  const multiSelectEnabled = Boolean(onToggleSelect);
  const allSelected = selectedIds != null && items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const columnOptions = [
    ...(multiSelectEnabled ? [{ id: 'select', label: 'Chọn dòng' }] : []),
    { id: 'criterion', label: 'Nội dung tiêu chí con' },
    { id: 'score', label: 'Điểm chuẩn' },
    { id: 'bonus', label: 'Điểm thưởng tối đa' },
    { id: 'deadline', label: 'Hạn nộp' },
    { id: 'status', label: 'Trạng thái' },
    { id: 'note', label: 'Ghi chú' },
  ];
  return <div className="overflow-hidden rounded-lg border bg-card"><div className="flex justify-end border-b p-2"><TableColumnVisibility storageKey={`criteria-grid-${multiSelectEnabled ? 'selectable' : 'default'}`} columns={columnOptions} /></div><div className="overflow-x-auto"><Table data-column-visibility-table={`criteria-grid-${multiSelectEnabled ? 'selectable' : 'default'}`}><TableHeader><TableRow className="bg-muted/70">{multiSelectEnabled && <TableHead className="w-10">{onToggleSelectAll && <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Chọn tất cả" />}</TableHead>}<TableHead className="min-w-[320px]">Nội dung tiêu chí con ★</TableHead><TableHead className="text-right">Điểm chuẩn ★</TableHead><TableHead className="text-right">Điểm thưởng tối đa ★</TableHead><TableHead>Hạn nộp</TableHead><TableHead>Trạng thái</TableHead><TableHead className="min-w-[200px]">Ghi chú</TableHead></TableRow></TableHeader><TableBody>
    {items.map((item) => <TableRow key={item.id} onClick={() => { onSelect(item); onToggleSelect?.(item.id); }} className={cn('cursor-pointer', selectedId === item.id && 'bg-primary/[0.05]', selectedIds?.includes(item.id) && 'bg-primary/[0.08]')}>{multiSelectEnabled && <TableCell onClick={(event) => event.stopPropagation()}><Checkbox checked={selectedIds?.includes(item.id) ?? false} onCheckedChange={() => { onSelect(item); onToggleSelect?.(item.id); }} aria-label={`Chọn ${item.name}`} /></TableCell>}<TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right font-semibold tabular-nums">{item.maxScore}</TableCell><TableCell className="text-right tabular-nums">{item.bonusScore ?? 0}</TableCell><TableCell>{item.deadline ? formatDate(item.deadline) : '—'}</TableCell><TableCell>{item.status === 'Applied' ? <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">Đã áp dụng</span> : <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">Nháp</span>}</TableCell><TableCell className="text-muted-foreground">{item.note || '—'}</TableCell></TableRow>)}
    {items.length === 0 && <TableRow><TableCell colSpan={multiSelectEnabled ? 7 : 6} className="h-28 text-center text-muted-foreground">Chưa có tiêu chí con.</TableCell></TableRow>}
  </TableBody></Table></div><div className="border-t bg-muted/20 p-2 text-center text-xs text-muted-foreground">Hiển thị {items.length} bản ghi · 10 dòng/trang</div></div>;
}
