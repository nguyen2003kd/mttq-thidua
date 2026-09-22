import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, FilePenLine, Layers3, MapPin, RotateCcw, Search, UserRound } from 'lucide-react';
import { Button, EmptyState, PageHeader, PageLoading } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/lib/utils';
import { specialistApi, type SpecialistScoreChangeApi, type SpecialistScoreHistoryApi } from '../api/specialistApi';

const PAGE_SIZE = 20;

interface MergedScoreChange {
  submissionResultId: string;
  criteriaId: string;
  criteriaContent: string | null;
  oldPoint: number | null;
  newPoint: number | null;
  oldBonusPoint: number | null;
  newBonusPoint: number | null;
}

function mergeScoreChanges(changes: SpecialistScoreChangeApi[]): MergedScoreChange[] {
  const grouped = new Map<string, MergedScoreChange>();
  for (const change of changes) {
    const current = grouped.get(change.submissionResultId);
    if (current) {
      current.oldPoint ??= change.oldPoint;
      current.newPoint ??= change.newPoint;
      current.oldBonusPoint ??= change.oldBonusPoint;
      current.newBonusPoint ??= change.newBonusPoint;
      continue;
    }
    grouped.set(change.submissionResultId, { ...change });
  }
  return [...grouped.values()];
}

function formatScore(value: number | null) {
  return value === null ? 'Chưa có' : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function cleanText(value: string | null) {
  return value?.replace(/\s+/g, ' ').trim() || null;
}

function ScoreChange({ label, oldValue, newValue }: { label: string; oldValue: number | null; newValue: number | null }) {
  if (oldValue === null && newValue === null) return null;
  return <div className="grid grid-cols-[minmax(92px,1fr)_auto_16px_auto] items-center gap-x-2 rounded-md border border-border bg-background px-3 py-2 text-sm sm:grid-cols-[minmax(118px,1fr)_auto_20px_auto] sm:gap-x-3"><span className="font-medium text-foreground">{label}</span><span className="min-w-14 text-right tabular-nums text-muted-foreground line-through decoration-muted-foreground/60">{formatScore(oldValue)}</span><ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /><span className="min-w-14 text-right font-semibold tabular-nums text-primary">{formatScore(newValue)}</span></div>;
}

function HistoryEvent({ history, isLast }: { history: SpecialistScoreHistoryApi; isLast: boolean }) {
  const changes = mergeScoreChanges(history.changes);
  return <li className="relative grid gap-3 py-5 pl-12 sm:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1.2fr)_auto] sm:items-start sm:gap-6 sm:pl-14">
    {!isLast && <span aria-hidden="true" className="absolute left-[15px] top-10 h-[calc(100%-12px)] w-px bg-border sm:left-[19px]" />}
    <span className="absolute left-0 top-5 flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground sm:left-1"><FilePenLine className="size-4" aria-hidden="true" /></span>
    <div className="min-w-0"><p className="flex items-center gap-2 text-sm font-semibold text-foreground"><UserRound className="size-4 shrink-0 text-primary" aria-hidden="true" />{history.actorName} đã sửa điểm</p><div className="mt-2 space-y-1.5 text-xs text-muted-foreground"><p className="flex items-center gap-1.5"><CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />{formatDateTime(history.createdAt)}</p>{history.localityName && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{history.localityName}</span></p>}{history.criteriaGroupName && <p className="flex items-start gap-1.5"><Layers3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{history.criteriaGroupName}</span></p>}</div></div>
    <div className="min-w-0 space-y-3">{history.reason ? <div className="border-l-2 border-primary bg-muted/30 px-3 py-2.5"><p className="text-xs font-medium text-muted-foreground">Lý do sửa điểm</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{history.reason}</p></div> : <p className="border-l-2 border-border px-3 py-2 text-sm text-muted-foreground">Chưa nhập lý do sửa điểm.</p>}{changes.map((change) => <div key={change.submissionResultId} className="rounded-lg border border-border bg-surface-muted/60 p-3"><p className="text-sm font-semibold leading-5 text-foreground">{cleanText(change.criteriaContent) || 'Tiêu chí chưa có tên'}</p><div className="mt-3 grid gap-2"><ScoreChange label="Điểm" oldValue={change.oldPoint} newValue={change.newPoint} /><ScoreChange label="Điểm thưởng" oldValue={change.oldBonusPoint} newValue={change.newBonusPoint} /></div></div>)}</div>
    <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">Cập nhật điểm</span>
  </li>;
}

export default function SpecialistHistoryPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const search = useDebounce(searchInput, 350);
  const query = useMemo(() => ({ page, pageSize: PAGE_SIZE, sortBy: 'createdAt', sortOrder: 'desc' as const, ...(search ? { search } : {}), ...(wardCode.trim() ? { wardCode: wardCode.trim() } : {}), ...(fromDate ? { from: new Date(`${fromDate}T00:00:00`).toISOString() } : {}), ...(toDate ? { to: new Date(`${toDate}T23:59:59.999`).toISOString() } : {}) }), [page, search, wardCode, fromDate, toDate]);
  const historiesQuery = useQuery({ queryKey: ['specialist-score-histories', query], queryFn: () => specialistApi.listScoreHistories(query) });
  const resetPage = () => setPage(1);
  const clearFilters = () => { setSearchInput(''); setWardCode(''); setFromDate(''); setToDate(''); resetPage(); };

  if (historiesQuery.isPending) return <PageLoading label="Đang tải lịch sử chấm tiêu chí…" />;
  if (historiesQuery.isError) return <EmptyState variant="error" title="Không tải được lịch sử chấm tiêu chí" description={historiesQuery.error instanceof Error ? historiesQuery.error.message : 'Vui lòng thử lại sau.'} />;
  const result = historiesQuery.data;
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-6"><PageHeader title="Lịch sử chấm tiêu chí" description="Theo dõi rõ từng lần điều chỉnh điểm, lý do và tiêu chí liên quan." /><HistoryFilters search={searchInput} setSearch={setSearchInput} wardCode={wardCode} setWardCode={setWardCode} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} onReset={resetPage} onClear={clearFilters} />{!result || result.items.length === 0 ? <EmptyState title="Chưa có lịch sử chấm tiêu chí" description="Thử thay đổi điều kiện lọc hoặc thực hiện chấm điểm trên một hồ sơ." /> : <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="Danh sách lịch sử chấm tiêu chí"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5"><div><h2 className="text-base font-semibold text-foreground">Các lần cập nhật điểm</h2><p className="mt-0.5 text-xs text-muted-foreground">Mỗi mục hiển thị điểm trước và sau khi điều chỉnh.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">{result.total} lần cập nhật</span></div><ol className="divide-y divide-border px-4 sm:px-5">{result.items.map((history, index) => <HistoryEvent key={history.id} history={history} isLast={index === result.items.length - 1} />)}</ol><Pagination page={page} totalPages={totalPages} result={result} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => value + 1)} /></section>}</div>;
}

