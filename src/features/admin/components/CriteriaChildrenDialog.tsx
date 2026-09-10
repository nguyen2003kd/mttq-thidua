import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/core';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type CriteriaChildInput = {
  id?: string;
  name: string;
  maxScore: number;
  bonusScore?: number;
  deadline?: string;
  note?: string;
};

const emptyCriteriaChild = (): CriteriaChildInput => ({ name: '', maxScore: 0 });

interface CriteriaChildrenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CriteriaChildInput[];
  totalScore: number;
  criteriaGroupName: string;
  onSave: (items: CriteriaChildInput[]) => void;
}

export function CriteriaChildrenDialog({ open, onOpenChange, items, totalScore, criteriaGroupName, onSave }: CriteriaChildrenDialogProps) {
  const [draft, setDraft] = useState<CriteriaChildInput[]>([]);

  useEffect(() => {
    if (open) setDraft(items.length ? items : [emptyCriteriaChild()]);
  }, [items, open]);

  const subtotal = draft.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0);
  const exceedsTotal = subtotal > totalScore;

  const updateItem = (index: number, field: keyof Omit<CriteriaChildInput, 'id'>, value: string) => {
    setDraft((current) => current.map((item, itemIndex) => (
      itemIndex === index
        ? {
            ...item,
            [field]: field === 'maxScore'
              ? Number(value) || 0
              : field === 'bonusScore'
                ? (value === '' ? undefined : Number(value))
                : value,
          }
        : item
    )));
  };

  const removeItem = (index: number) => setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const populatedItems = draft.filter((item) => item.name.trim() || item.maxScore > 0 || item.bonusScore !== undefined || item.deadline || item.note?.trim());
    const hasInvalidItem = populatedItems.some((item) => !item.name.trim() || item.maxScore <= 0 || item.bonusScore === undefined || item.bonusScore < 0);

    if (hasInvalidItem) {
      toast.error('Mỗi tiêu chí con cần có Nội dung, Điểm lớn hơn 0 và Điểm thưởng.');
      return;
    }

    const normalizedItems = populatedItems.map((item) => ({
      ...item,
      name: item.name.trim(),
      note: item.note?.trim() || undefined,
      deadline: item.deadline || undefined,
    }));
    const normalizedSubtotal = normalizedItems.reduce((sum, item) => sum + item.maxScore, 0);
    if (normalizedSubtotal > totalScore) {
      toast.error(`Tổng điểm tiêu chí con (${normalizedSubtotal}) không được vượt quá Tổng điểm (${totalScore}).`);
      return;
    }

    onSave(normalizedItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-4rem)] max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Thêm/Sửa tiêu chí con</DialogTitle>
          <DialogDescription>Nhập các tiêu chí thuộc nhóm đang chỉnh sửa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-md border border-primary/20 bg-primary/[0.04] px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nhóm tiêu chí</p>
            <p className="mt-0.5 font-semibold text-foreground">{criteriaGroupName}</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/35 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">Tổng điểm tiêu chí con</span>
            <span className={exceedsTotal ? 'font-semibold text-destructive' : 'font-semibold text-primary'}>
              {subtotal}/{totalScore || 0} điểm
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold">Danh sách tiêu chí con</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setDraft((current) => [...current, emptyCriteriaChild()])}>
              <Plus className="mr-1.5 h-4 w-4" /> Thêm tiêu chí
            </Button>
          </div>
          <div className="max-h-[45dvh] space-y-3 overflow-y-auto pr-1">
            {draft.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">Chưa có tiêu chí con.</p>}
            {draft.map((item, index) => (
              <section key={item.id ?? index} className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Tiêu chí con {index + 1}</p>
                  <Button type="button" variant="destructive" size="icon-sm" onClick={() => removeItem(index)} aria-label={`Xóa tiêu chí ${index + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`criteria-child-name-${index}`}>Nội dung tiêu chí con <span className="text-destructive">*</span></Label>
                    <Textarea id={`criteria-child-name-${index}`} value={item.name} onChange={(event) => updateItem(index, 'name', event.target.value)} placeholder="Nhập nội dung tiêu chí con" rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`criteria-child-bonus-${index}`}>Điểm thưởng <span className="text-destructive">*</span></Label>
                    <Input id={`criteria-child-bonus-${index}`} type="number" min={0} value={item.bonusScore ?? ''} onChange={(event) => updateItem(index, 'bonusScore', event.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`criteria-child-deadline-${index}`}>Hạn nộp</Label>
                    <Input id={`criteria-child-deadline-${index}`} type="datetime-local" value={item.deadline ?? ''} onChange={(event) => updateItem(index, 'deadline', event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`criteria-child-score-${index}`}>Điểm <span className="text-destructive">*</span></Label>
                    <Input id={`criteria-child-score-${index}`} type="number" min={1} value={item.maxScore || ''} onChange={(event) => updateItem(index, 'maxScore', event.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`criteria-child-note-${index}`}>Ghi chú</Label>
                  <Textarea id={`criteria-child-note-${index}`} value={item.note ?? ''} onChange={(event) => updateItem(index, 'note', event.target.value)} placeholder="Thông tin bổ sung (nếu có)" rows={2} />
                </div>
              </section>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu tiêu chí con</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
