import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, Eye, FileSearch, History, Search } from 'lucide-react';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState, Button, ScoreStateBadge, TableColumnVisibility } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTrailPopup } from '@/features/workflow/components';
import type { Locality } from '@/types/domain';

export default function ScoreByCriteriaPage() {
  const { id } = useParams<{ id?: string }>();
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const audits = useScoreStore((state) => state.audits);
  const [search, setSearch] = useState('');
  const [historyLocality, setHistoryLocality] = useState<Locality | null>(null);

  const table = criteriaTables.find((item) => item.id === id) ?? criteriaTables[0];
  const rows = useMemo(() => {
    if (!table) return [];
    const keyword = search.trim().toLocaleLowerCase('vi');
    return localities
      .filter((locality) => assignments[table.id]?.includes(locality.id))
      .filter((locality) => !keyword || `${locality.name} ${locality.code}`.toLocaleLowerCase('vi').includes(keyword))
      .map((locality) => ({ locality, record: scores[table.id]?.[locality.id] ?? emptyRecord }));
  }, [table, search, localities, assignments, scores, emptyRecord]);

  if (!table) {
    return <EmptyState title="Chưa có nhóm tiêu chí" description="Tạo và áp dụng nhóm tiêu chí trước khi chấm điểm." icon={<FileSearch className="h-8 w-8" />} />;
  }

  const waiting = rows.filter((row) => row.record.state === 'CHO_CHUYEN_VIEN').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Chuyên viên chấm tiêu chí thi đua" description="COL.01.04 · Chọn địa phương để xem nhóm tiêu chí, minh chứng và thực hiện chấm điểm." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Địa phương đã áp dụng</p><p className="mt-1 text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Chờ chuyên viên</p><p className="mt-1 text-2xl font-bold text-primary">{waiting}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Đã chuyển cấp trên</p><p className="mt-1 text-2xl font-bold">{rows.length - waiting}</p></CardContent></Card>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{table.name}</p>
            <p className="text-xs text-muted-foreground">Danh sách địa phương</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm địa phương..." className="pl-9" />
            </div>
            <TableColumnVisibility
              storageKey="score-by-criteria-localities"
              columns={[
                { id: 'locality', label: 'Địa phương' },
                { id: 'code', label: 'Mã' },
                { id: 'score', label: 'Tổng điểm hiện tại' },
                { id: 'status', label: 'Trạng thái' },
                { id: 'actions', label: 'Thao tác' },
              ]}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table data-column-visibility-table="score-by-criteria-localities">
            <TableHeader><TableRow className="bg-muted/35"><TableHead>Địa phương</TableHead><TableHead>Mã</TableHead><TableHead className="text-center">Tổng điểm hiện tại</TableHead><TableHead className="text-center">Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(({ locality, record }) => (
                <TableRow key={locality.id}>
                  <TableCell><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="font-medium">{locality.name}</span></div></TableCell>
                  <TableCell className="text-muted-foreground">{locality.code}</TableCell>
                  <TableCell className="text-center font-semibold tabular-nums">{record.totalScore}</TableCell>
                  <TableCell className="text-center"><ScoreStateBadge state={record.state} /></TableCell>
                  <TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setHistoryLocality(locality)}><History className="mr-1.5 h-3.5 w-3.5" />Lịch sử</Button><Button size="sm" render={<Link to={`/thi-dua/cham-diem/theo-dia-phuong/${locality.id}`} />} nativeButton={false}><Eye className="mr-1.5 h-3.5 w-3.5" />Xem chi tiết</Button></div></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">Không tìm thấy địa phương phù hợp.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <AuditTrailPopup open={!!historyLocality} onOpenChange={(open) => { if (!open) setHistoryLocality(null); }} title={historyLocality?.name} entries={historyLocality ? audits.filter((item) => item.fieldName.endsWith(` - ${historyLocality.id}`)) : []} />
    </div>
  );
}
