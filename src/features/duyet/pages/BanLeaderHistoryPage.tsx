import { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AuditTimeline, Button, PageHeader } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScoreStore } from '@/store/scoreStore';

/** COL.01.08 — lịch sử thao tác của Lãnh đạo ban. */
export default function BanLeaderHistoryPage() {
  const { banId = 'ban1' } = useParams<{ banId?: string }>();
  const audits = useScoreStore((state) => state.audits);
  const localities = useScoreStore((state) => state.localities);
  const [localityId, setLocalityId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const entries = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return audits
      .filter((entry) => entry.actorRole === 'LEADER')
      .filter((entry) => localityId === 'ALL' || entry.fieldName.endsWith(` - ${localityId}`))
      .filter((entry) => !keyword || `${entry.actorName} ${entry.fieldName} ${entry.reason ?? ''}`.toLocaleLowerCase('vi').includes(keyword))
      .filter((entry) => !fromDate || new Date(entry.timestamp) >= new Date(`${fromDate}T00:00:00`))
      .filter((entry) => !toDate || new Date(entry.timestamp) <= new Date(`${toDate}T23:59:59`))
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [audits, localityId, search, fromDate, toDate]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử duyệt tiêu chí"
        description="COL.01.08 · Theo dõi các lần Lãnh đạo ban chấm, yêu cầu bổ sung và trình Hội đồng."
        actions={<Button variant="outline" render={<Link to={`/thi-dua/duyet/lanh-dao-ban/${banId}`} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại danh sách</Button>}
      />
      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[minmax(210px,1fr)_minmax(230px,1fr)_160px_160px]">
        <Select value={localityId} onValueChange={(value) => setLocalityId(value ?? 'ALL')}>
          <SelectTrigger><SelectValue>{localityId === 'ALL' ? 'Tất cả địa phương' : undefined}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="ALL">Tất cả địa phương</SelectItem>{localities.map((locality) => <SelectItem key={locality.id} value={locality.id}>{locality.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm thao tác hoặc nội dung yêu cầu" className="pl-9" /></div>
        <Input type="date" aria-label="Từ ngày" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <Input type="date" aria-label="Đến ngày" value={toDate} onChange={(event) => setToDate(event.target.value)} />
      </div>
      <Card><CardContent className="p-5"><AuditTimeline entries={entries} /></CardContent></Card>
    </div>
  );
}