function Pagination({ page, totalPages, result, onPrevious, onNext }: { page: number; totalPages: number; result: { total: number; page: number; pageSize: number }; onPrevious: () => void; onNext: () => void }) {
  const firstItem = (result.page - 1) * result.pageSize + 1;
  const lastItem = Math.min(result.total, result.page * result.pageSize);
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm sm:px-5"><span className="text-muted-foreground">Hiển thị {firstItem}–{lastItem} trong {result.total} lần cập nhật</span><div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground sm:inline">Trang {result.page}/{totalPages}</span><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={onPrevious}><ChevronLeft className="size-4" />Trước</Button><Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>Sau<ChevronRight className="size-4" /></Button></div></div>;
}

function HistoryFilters({ search, setSearch, wardCode, setWardCode, fromDate, setFromDate, toDate, setToDate, onReset, onClear }: { search: string; setSearch: (value: string) => void; wardCode: string; setWardCode: (value: string) => void; fromDate: string; setFromDate: (value: string) => void; toDate: string; setToDate: (value: string) => void; onReset: () => void; onClear: () => void }) {
  return <section className="rounded-lg border border-border bg-surface p-4" aria-label="Lọc lịch sử chấm tiêu chí"><div className="mb-3"><h2 className="text-sm font-semibold text-foreground">Tìm lịch sử</h2><p className="mt-0.5 text-xs text-muted-foreground">Nhập thông tin cần tìm hoặc giới hạn khoảng thời gian.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_minmax(180px,1fr)_170px_170px_auto_auto] xl:items-end"><div className="space-y-1.5"><Label htmlFor="history-search">Từ khóa</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="history-search" value={search} onChange={(event) => { setSearch(event.target.value); onReset(); }} placeholder="Tiêu chí, nhóm tiêu chí hoặc lý do" className="pl-9" /></div></div><div className="space-y-1.5"><Label htmlFor="history-locality">Mã địa phương</Label><Input id="history-locality" value={wardCode} onChange={(event) => { setWardCode(event.target.value); onReset(); }} placeholder="Ví dụ: 26122" /></div><div className="space-y-1.5"><Label htmlFor="history-from">Từ ngày</Label><Input id="history-from" type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); onReset(); }} /></div><div className="space-y-1.5"><Label htmlFor="history-to">Đến ngày</Label><Input id="history-to" type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); onReset(); }} /></div><Button type="button" variant="outline" onClick={onClear}><RotateCcw className="size-4" />Xóa lọc</Button><Button type="button" onClick={onReset}><Search className="size-4" />Tìm kiếm</Button></div></section>;
}
