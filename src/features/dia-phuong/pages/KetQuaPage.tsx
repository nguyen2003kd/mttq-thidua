import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getGetApiV1MySubmissionsQueryKey, getGetApiV1SubmissionsIdQueryKey } from '@/api/endpoints/submissions';
import { getGetApiV1CriteriaGroupsQueryKey } from '@/api/endpoints/criteria-groups';
import { dataQueryKey } from '@/api/mutator/query-keys';
import { ArrowLeft, ChevronDown, ChevronRight, FileCheck, ListTree, MapPin, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button, EmptyState, PageHeader, PageLoading } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/core/SortableTableHead';
import { TableSortSelect } from '@/components/core/TableSortSelect';
import { sortTableRows, toggleTableSort, type TableSortState } from '@/lib/tableSorting';
import { cn } from '@/lib/utils';
import { getLocalityApiError, localityApi, mergeSubmissionCriteria, type CriteriaApi, type CriteriaGroupApi, type SubmissionApi, type SubmissionResultItem } from '@/features/dia-phuong/api/localityApi';

interface ResultGroupRow {
  group: CriteriaGroupApi;
  submission: SubmissionApi;
  proposedScore: number;
  proposedBonus: number;
  provinceScore: number | null;
  provinceBonus: number | null;
  proposedTotal: number;
  provinceTotal: number | null;
  resultsByCriteriaId: Map<string, SubmissionResultItem>;
}

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
}

function ScoreValue({ value, strong = false }: { value: number | null | undefined; strong?: boolean }) {
  return <span className={cn('tabular-nums text-foreground', strong ? 'font-semibold' : 'font-medium')}>{formatScore(value)}</span>;
}

function getGroupTotals(submission: SubmissionApi) {
  const activeResults = submission.results.filter((result) => result.criteriaStatus !== 'Deleted');
  const proposedScore = activeResults.reduce((total, result) => total + result.point, 0);
  const proposedBonus = activeResults.reduce((total, result) => total + result.bonusPoint, 0);
  const hasProvinceScore = activeResults.some((result) => result.officialPoint !== null || result.officialBonusPoint !== null);
  const provinceScore = hasProvinceScore ? activeResults.reduce((total, result) => total + (result.officialPoint ?? 0), 0) : null;
  const provinceBonus = hasProvinceScore ? activeResults.reduce((total, result) => total + (result.officialBonusPoint ?? 0), 0) : null;
  return { proposedScore, proposedBonus, provinceScore, provinceBonus, proposedTotal: proposedScore + proposedBonus, provinceTotal: provinceScore === null || provinceBonus === null ? null : provinceScore + provinceBonus };
}

function ChildResultRow({ criterion, result }: { criterion: CriteriaApi; result?: SubmissionResultItem }) {
  const hasProvinceScore = result?.officialPoint !== null && result?.officialPoint !== undefined || result?.officialBonusPoint !== null && result?.officialBonusPoint !== undefined;
  const proposedScore = result?.point;
  const proposedBonus = result?.bonusPoint;
  const provinceScore = hasProvinceScore ? result?.officialPoint : null;
  const provinceBonus = hasProvinceScore ? result?.officialBonusPoint : null;
  const proposedTotal = proposedScore === undefined || proposedBonus === undefined ? null : proposedScore + proposedBonus;
  const provinceTotal = provinceScore === null || provinceBonus === null ? null : provinceScore + provinceBonus;

  return <TableRow className="bg-muted/[0.18] hover:bg-muted/40">
    <TableCell className="border-r border-primary/10 px-4 py-3 pl-10 align-top"><div className="flex items-start gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/50" /><div><p className="whitespace-normal text-sm leading-5 text-foreground">{criterion.content}</p>{(criterion.status === 'Deleted' || result?.criteriaStatus === 'Deleted') && <Badge variant="secondary" className="mt-2">Vô hiệu</Badge>}</div></div></TableCell>
    <TableCell className="whitespace-normal border-r border-primary/10 px-4 py-3 align-top text-sm leading-5 text-muted-foreground">{result?.explanation || criterion.note || '—'}</TableCell>
    <TableCell className="border-r border-primary/10 px-4 py-3 text-right align-top"><ScoreValue value={criterion.maxPoint} /></TableCell>
    <TableCell className="border-r border-primary/10 px-4 py-3 text-right align-top"><ScoreValue value={proposedScore} /></TableCell>
    <TableCell className="border-r border-primary/10 px-4 py-3 text-right align-top"><ScoreValue value={proposedBonus} /></TableCell>
    <TableCell className="border-r border-primary/10 px-4 py-3 text-right align-top"><ScoreValue value={provinceScore} /></TableCell>
    <TableCell className="border-r border-primary/10 px-4 py-3 text-right align-top"><ScoreValue value={provinceBonus} /></TableCell>
    <TableCell className="border-r border-primary/10 px-4 py-3 text-right align-top"><ScoreValue value={proposedTotal} /></TableCell>
    <TableCell className="px-4 py-3 text-right align-top"><ScoreValue value={provinceTotal} /></TableCell>
  </TableRow>;
}

