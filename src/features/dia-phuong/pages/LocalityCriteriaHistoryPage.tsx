import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuditTimeline, Button, EmptyState, PageHeader } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';

export default function LocalityCriteriaHistoryPage() {
  const { id } = useParams<{ id?: string }>();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const audits = useScoreStore((state) => state.audits);
  const localityId = user?.localityId;
  const table = criteriaTables.find((item) => item.id === id);
  if (!table || !localityId) return <EmptyState title="Không tìm thấy lịch sử" description="Nhóm tiêu chí hoặc địa phương không hợp lệ." />;
  const entries = audits.filter((entry) => entry.fieldName.endsWith(` - ${localityId}`)).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  return <div className="space-y-5"><PageHeader title="Lịch sử nộp và chấm" description={table.name} actions={<Button variant="outline" render={<Link to={`/dia-phuong/tieu-chi/${table.id}`} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} /><Card><CardContent className="p-5"><AuditTimeline entries={entries} /></CardContent></Card></div>;
}
