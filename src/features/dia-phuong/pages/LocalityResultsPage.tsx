import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, FileText, Medal, Search, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, EmptyState, PageHeader, TruncatedText } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScoreGroupInput, StatusStepper } from '@/features/workflow/components';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { useState } from 'react';

function classification(score: number, maxScore: number) {
  const ratio = maxScore ? score / maxScore : 0;
  if (ratio >= 0.9) return 'Hoàn thành xuất sắc';
  if (ratio >= 0.8) return 'Hoàn thành tốt';
  if (ratio >= 0.65) return 'Hoàn thành';
  return 'Chưa hoàn thành';
}

export default function LocalityResultsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const evidence = useScoreStore((state) => state.evidence);
  const getRanking = useScoreStore((state) => state.getRanking);
  const [search, setSearch] = useState('');
  const localityId = user?.localityId;
  const published = criteriaTables.filter((table) => localityId && assignments[table.id]?.includes(localityId) && scores[table.id]?.[localityId]?.state === 'DA_CONG_BO');
  const table = published.find((item) => item.id === id);
  const record = table && localityId ? scores[table.id]?.[localityId] : undefined;

  if (!localityId) return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương." />;

  if (!id) {
    const keyword = search.trim().toLocaleLowerCase('vi');
    const rows = published.filter((item) => !keyword || `${item.name} ${item.content ?? ''}`.toLocaleLowerCase('vi').includes(keyword));
    return <div className="space-y-5"><PageHeader title="Kết quả tiêu chí thi đua" description="COL.01.03 · Chỉ hiển thị kết quả đã được Ủy ban công bố" /><div className="flex gap-2 rounded-lg border bg-card p-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm kiếm kết quả" /></div><Button><Search className="size-4" />Tìm kiếm</Button></div>
      {rows.length === 0 ? <Card><CardContent className="p-10 text-center"><Trophy className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-semibold">Chưa có kết quả được công bố</p><p className="mt-1 text-sm text-muted-foreground">Kết quả sẽ xuất hiện tại đây sau khi hồ sơ ở trạng thái Đã công bố.</p></CardContent></Card> : <div className="overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><Table className="min-w-[1350px]"><TableHeader><TableRow className="bg-muted/70"><TableHead>Nhóm tiêu chí</TableHead><TableHead>Nội dung</TableHead><TableHead className="text-right">Tổng điểm đề xuất</TableHead><TableHead className="text-right">Tổng điểm thưởng</TableHead><TableHead className="text-center">Quyết định kết quả</TableHead><TableHead className="text-right">Tổng điểm chính thức</TableHead><TableHead className="text-center">Kết quả xếp loại</TableHead><TableHead className="text-right">Thứ hạng</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>{rows.map((item) => { const rowRecord = scores[item.id][localityId]; const ranking = getRanking(item.id); const rank = ranking.findIndex((entry) => entry.locality.id === localityId) + 1; const proposed = rowRecord.entries.reduce((sum, entry) => sum + (entry.proposedScore ?? 0), 0); const bonus = rowRecord.entries.reduce((sum, entry) => sum + (entry.proposedBonusScore ?? 0), 0); return <TableRow key={item.id}><TableCell className="min-w-56 font-medium">{item.name}</TableCell><TableCell className="max-w-xs text-muted-foreground"><TruncatedText value={item.content} /></TableCell><TableCell className="text-right tabular-nums">{proposed}</TableCell><TableCell className="text-right tabular-nums">{bonus}</TableCell><TableCell className="text-center"><Badge className="h-8 bg-foreground px-3 text-sm text-background">Đã công bố</Badge></TableCell><TableCell className="text-right text-lg font-bold tabular-nums">{rowRecord.totalScore}</TableCell><TableCell className="text-center"><Badge className="h-8 bg-success px-3 text-sm text-white">{classification(rowRecord.totalScore, item.totalScore)}</Badge></TableCell><TableCell className="text-right font-bold">#{rank}/{ranking.length}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/dia-phuong/ket-qua/${item.id}`)}><Eye className="size-4" />Xem</Button></TableCell></TableRow>; })}</TableBody></Table></div></div>}</div>;
  }

  if (!table || !record) return <EmptyState title="Kết quả chưa được công bố" description="Chi tiết chỉ hiển thị khi hồ sơ ở trạng thái Đã công bố." action={<Button variant="outline" render={<Link to="/dia-phuong/ket-qua" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />;
  const ranking = getRanking(table.id);
  const rank = ranking.findIndex((entry) => entry.locality.id === localityId) + 1;
  return <div className="space-y-5"><PageHeader title="Chi tiết kết quả thi đua" description={table.name} actions={<Button variant="outline" render={<Link to="/dia-phuong/ket-qua" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} /><StatusStepper state={record.state} /><div className="grid gap-3 sm:grid-cols-3"><Card className="border-success/30"><CardContent className="p-5"><Trophy className="size-5 text-success" /><p className="mt-3 text-sm text-muted-foreground">Quyết định kết quả</p><Badge className="mt-2 h-9 bg-foreground px-4 text-sm text-background">Đã công bố</Badge></CardContent></Card><Card className="border-success/30"><CardContent className="p-5"><Medal className="size-5 text-success" /><p className="mt-3 text-sm text-muted-foreground">Kết quả xếp loại</p><Badge className="mt-2 h-9 bg-success px-4 text-sm text-white">{classification(record.totalScore, table.totalScore)}</Badge></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Tổng điểm chính thức</p><p className="mt-2 text-3xl font-bold tabular-nums">{record.totalScore}<span className="text-base font-normal text-muted-foreground">/{table.totalScore}</span></p><p className="mt-2 text-sm font-semibold">Thứ hạng #{rank}/{ranking.length}</p></CardContent></Card></div><ScoreGroupInput criteria={table.criteria} record={record} evidence={evidence} localityId={localityId} mode="result" />{record.decisionAttachments?.length ? <Card><CardContent className="space-y-2 p-5"><p className="font-semibold">Quyết định đính kèm</p>{record.decisionAttachments.map((file) => <div key={file.id} className="flex items-center gap-2 rounded-md border p-3 text-sm"><FileText className="size-4 text-primary" />{file.fileName}</div>)}</CardContent></Card> : null}</div>;
}
