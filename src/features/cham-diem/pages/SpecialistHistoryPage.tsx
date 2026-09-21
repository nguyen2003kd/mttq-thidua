import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ChevronLeft, ChevronRight, Layers3, MapPin, Pencil, Search } from 'lucide-react';
import { EmptyState, PageHeader, PageLoading } from '@/components/core';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
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
  return value === null ? '—' : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function cleanText(value: string | null) {
  return value?.replace(/\s+/g, ' ').trim() || null;
}

function ScoreValue({ label, oldValue, newValue }: { label: string; oldValue: number | null; newValue: number | null }) {
  if (oldValue === null && newValue === null) return null;

  return (
    <div className="grid grid-cols-[minmax(100px,auto)_minmax(72px,auto)_minmax(72px,auto)] items-center gap-x-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="justify-self-start rounded bg-muted/60 px-2 py-0.5 text-muted-foreground line-through decoration-muted-foreground/60">{formatScore(oldValue)}</span>
      <span className="justify-self-start rounded bg-primary/10 px-2 py-0.5 font-semibold text-primary">{formatScore(newValue)}</span>
    </div>
  );
}

function HistoryEvent({ history }: { history: SpecialistScoreHistoryApi }) {
  const changes = mergeScoreChanges(history.changes);

  return (
    <article className="relative pl-10 sm:pl-12">
      <div className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border bg-card text-primary shadow-sm sm:left-1">
        <Pencil className="size-4" />
      </div>
      <div className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="border-b px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-foreground">{history.actorName} đã sửa điểm</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-2.5 py-1.5">
                  <CalendarClock className="size-3.5 shrink-0" />
                  {formatDateTime(history.createdAt)}
                </span>
                {history.localityName && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-2.5 py-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {history.localityName}
                  </span>
                )}
                {history.criteriaGroupName && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-2.5 py-1.5">
                    <Layers3 className="size-3.5 shrink-0" />
                    {history.criteriaGroupName}
                  </span>
                )}
              </div>
            </div>
          </div>
          {history.reason && <p className="mt-3 rounded-md bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">“{history.reason}”</p>}
        </div>

        <div className="divide-y">
          {changes.map((change) => (
            <div key={change.submissionResultId} className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,auto)] lg:items-center">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{cleanText(change.criteriaContent) || 'Tiêu chí chưa có tên'}</p>
                <p className="mt-1 text-xs text-muted-foreground">Điểm của tiêu chí</p>
              </div>
              <div className="w-fit max-w-full space-y-2 rounded-lg border bg-muted/10 p-3">
                <div className="grid grid-cols-[minmax(100px,auto)_minmax(72px,auto)_minmax(72px,auto)] gap-x-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span />
                  <span>Giá trị cũ</span>
                  <span>Giá trị mới</span>
                </div>
                <ScoreValue label="Điểm" oldValue={change.oldPoint} newValue={change.newPoint} />
                <ScoreValue label="Điểm thưởng" oldValue={change.oldBonusPoint} newValue={change.newBonusPoint} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function SpecialistHistoryPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const search = useDebounce(searchInput, 350);

  const query = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    ...(search ? { search } : {}),
    ...(wardCode.trim() ? { wardCode: wardCode.trim() } : {}),
    ...(fromDate ? { from: new Date(`${fromDate}T00:00:00`).toISOString() } : {}),
    ...(toDate ? { to: new Date(`${toDate}T23:59:59.999`).toISOString() } : {}),
  }), [page, search, wardCode, fromDate, toDate]);

  const historiesQuery = useQuery({
    queryKey: ['specialist-score-histories', query],
    queryFn: () => specialistApi.listScoreHistories(query),
  });

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setSearchInput('');
    setWardCode('');
    setFromDate('');
    setToDate('');
    resetPage();
  };

  if (historiesQuery.isPending) return <PageLoading label="Đang tải lịch sử chấm tiêu chí…" />;
  if (historiesQuery.isError) {
    return <EmptyState variant="error" title="Không tải được lịch sử chấm tiêu chí" description={historiesQuery.error instanceof Error ? historiesQuery.error.message : 'Vui lòng thử lại sau.'} />;
  }

  const result = historiesQuery.data;
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader title="Lịch sử chấm tiêu chí" description="Theo dõi các lần chuyên viên chấm và điều chỉnh điểm theo từng hồ sơ." />
      <HistoryFilters search={searchInput} setSearch={setSearchInput} wardCode={wardCode} setWardCode={setWardCode} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} onReset={resetPage} onClear={clearFilters} />

      {!result || result.items.length === 0 ? (
        <EmptyState title="Chưa có lịch sử chấm tiêu chí" description="Thử thay đổi điều kiện lọc hoặc thực hiện chấm điểm trên một hồ sơ." />
      ) : (
        <section className="space-y-4">
          {result.items.map((history) => <HistoryEvent key={history.id} history={history} />)}
          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">{result.total} lần thao tác · Trang {result.page}/{totalPages}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft className="size-4" />Trước
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                Sau<ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function HistoryFilters({
  search,
  setSearch,
  wardCode,
  setWardCode,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onReset,
  onClear,
}: {
  search: string;
  setSearch: (value: string) => void;
  wardCode: string;
  setWardCode: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  onReset: () => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[minmax(240px,1.4fr)_minmax(180px,1fr)_160px_160px_auto_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => { setSearch(event.target.value); onReset(); }} placeholder="Tìm tiêu chí, nhóm tiêu chí hoặc lý do" className="pl-9" />
      </div>
      <Input value={wardCode} onChange={(event) => { setWardCode(event.target.value); onReset(); }} placeholder="Mã địa phương" />
      <Input type="date" aria-label="Từ ngày" value={fromDate} onChange={(event) => { setFromDate(event.target.value); onReset(); }} />
      <Input type="date" aria-label="Đến ngày" value={toDate} onChange={(event) => { setToDate(event.target.value); onReset(); }} />
      <Button type="button" variant="outline" onClick={onClear}>Xóa bộ lọc</Button>
      <Button type="button" onClick={onReset}><Search className="size-4" />Tìm kiếm</Button>
    </div>
  );
}