export default function KetQuaPage() {
  const localityId = useAuthStore((state) => state.user?.localityId);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [tableSort, setTableSort] = useState<TableSortState>(null);
  const submissionsQuery = useQuery({ queryKey: dataQueryKey(getGetApiV1MySubmissionsQueryKey(), { localityId, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }), queryFn: () => localityApi.listMySubmissions({ page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }), enabled: Boolean(localityId) });
  const groupsQuery = useQuery({ queryKey: dataQueryKey(getGetApiV1CriteriaGroupsQueryKey(), { view: 'list', page: 1, pageSize: 100 }), queryFn: () => localityApi.listCriteriaGroups({ page: 1, pageSize: 100 }), enabled: Boolean(localityId) });
  const publishedSubmissionIds = useMemo(
    () => (submissionsQuery.data?.items ?? []).filter((submission) => submission.currentStage === 'CommitteeFinalized').map((submission) => submission.id),
    [submissionsQuery.data?.items],
  );
  const submissionDetailsQueries = useQueries({
    queries: publishedSubmissionIds.map((submissionId) => ({
      queryKey: dataQueryKey(getGetApiV1SubmissionsIdQueryKey(submissionId)),
      queryFn: () => localityApi.getSubmission(submissionId),
      enabled: Boolean(submissionId),
    })),
  });

  const resultGroups = useMemo<ResultGroupRow[]>(() => {
    const groupsById = new Map((groupsQuery.data?.items ?? []).map((group) => [group.id, group]));
    return submissionDetailsQueries.map((query) => query.data).filter((submission): submission is SubmissionApi => Boolean(submission)).map((submission) => {
      const group = groupsById.get(submission.criteriaGroupId);
      if (!group) return null;
      const displayGroup = {
        ...group,
        criteria: mergeSubmissionCriteria(group.criteria, submission.results, submission.id),
      };
      return { group: displayGroup, submission, ...getGroupTotals(submission), resultsByCriteriaId: new Map(submission.results.map((result) => [result.criteriaId, result])) };
    }).filter((row): row is ResultGroupRow => row !== null).sort((left, right) => left.group.name.localeCompare(right.group.name, 'vi'));
  }, [groupsQuery.data?.items, submissionDetailsQueries]);
  const sortedResultGroups = sortTableRows(resultGroups, tableSort, {
    maxPoint: (row) => row.group.maxPoint,
    proposed: (row) => row.proposedScore,
    proposedBonus: (row) => row.proposedBonus,
    province: (row) => row.provinceScore,
    provinceBonus: (row) => row.provinceBonus,
    proposedTotal: (row) => row.proposedTotal,
    provinceTotal: (row) => row.provinceTotal,
  });
  const sortOptions = [
    { value: 'maxPoint-desc', label: 'Điểm chuẩn cao nhất', sort: { column: 'maxPoint', direction: 'desc' as const } },
    { value: 'proposed-desc', label: 'Điểm đề xuất cao nhất', sort: { column: 'proposed', direction: 'desc' as const } },
    { value: 'proposedBonus-desc', label: 'Điểm thưởng đề xuất cao nhất', sort: { column: 'proposedBonus', direction: 'desc' as const } },
    { value: 'province-desc', label: 'Điểm tỉnh cao nhất', sort: { column: 'province', direction: 'desc' as const } },
    { value: 'provinceBonus-desc', label: 'Điểm thưởng tỉnh cao nhất', sort: { column: 'provinceBonus', direction: 'desc' as const } },
    { value: 'proposedTotal-desc', label: 'Tổng điểm đề xuất cao nhất', sort: { column: 'proposedTotal', direction: 'desc' as const } },
    { value: 'provinceTotal-desc', label: 'Tổng điểm tỉnh cao nhất', sort: { column: 'provinceTotal', direction: 'desc' as const } },
  ];

  const totalProvinceScore = resultGroups.reduce((total, group) => total + (group.provinceTotal ?? 0), 0);
  const totalProposedScore = resultGroups.reduce((total, group) => total + group.proposedTotal, 0);
  const hasProvinceScore = resultGroups.some((group) => group.provinceTotal !== null);
  const toggleGroup = (groupId: string) => setExpandedGroupIds((current) => { const next = new Set(current); if (next.has(groupId)) next.delete(groupId); else next.add(groupId); return next; });

  if (!localityId) return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương nào." icon={<MapPin className="size-8" />} />;
  if (submissionsQuery.isLoading || groupsQuery.isLoading || submissionDetailsQueries.some((query) => query.isLoading)) return <div className="space-y-6"><PageHeader title={`Kết quả thi đua`} description="Điểm chính thức theo từng nhóm và tiêu chí." /><PageLoading label="Đang tải kết quả thi đua…" /></div>;
  if (submissionsQuery.isError || groupsQuery.isError || submissionDetailsQueries.some((query) => query.isError)) return <EmptyState title="Không tải được dữ liệu" description={getLocalityApiError(submissionsQuery.error ?? groupsQuery.error ?? submissionDetailsQueries.find((query) => query.error)?.error)} />;

  return <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
    <PageHeader title={`Kết quả thi đua`} description="Điểm chính thức đã công bố theo nhóm tiêu chí và tiêu chí con." actions={<Button variant="back" render={<Link to="/dia-phuong/tieu-chi" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />
    {resultGroups.length === 0 ? <EmptyState title="Kết quả chưa được công bố" description="Điểm chính thức sẽ hiển thị tại đây sau khi Ban Thường trực công bố kết quả." icon={<FileCheck className="size-8" />} /> : <>
      <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-[1.15fr_1fr_1fr]" aria-label="Tổng quan kết quả">
        <div className="bg-card px-5 py-4"><p className="text-xs font-medium text-muted-foreground">Điểm tỉnh chấm</p><p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{hasProvinceScore ? formatScore(totalProvinceScore) : '—'}</p></div>
        <div className="bg-card px-5 py-4"><p className="text-xs font-medium text-muted-foreground">Xã/phường đề xuất</p><p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatScore(totalProposedScore)}</p></div>
        <div className="bg-card px-5 py-4"><p className="text-xs font-medium text-muted-foreground">Nhóm tiêu chí đã công bố</p><p className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums text-foreground"><Trophy className="size-5 text-accent" />{resultGroups.length}</p></div>
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Bảng chi tiết kết quả">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"><ListTree className="size-5" /></span><div><h2 className="text-base font-semibold text-foreground">Chi tiết điểm theo nhóm tiêu chí</h2><p className="mt-0.5 text-sm text-muted-foreground">Bấm vào một nhóm để xem các tiêu chí con.</p></div></div><div className="flex flex-wrap items-center gap-2"><TableSortSelect sort={tableSort} options={sortOptions} onChange={setTableSort} /><Badge variant="secondary">{resultGroups.length} nhóm</Badge></div></div>
        <Table className="min-w-[1580px] table-fixed" containerClassName="max-w-full"><colgroup><col className="w-[19%]" /><col className="w-[17%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[9%]" /><col className="w-[9%]" /></colgroup>
          <TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 leading-5 text-primary-foreground">Tên tiêu chí</TableHead><TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 leading-5 text-primary-foreground">Nội dung</TableHead><SortableTableHead column="maxPoint" label="Điểm chuẩn" ariaLabel="Điểm chuẩn" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'maxPoint', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" /><SortableTableHead column="proposed" label="Địa phương đề xuất" ariaLabel="Địa phương đề xuất" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'proposed', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" /><SortableTableHead column="proposedBonus" label="Điểm thưởng đề xuất" ariaLabel="Điểm thưởng đề xuất" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'proposedBonus', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" /><SortableTableHead column="province" label="Điểm tỉnh chấm" ariaLabel="Điểm tỉnh chấm" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'province', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" /><SortableTableHead column="provinceBonus" label="Điểm thưởng tỉnh" ariaLabel="Điểm thưởng tỉnh" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'provinceBonus', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" /><SortableTableHead column="proposedTotal" label="Địa phương đề xuất + điểm thưởng đề xuất" ariaLabel="Tổng điểm đề xuất" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'proposedTotal', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" /><SortableTableHead column="provinceTotal" label="Tỉnh chấm + điểm thưởng tỉnh" ariaLabel="Tổng điểm tỉnh" sort={tableSort} onSort={() => setTableSort((current) => toggleTableSort(current, 'provinceTotal', 'desc'))} align="right" className="bg-primary text-right" /></TableRow></TableHeader>
          <TableBody>{sortedResultGroups.flatMap((resultGroup) => { const expanded = expandedGroupIds.has(resultGroup.group.id); const sortedCriteria = sortTableRows(resultGroup.group.criteria, tableSort, { maxPoint: (criterion) => criterion.maxPoint, proposed: (criterion) => resultGroup.resultsByCriteriaId.get(criterion.id)?.point, proposedBonus: (criterion) => resultGroup.resultsByCriteriaId.get(criterion.id)?.bonusPoint, province: (criterion) => resultGroup.resultsByCriteriaId.get(criterion.id)?.officialPoint, provinceBonus: (criterion) => resultGroup.resultsByCriteriaId.get(criterion.id)?.officialBonusPoint, proposedTotal: (criterion) => { const result = resultGroup.resultsByCriteriaId.get(criterion.id); return result ? result.point + result.bonusPoint : null; }, provinceTotal: (criterion) => { const result = resultGroup.resultsByCriteriaId.get(criterion.id); return result && (result.officialPoint !== null || result.officialBonusPoint !== null) ? (result.officialPoint ?? 0) + (result.officialBonusPoint ?? 0) : null; } }); return [
            <TableRow key={resultGroup.group.id} className="cursor-pointer bg-primary/[0.035] hover:bg-primary/[0.07]" onClick={() => toggleGroup(resultGroup.group.id)}><TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4"><div className="flex items-start gap-2"><span className="mt-0.5 text-primary">{expanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}</span><div><p className="font-semibold leading-5 text-foreground">{resultGroup.group.name}</p><p className="mt-1 text-xs text-muted-foreground">{resultGroup.group.criteria.length} tiêu chí con</p></div></div></TableCell><TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4 text-sm leading-5 text-muted-foreground">{resultGroup.group.content || '—'}</TableCell><TableCell className="border-r border-primary/15 px-4 py-4 text-right"><ScoreValue value={resultGroup.group.maxPoint} strong /></TableCell><TableCell className="border-r border-primary/15 px-4 py-4 text-right"><ScoreValue value={resultGroup.proposedScore} strong /></TableCell><TableCell className="border-r border-primary/15 px-4 py-4 text-right"><ScoreValue value={resultGroup.proposedBonus} strong /></TableCell><TableCell className="border-r border-primary/15 px-4 py-4 text-right"><ScoreValue value={resultGroup.provinceScore} strong /></TableCell><TableCell className="border-r border-primary/15 px-4 py-4 text-right"><ScoreValue value={resultGroup.provinceBonus} strong /></TableCell><TableCell className="border-r border-primary/15 px-4 py-4 text-right"><ScoreValue value={resultGroup.proposedTotal} strong /></TableCell><TableCell className="px-4 py-4 text-right"><ScoreValue value={resultGroup.provinceTotal} strong /></TableCell></TableRow>,
            ...(expanded ? sortedCriteria.map((criterion) => <ChildResultRow key={`${resultGroup.group.id}-${criterion.id}`} criterion={criterion} result={resultGroup.resultsByCriteriaId.get(criterion.id)} />) : []),
          ]; })}</TableBody>
        </Table>
      </section>
    </>}
  </div>;
}
