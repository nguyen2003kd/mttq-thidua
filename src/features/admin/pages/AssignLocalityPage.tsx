import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export default function AssignLocalityPage() {
  const { id } = useParams<{ id: string }>();
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const assignLocality = useScoreStore((s) => s.assignLocality);

  const table = useMemo(() => criteriaTables.find((t) => t.id === id), [criteriaTables, id]);
  const assigned = useMemo(() => new Set(id ? assignments[id] ?? [] : []), [assignments, id]);

  if (!table) {
    return (
      <EmptyState
        title="Không tìm thấy bảng tiêu chí"
        description="Bảng tiêu chí không tồn tại hoặc đã bị xóa."
        icon={<Building2 className="h-8 w-8" />}
      />
    );
  }

  const toggle = (localityId: string) => {
    const next = !assigned.has(localityId);
    assignLocality(table.id, localityId, next);
    toast.success(next ? 'Đã gán địa phương' : 'Đã bỏ gán', {
      description: localities.find((l) => l.id === localityId)?.name,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Gán địa phương — ${table.name}`}
        description="Chọn địa phương tham gia chấm điểm theo bảng tiêu chí này."
      />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {localities.map((loc) => (
              <label
                key={loc.id}
                htmlFor={`loc-${loc.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{loc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{loc.region}</p>
                </div>
                <Checkbox
                  id={`loc-${loc.id}`}
                  checked={assigned.has(loc.id)}
                  onCheckedChange={() => toggle(loc.id)}
                />
              </label>
            ))}
          </div>
          {localities.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">Chưa có địa phương nào trong hệ thống.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
