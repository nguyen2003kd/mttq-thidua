import { useState } from 'react';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';

export default function DeadlineConfigPage() {
  const deadline = useScoreStore((s) => s.deadline);
  const setDeadline = useScoreStore((s) => s.setDeadline);
  const [date, setDate] = useState(deadline);

  const handleSave = () => {
    if (!date) {
      toast.error('Vui lòng chọn ngày hết hạn.');
      return;
    }
    setDeadline(date);
    toast.success('Đã cập nhật thời hạn', { description: date });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình thời hạn"
        description="Thiết lập ngày hết hạn cho đợt thi đua khen thưởng."
      />
      <Card className="max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Thời hạn nộp / xét duyệt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Ngày hết hạn</Label>
            <Input id="deadline" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button onClick={handleSave} action="edit">Lưu thời hạn</Button>
        </CardContent>
      </Card>
    </div>
  );
}
