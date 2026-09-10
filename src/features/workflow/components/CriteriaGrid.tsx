import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { CriteriaItem } from '@/types/domain';

interface CriteriaGridProps {
  items: CriteriaItem[];
  selectedId?: string | null;
  onSelect: (item: CriteriaItem) => void;
  onView: (item: CriteriaItem) => void;
  onEdit: (item: CriteriaItem) => void;
  onDelete: (item: CriteriaItem) => void;
}

export function CriteriaGrid({ items, selectedId, onSelect, onView, onEdit, onDelete }: CriteriaGridProps) {
  return <div className="overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/70"><TableHead className="min-w-[320px]">Nội dung tiêu chí con ★</TableHead><TableHead className="text-right">Điểm chuẩn ★</TableHead><TableHead className="text-right">Điểm thưởng tối đa ★</TableHead><TableHead>Hạn nộp</TableHead><TableHead className="min-w-[200px]">Ghi chú</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>
    {items.map((item) => <TableRow key={item.id} onClick={() => onSelect(item)} className={cn('cursor-pointer', selectedId === item.id && 'bg-primary/[0.05]')}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right font-semibold tabular-nums">{item.maxScore}</TableCell><TableCell className="text-right tabular-nums">{item.bonusScore ?? 0}</TableCell><TableCell>{item.deadline ? formatDate(item.deadline) : '—'}</TableCell><TableCell className="text-muted-foreground">{item.note || '—'}</TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon-xs" variant="ghost" title="Xem" onClick={(event) => { event.stopPropagation(); onView(item); }}><Eye className="size-4" /></Button><Button size="icon-xs" variant="ghost" title="Sửa" onClick={(event) => { event.stopPropagation(); onEdit(item); }}><Pencil className="size-4" /></Button><Button size="icon-xs" variant="destructive" title="Xóa" onClick={(event) => { event.stopPropagation(); onDelete(item); }}><Trash2 className="size-4" /></Button></div></TableCell></TableRow>)}
    {items.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Chưa có tiêu chí con.</TableCell></TableRow>}
  </TableBody></Table></div><div className="border-t bg-muted/20 p-2 text-center text-xs text-muted-foreground">Hiển thị {items.length} bản ghi · 10 dòng/trang</div></div>;
}
