import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { AuditTimeline, PageHeader, Button } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScoreStore } from '@/store/scoreStore';

/** COL.01.10 — Lịch sử duyệt tiêu chí thi đua của Hội đồng. */
export default function CouncilHistoryPage() {
  const audits = useScoreStore((state) => state.audits);
  const localities = useScoreStore((state) => state.localities);
  const [localityId, setLocalityId] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const entries = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return audits
      .filter((entry) => entry.actorRole === 'COUNCIL')
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
        description="Theo dõi thời điểm duyệt, nhận xét và yêu cầu Chuyên viên bổ sung của Hội đồng."
        actions={(
          <Button variant="outline" render={<Link to="/thi-dua/duyet/hoi-dong-tdkt" />} nativeButton={false}>
            <ArrowLeft className="mr-1.5 size-4" />Quay lại danh sách
          </Button>
        )}
      />

      <div className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 xl:grid-cols-[minmax(190px,1fr)_minmax(220px,1fr)_160px_160px_auto]">
        <Select value={localityId} onValueChange={(value) => setLocalityId(value ?? 'ALL')}>
          <SelectTrigger aria-label="Lọc lịch sử theo địa phương"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả địa phương</SelectItem>
            {localities.map((locality) => <SelectItem key={locality.id} value={locality.id}>{locality.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') setSearch(searchInput.trim()); }}
            placeholder="Tìm người duyệt, nội dung, lý do"
            className="pl-9"
          />
        </div>
        <Input type="date" aria-label="Lọc từ ngày" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <Input type="date" aria-label="Lọc đến ngày" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        <Button type="button" onClick={() => setSearch(searchInput.trim())}><Search className="size-4" />Tìm kiếm</Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <AuditTimeline entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
