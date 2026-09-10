import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { CriteriaTable } from '@/types/domain';

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CriteriaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const createCriteriaTable = useScoreStore((s) => s.createCriteriaTable);
  const updateCriteriaTable = useScoreStore((s) => s.updateCriteriaTable);

  const isNew = id === 'new';
  const existing = useMemo(() => criteriaTables.find((t) => t.id === id), [criteriaTables, id]);

  const [name, setName] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [status, setStatus] = useState<CriteriaTable['status']>('DRAFT');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<{ id?: string; name: string; maxScore: number }[]>([{ name: '', maxScore: 0 }]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setOpenDate(existing.openDate);
      setCloseDate(existing.closeDate);
      setStatus(existing.status);
      setNote(existing.note ?? '');
      setItems(existing.criteria.map((c) => ({ id: c.id, name: c.name, maxScore: c.maxScore })));
    } else if (isNew) {
      setName('');
      setOpenDate('');
      setCloseDate('');
      setStatus('DRAFT');
      setNote('');
      setItems([{ name: '', maxScore: 0 }]);
    }
  }, [existing, isNew]);

  if (!isNew && !existing) {
    return (
      <EmptyState
        title="Không tìm thấy bảng tiêu chí"
        description="Bảng tiêu chí không tồn tại hoặc đã bị xóa."
        icon={<AlertCircle className="h-8 w-8" />}
      />
    );
  }

  const addItem = () => setItems([...items, { name: '', maxScore: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: 'name' | 'maxScore', value: string | number) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: field === 'maxScore' ? Number(value) || 0 : value };
    setItems(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = items.filter((i) => i.name.trim() && i.maxScore > 0);
    if (!name.trim() || !openDate || !closeDate || valid.length === 0) {
      toast.error('Vui lòng nhập đầy đủ thông tin và ít nhất một tiêu chí hợp lệ.');
      return;
    }
    const totalScore = valid.reduce((sum, i) => sum + i.maxScore, 0);
    if (isNew) {
      createCriteriaTable({ name, totalScore, openDate, closeDate, note, criteria: valid });
      toast.success('Đã tạo bảng tiêu chí mới');
    } else if (existing) {
      const updated: CriteriaTable = {
        ...existing,
        name,
        totalScore,
        openDate,
        closeDate,
        note: note.trim() || undefined,
        status,
        criteria: valid.map((it, idx) => ({
          id: it.id ?? newId(),
          name: it.name,
          maxScore: it.maxScore,
          order: idx + 1,
        })),
      };
      updateCriteriaTable(updated);
      toast.success('Đã cập nhật bảng tiêu chí');
    }
    navigate(ROUTES.ADMIN_CRITERIA_LIST);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'Tạo bảng tiêu chí' : `Sửa: ${existing?.name ?? ''}`}
        description="Nhập thông tin bảng tiêu chí và danh sách tiêu chí con."
      />
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="criteria-name">Tên bảng tiêu chí</Label>
              <Input id="criteria-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bảng tiêu chí 2026" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="open-date">Ngày mở</Label>
                <Input id="open-date" type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="close-date">Ngày đóng</Label>
                <Input id="close-date" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as CriteriaTable['status'])}
              >
                <SelectTrigger id="status">
                  <SelectValue>
                    {status === 'DRAFT' ? 'Nháp' : status === 'ACTIVE' ? 'Đang hoạt động' : 'Hết hạn'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Nháp</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú áp dụng bảng tiêu chí (nếu có)" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Danh sách tiêu chí con</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 ml-1.5" /> Thêm
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid gap-3 md:grid-cols-[1fr,120px,auto] items-end">
                <div className="space-y-1.5">
                  <Label htmlFor={`item-name-${idx}`}>Tên tiêu chí</Label>
                  <Input
                    id={`item-name-${idx}`}
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    placeholder="Tên tiêu chí"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`item-score-${idx}`}>Điểm tối đa</Label>
                  <Input
                    id={`item-score-${idx}`}
                    type="number"
                    min={0}
                    value={item.maxScore || ''}
                    onChange={(e) => updateItem(idx, 'maxScore', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" action={isNew ? 'create' : 'edit'}>
            <Save className="h-4 w-4 ml-2" /> Lưu bảng tiêu chí
          </Button>
        </div>
      </form>
    </div>
  );
}
