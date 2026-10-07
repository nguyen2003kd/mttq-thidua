import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getGetApiV1SubmissionsQueryKey, getGetApiV1SubmissionsIdQueryKey } from '@/api/endpoints/submissions';
import { getGetApiV1PeriodsQueryKey } from '@/api/endpoints/periods';
import { apiQueryKey, dataQueryKey } from '@/api/mutator/query-keys';
import {
  Award,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  Search,
  Trophy,
} from "lucide-react";
import { Button, EmptyState, FilterSelect, PageHeader, PageLoading } from "@/components/core";
import { SortableTableHead } from '@/components/core/SortableTableHead';
import { TableSortSelect, type TableSortOption } from '@/components/core/TableSortSelect';
import { sortTableRows, toggleTableSort, type TableSortState } from '@/lib/tableSorting';
import { useQueryFilters } from "@/hooks/useQueryFilters";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  isRealSubmission,
  specialistApi,
  type SubmissionApi,
  type SubmissionStage,
} from "@/features/cham-diem/api/specialistApi";
import { clustersApi } from "@/features/admin/api/clustersApi";
import { periodsApi } from "@/features/admin/api/periodsApi";
import { useAuthStore } from "@/store/authStore";
import { ResultPublicationDialog } from "@/features/duyet/components/ResultPublicationDialog";
import { resultPublicationApi } from "@/features/duyet/api/resultPublicationApi";
import { toast } from "sonner";

const EmbeddedSpecialistReviewPage = lazy(() => import('./SpecialistReviewPage'));

interface ScoreTotals {
  proposedScore: number;
  proposedBonus: number;
  provinceScore: number;
  provinceBonus: number;
  hasProvinceScore: boolean;
}

type Classification = "EXCELLENT" | "GOOD" | "FAIR" | "UNSCORED";

interface LocalityScoreSummary extends ScoreTotals {
  localityId: string;
  localityName: string;
  clusterId: string;
  cluster: string;
  clusterOrder: number;
  localityOrder: number;
  submissions: SubmissionApi[];
  proposedTotal: number;
  provinceTotal: number | null;
  proposedClassification: Classification;
  provinceClassification: Classification;
}

const UNASSIGNED_CLUSTER_ID = "__unassigned__";

const SCORE_SUMMARY_SORT_OPTIONS: TableSortOption[] = [
  { value: 'proposedScore-desc', label: 'Điểm địa phương cao nhất', sort: { column: 'proposedScore', direction: 'desc' } },
  { value: 'proposedBonus-desc', label: 'Điểm thưởng địa phương cao nhất', sort: { column: 'proposedBonus', direction: 'desc' } },
  { value: 'provinceScore-desc', label: 'Điểm tỉnh cao nhất', sort: { column: 'provinceScore', direction: 'desc' } },
  { value: 'provinceBonus-desc', label: 'Điểm thưởng tỉnh cao nhất', sort: { column: 'provinceBonus', direction: 'desc' } },
  { value: 'proposedTotal-desc', label: 'Tổng điểm địa phương cao nhất', sort: { column: 'proposedTotal', direction: 'desc' } },
  { value: 'provinceTotal-desc', label: 'Tổng điểm tỉnh cao nhất', sort: { column: 'provinceTotal', direction: 'desc' } },
];

const SCORE_DETAIL_SORT_OPTIONS: TableSortOption[] = [
  { value: 'proposed-desc', label: 'Điểm địa phương cao nhất', sort: { column: 'proposed', direction: 'desc' } },
  { value: 'proposedBonus-desc', label: 'Điểm thưởng địa phương cao nhất', sort: { column: 'proposedBonus', direction: 'desc' } },
  { value: 'province-desc', label: 'Điểm tỉnh cao nhất', sort: { column: 'province', direction: 'desc' } },
  { value: 'provinceBonus-desc', label: 'Điểm thưởng tỉnh cao nhất', sort: { column: 'provinceBonus', direction: 'desc' } },
  { value: 'proposedTotal-desc', label: 'Tổng điểm địa phương cao nhất', sort: { column: 'proposedTotal', direction: 'desc' } },
  { value: 'provinceTotal-desc', label: 'Tổng điểm tỉnh cao nhất', sort: { column: 'provinceTotal', direction: 'desc' } },
];

function normalizeWardCode(code: string) {
  return code.trim().replace(/^loc-/i, "").toLowerCase();
}

async function listClustersWithWards(queryClient: QueryClient) {
  const clusters = await queryClient.fetchQuery({
    queryKey: dataQueryKey(apiQueryKey({}, { url: '/api/v1/clusters' })),
    queryFn: () => clustersApi.list(),
  });
  // Một số response danh sách chỉ có wardCount; lấy detail khi thiếu danh sách xã/phường.
  return Promise.all(clusters.map((cluster) =>
    (cluster.wards?.length ?? 0) < cluster.wardCount
      ? queryClient.fetchQuery({
        queryKey: dataQueryKey(apiQueryKey({}, { url: `/api/v1/clusters/${cluster.id}` })),
        queryFn: () => clustersApi.get(cluster.id),
      })
      : cluster,
  ));
}

function normalizeLocalityCode(submission: SubmissionApi) {
  return normalizeWardCode(
    submission.createdByWardCode ??
    submission.createdBy ??
    `submission:${submission.id}`,
  );
}

function getTotals(submissions: SubmissionApi[]): ScoreTotals {
  return submissions.reduce<ScoreTotals>(
    (totals, submission) =>
      submission.results.filter((result) => result.criteriaStatus !== 'Deleted').reduce<ScoreTotals>(
        (resultTotals, result) => ({
          proposedScore: resultTotals.proposedScore + result.point,
          proposedBonus: resultTotals.proposedBonus + result.bonusPoint,
          provinceScore:
            resultTotals.provinceScore + (result.officialPoint ?? 0),
          provinceBonus:
            resultTotals.provinceBonus + (result.officialBonusPoint ?? 0),
          hasProvinceScore:
            resultTotals.hasProvinceScore ||
            result.officialPoint !== null ||
            result.officialBonusPoint !== null,
        }),
        totals,
      ),
    {
      proposedScore: 0,
      proposedBonus: 0,
      provinceScore: 0,
      provinceBonus: 0,
      hasProvinceScore: false,
    },
  );
}

function classifyScore(score: number | null): Classification {
  if (score === null) return "UNSCORED";
  const scoreForClassification = Math.min(score, 100);
  if (scoreForClassification >= 95) return "EXCELLENT";
  if (scoreForClassification >= 85) return "GOOD";
  return "FAIR";
}

function formatScore(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    value,
  );
}

/** Chỉ hồ sơ đã qua bước Chuyên viên trưởng duyệt mới được tính vào bảng tổng hợp. */
const SUMMARY_STAGES: readonly SubmissionStage[] = ["SpecialistApproved", "ReviewerApproved"];

async function listEverySubmission(periodId?: string) {
  const firstPage = await specialistApi.listAllSubmissions({
    includeUnsubmitted: true,
    periodId,
    page: 1,
    pageSize: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      specialistApi.listAllSubmissions({
        includeUnsubmitted: true,
        periodId,
        page: index + 2,
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    ),
  );
  return {
    ...firstPage,
    items: [
      firstPage.items,
      ...remainingPages.flatMap((page) => page.items),
    ].flat(),
  };
}

function ScoreCell({ value }: { value: number | null }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="font-semibold tabular-nums text-foreground">
        {formatScore(value)}
      </span>
    </div>
  );
}

function LocalityCriteriaDialog({
  locality,
  onClose,
  canReview,
}: {
  locality: LocalityScoreSummary | null;
  onClose: () => void;
  canReview: boolean;
}) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [detailSort, setDetailSort] = useState<TableSortState>(null);
  const selectedSubmission = locality?.submissions.find(
    (submission) => submission.id === selectedSubmissionId,
  );
  const selectedGroupIndex = locality?.submissions.findIndex(
    (submission) => submission.id === selectedSubmissionId,
  ) ?? -1;
  const selectedGroupName = selectedSubmission
    ? selectedSubmission.criteriaGroupName?.trim() || "Nhóm tiêu chí " + (selectedGroupIndex + 1)
    : null;
  const detailQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1SubmissionsIdQueryKey(selectedSubmission?.id ?? '')),
    queryFn: () => specialistApi.getSubmission(selectedSubmission!.id),
    enabled: Boolean(locality && selectedSubmission && !canReview),
  });
  const sortedDetailResults = sortTableRows(detailQuery.data?.results ?? [], detailSort, {
    proposed: (result) => result.point,
    proposedBonus: (result) => result.bonusPoint,
    province: (result) => result.officialPoint,
    provinceBonus: (result) => result.officialBonusPoint,
    proposedTotal: (result) => result.point + result.bonusPoint,
    provinceTotal: (result) => result.officialPoint === null && result.officialBonusPoint === null ? null : (result.officialPoint ?? 0) + (result.officialBonusPoint ?? 0),
  });
  const comparisonContent = detailQuery.isLoading ? (
    <div className="space-y-3" aria-label="Đang tải tiêu chí con">
      <div className="h-16 animate-pulse rounded-md bg-muted" />
      <div className="h-16 animate-pulse rounded-md bg-muted/70" />
    </div>
  ) : detailQuery.isError ? (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      Không tải được tiêu chí con.
      <Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>
        Thử lại
      </Button>
    </div>
  ) : (detailQuery.data?.results.length ?? 0) === 0 ? (
    <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      Nhóm này chưa có kết quả tiêu chí con.
    </p>
  ) : (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex justify-end border-b border-border p-2">
        <TableSortSelect sort={detailSort} options={SCORE_DETAIL_SORT_OPTIONS} onChange={setDetailSort} />
      </div>
      <Table className="min-w-[1080px] table-fixed">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
        </colgroup>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead>
            <SortableTableHead column="proposed" label="Địa phương đề xuất" ariaLabel="Địa phương đề xuất" sort={detailSort} onSort={() => setDetailSort((current) => toggleTableSort(current, 'proposed', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" />
            <SortableTableHead column="proposedBonus" label="Điểm thưởng địa phương" ariaLabel="Điểm thưởng địa phương" sort={detailSort} onSort={() => setDetailSort((current) => toggleTableSort(current, 'proposedBonus', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" />
            <SortableTableHead column="province" label="Điểm của tỉnh" ariaLabel="Điểm của tỉnh" sort={detailSort} onSort={() => setDetailSort((current) => toggleTableSort(current, 'province', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" />
            <SortableTableHead column="provinceBonus" label="Điểm thưởng của tỉnh" ariaLabel="Điểm thưởng của tỉnh" sort={detailSort} onSort={() => setDetailSort((current) => toggleTableSort(current, 'provinceBonus', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" />
            <SortableTableHead column="proposedTotal" label="Tổng điểm địa phương" ariaLabel="Tổng điểm địa phương" sort={detailSort} onSort={() => setDetailSort((current) => toggleTableSort(current, 'proposedTotal', 'desc'))} align="right" className="border-r border-white/30 bg-primary text-right" />
            <SortableTableHead column="provinceTotal" label="Tổng điểm tỉnh" ariaLabel="Tổng điểm tỉnh" sort={detailSort} onSort={() => setDetailSort((current) => toggleTableSort(current, 'provinceTotal', 'desc'))} align="right" className="bg-primary text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDetailResults.map((result, index) => (
            <TableRow key={result.id} className="border-b border-border hover:bg-muted/40">
              <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-3">
                <p className="font-medium leading-5 text-foreground">{result.criteriaContent?.trim() || "Tiêu chí con " + (index + 1)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Điểm chuẩn {formatScore(result.snapshotMaxPoint)} · Điểm thưởng tối đa {formatScore(result.snapshotMaxBonusPoint)}
                </p>
                {result.criteriaStatus === 'Deleted' && <Badge variant="secondary" className="mt-2">Vô hiệu</Badge>}
              </TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.point} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.bonusPoint} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.officialPoint} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.officialBonusPoint} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.point + result.bonusPoint} /></TableCell>
              <TableCell className="px-4 py-3">
                <ScoreCell value={result.officialPoint !== null || result.officialBonusPoint !== null
                  ? (result.officialPoint ?? 0) + (result.officialBonusPoint ?? 0)
                  : null} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const closeDialog = () => {
    setSelectedSubmissionId(null);
    onClose();
  };

  const selectGroup = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
  };

  const showGroups = () => {
    setSelectedSubmissionId(null);
  };

  const embeddedLocalityId = selectedSubmission?.createdByWardCode
    ?? selectedSubmission?.createdBy
    ?? locality?.localityId
    ?? '';

  return (
    <Dialog open={Boolean(locality)} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <DialogContent className={cn(
        'flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0',
        selectedSubmission && canReview ? 'h-[calc(100dvh-2rem)] sm:max-w-[1880px]' : 'sm:max-w-6xl',
      )}>
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12 sm:px-6">
          <DialogTitle>
            {selectedGroupName ?? "Nhóm tiêu chí của " + (locality?.localityName ?? "")}
          </DialogTitle>
          <DialogDescription>
            {selectedSubmission
              ? canReview
                ? "Thẩm định kết quả tiêu chí của " + (locality?.localityName ?? "") + "."
                : "Xem chi tiết điểm từng tiêu chí con của " + (locality?.localityName ?? "") + "."
              : "Chọn một nhóm tiêu chí để xem các tiêu chí con và điểm chấm."}
          </DialogDescription>
        </DialogHeader>

        <div key={selectedSubmissionId ?? "groups"} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedSubmission ? (
            <div className="space-y-4">
              <Button type="button" variant="back" onClick={showGroups}>
                <ArrowLeft className="size-4" />
                Tất cả nhóm tiêu chí
              </Button>

              {canReview ? (
                <Suspense fallback={<div role="status" className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">Đang tải chi tiết chấm điểm…</div>}>
                  <EmbeddedSpecialistReviewPage
                    embeddedDetail={{ localityId: embeddedLocalityId, criteriaGroupId: selectedSubmission.criteriaGroupId }}
                  />
                </Suspense>
              ) : comparisonContent}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Danh sách nhóm tiêu chí</h3>
                <Badge variant="secondary">{locality?.submissions.length ?? 0} nhóm</Badge>
              </div>
              {(locality?.submissions.length ?? 0) === 0 ? (
                <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Địa phương này chưa có nhóm tiêu chí đã nộp.
                </p>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  {locality?.submissions.map((submission, index) => {
                    const totals = getTotals([submission]);
                    return (
                      <button
                        key={submission.id}
                        type="button"
                        className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_110px_110px_20px]"
                        onClick={() => selectGroup(submission.id)}
                      >
                        <span className="col-span-2 flex min-w-0 items-start gap-3 sm:col-span-1">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">{index + 1}</span>
                          <span className="min-w-0 font-semibold leading-6 text-foreground">
                            {submission.criteriaGroupName?.trim() || "Nhóm tiêu chí " + (index + 1)}
                          </span>
                        </span>
                        <span className="text-sm">
                          <span className="block text-xs text-muted-foreground">Tổng điểm địa phương</span>
                          <span className="font-semibold tabular-nums text-foreground">{formatScore(totals.proposedScore + totals.proposedBonus)}</span>
                        </span>
                        <span className="text-sm">
                          <span className="block text-xs text-muted-foreground">Tổng điểm tỉnh</span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatScore(totals.hasProvinceScore ? totals.provinceScore + totals.provinceBonus : null)}
                          </span>
                        </span>
                        <ChevronRight className="hidden size-4 text-primary sm:block" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border bg-card px-5 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={closeDialog}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDistribution(
  rows: LocalityScoreSummary[],
  field: "proposedClassification" | "provinceClassification",
) {
  return rows.reduce(
    (distribution, row) => {
      distribution[row[field]] += 1;
      return distribution;
    },
    { EXCELLENT: 0, GOOD: 0, FAIR: 0, UNSCORED: 0 } satisfies Record<
      Classification,
      number
    >,
  );
}

function ResultSummary({
  label,
  distribution,
  emphasized = false,
}: {
  label: string;
  distribution: Record<Classification, number>;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2 px-4 py-2",
        emphasized && "bg-primary/[0.045]",
      )}
    >
      <p className="text-xs font-semibold leading-4 text-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-1">
        <div className="min-w-0 border-l-2 border-success pl-2">
          <p
            className={cn(
              "text-base font-semibold leading-5 tabular-nums",
              emphasized ? "text-primary" : "text-foreground",
            )}
          >
            {distribution.EXCELLENT}
          </p>
          <p className="text-[11px] leading-4 text-muted-foreground">
            Xuất sắc
          </p>
        </div>
        <div className="min-w-0 border-l-2 border-accent pl-2">
          <p className="text-base font-semibold leading-5 tabular-nums text-foreground">
            {distribution.GOOD}
          </p>
          <p className="text-[11px] leading-4 text-muted-foreground">Tốt</p>
        </div>
        <div className="min-w-0 border-l-2 border-info pl-2">
          <p className="text-base font-semibold leading-5 tabular-nums text-foreground">
            {distribution.FAIR}
          </p>
          <p className="text-[11px] leading-4 text-muted-foreground">Khá</p>
        </div>
      </div>
    </div>
  );
}

/** Bảng tổng hợp điểm toàn tỉnh của Chuyên viên, tham chiếu cấu trúc sheet “Bảng tổng”. */
export default function SpecialistScoreSummaryPage({ readOnly = false }: { readOnly?: boolean }) {
  const queryClient = useQueryClient();
  const [overviewCollapsed, setOverviewCollapsed] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const { filters: { periodFilter }, setters: { periodFilter: setPeriodFilter } } = useQueryFilters({ periodFilter: '' });
  const [isPeriodFilterReady, setIsPeriodFilterReady] = useState(false);
  const periodDefaultingRef = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | null>(null);
  const [summarySort, setSummarySort] = useState<TableSortState>(null);
  const canReview = useAuthStore((state) => !readOnly && (state.user?.role === 'SPECIALIST' || state.user?.role === 'REVIEWER'));
  const canPublish = useAuthStore((state) => !readOnly && state.user?.role === 'SPECIALIST');
  const periodListParams = { page: 1, pageSize: 100, sortBy: 'updatedAt', sortOrder: 'desc' } as const;
  const periodsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1PeriodsQueryKey({
      Page: periodListParams.page,
      PageSize: periodListParams.pageSize,
      SortBy: periodListParams.sortBy,
      SortOrder: periodListParams.sortOrder,
    }), 'options'),
    queryFn: async () => (await periodsApi.list(periodListParams)).items,
  });
  const periods = useMemo(() => periodsQuery.data ?? [], [periodsQuery.data]);
  const sortedPeriods = useMemo(() => [...periods].sort((left, right) => {
    const leftTimestamp = Date.parse(left.updatedAt ?? left.createdAt);
    const rightTimestamp = Date.parse(right.updatedAt ?? right.createdAt);
    return rightTimestamp - leftTimestamp || right.startYear - left.startYear || right.endYear - left.endYear;
  }), [periods]);
  useEffect(() => {
    if (isPeriodFilterReady || periodsQuery.isLoading) return;
    if (periodsQuery.isError) {
      setIsPeriodFilterReady(true);
      return;
    }
    if (periodFilter || sortedPeriods.length === 0) {
      setIsPeriodFilterReady(true);
      return;
    }
    if (periodDefaultingRef.current) return;
    periodDefaultingRef.current = true;
    setPeriodFilter(sortedPeriods[0].id);
  }, [isPeriodFilterReady, periodFilter, periodsQuery.isError, periodsQuery.isLoading, setPeriodFilter, sortedPeriods]);
  const submissionsQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1SubmissionsQueryKey(), { view: 'all', includeUnsubmitted: true, periodId: periodFilter || undefined, sortBy: 'createdAt', sortOrder: 'desc' }),
    queryFn: () => listEverySubmission(periodFilter || undefined),
    enabled: isPeriodFilterReady && !periodsQuery.isError,
  });
  const clustersQuery = useQuery({
    queryKey: dataQueryKey(apiQueryKey({}, { url: '/api/v1/clusters' }), 'with-wards'),
    queryFn: () => listClustersWithWards(queryClient),
  });
  const clusters = useMemo(
    () => [...(clustersQuery.data ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name, "vi", { numeric: true }),
    ),
    [clustersQuery.data],
  );

  const rows = useMemo<LocalityScoreSummary[]>(() => {
    const clusterByWardCode = new Map<string, {
      clusterId: string;
      cluster: string;
      clusterOrder: number;
      localityOrder: number;
      wardName: string | null;
    }>();
    clusters.forEach((cluster, clusterOrder) => {
      (cluster.wards ?? []).forEach((ward, localityOrder) => {
        const wardCode = normalizeWardCode(ward.wardCode);
        if (wardCode && !clusterByWardCode.has(wardCode)) {
          clusterByWardCode.set(wardCode, {
            clusterId: cluster.id,
            cluster: cluster.name,
            clusterOrder,
            localityOrder,
            wardName: ward.wardFullName ?? ward.wardName,
          });
        }
      });
    });

    const byLocality = new Map<string, SubmissionApi[]>();
    for (const submission of submissionsQuery.data?.items ?? []) {
      const localityId = normalizeLocalityCode(submission);
      byLocality.set(localityId, [
        ...(byLocality.get(localityId) ?? []),
        submission,
      ]);
    }

    const localityCodes = new Set([...clusterByWardCode.keys(), ...byLocality.keys()]);
    return Array.from(localityCodes)
      .map((localityId) => {
        const entries = byLocality.get(localityId) ?? [];
        const clusterMatch = clusterByWardCode.get(localityId);
        const submissions = entries
          .filter(isRealSubmission)
          .filter((submission) => SUMMARY_STAGES.includes(submission.currentStage));
        const localityName =
          entries[0]?.localityFullName?.trim() ||
          clusterMatch?.wardName?.trim() ||
          entries[0]?.createdByUsername?.trim() ||
          localityId;
        const totals = getTotals(submissions);
        const proposedTotal = totals.proposedScore + totals.proposedBonus;
        const provinceTotal = totals.hasProvinceScore
          ? totals.provinceScore + totals.provinceBonus
          : null;
        return {
          localityId,
          localityName,
          clusterId: clusterMatch?.clusterId ?? UNASSIGNED_CLUSTER_ID,
          cluster: clusterMatch?.cluster ?? "Chưa phân cụm",
          clusterOrder: clusterMatch?.clusterOrder ?? Number.MAX_SAFE_INTEGER,
          localityOrder: clusterMatch?.localityOrder ?? Number.MAX_SAFE_INTEGER,
          submissions,
          ...totals,
          proposedTotal,
          provinceTotal,
          proposedClassification:
            submissions.length > 0 ? classifyScore(proposedTotal) : "UNSCORED",
          provinceClassification: classifyScore(provinceTotal),
        };
      })
      .sort((left, right) => {
        if (left.provinceTotal === null && right.provinceTotal === null)
          return left.localityName.localeCompare(right.localityName, "vi");
        if (left.provinceTotal === null) return 1;
        if (right.provinceTotal === null) return -1;
        return (
          right.provinceTotal - left.provinceTotal ||
          right.proposedTotal - left.proposedTotal ||
          left.localityName.localeCompare(right.localityName, "vi")
        );
      });
  }, [submissionsQuery.data, clusters]);
  const selectedLocality = rows.find((row) => row.localityId === selectedLocalityId) ?? null;

  const proposedDistribution = useMemo(
    () => getDistribution(rows, "proposedClassification"),
    [rows],
  );
  const provinceDistribution = useMemo(
    () => getDistribution(rows, "provinceClassification"),
    [rows],
  );

  const groupedRows = useMemo(() => {
    const groups = new Map<string, {
      id: string;
      cluster: string;
      clusterOrder: number;
      rows: LocalityScoreSummary[];
    }>();
    clusters.forEach((cluster, clusterOrder) => {
      groups.set(cluster.id, { id: cluster.id, cluster: cluster.name, clusterOrder, rows: [] });
    });
    rows.forEach((row) => {
      let group = groups.get(row.clusterId);
      if (!group) {
        group = { id: row.clusterId, cluster: row.cluster, clusterOrder: row.clusterOrder, rows: [] };
        groups.set(row.clusterId, group);
      }
      group.rows.push(row);
    });
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        rows: group.rows
          .slice()
          .sort((left, right) =>
            left.localityOrder - right.localityOrder ||
            left.localityName.localeCompare(right.localityName, "vi"),
          ),
      }))
      .sort(
        (left, right) =>
          left.clusterOrder - right.clusterOrder ||
          left.cluster.localeCompare(right.cluster, "vi"),
      );
  }, [clusters, rows]);
  const sortedGroupedRows = useMemo(() => groupedRows.map((group) => ({
    ...group,
    rows: sortTableRows(group.rows, summarySort, {
      proposedScore: (row) => row.proposedScore,
      proposedBonus: (row) => row.proposedBonus,
      provinceScore: (row) => row.hasProvinceScore ? row.provinceScore : null,
      provinceBonus: (row) => row.hasProvinceScore ? row.provinceBonus : null,
      proposedTotal: (row) => row.proposedTotal,
      provinceTotal: (row) => row.provinceTotal,
    }),
  })), [groupedRows, summarySort]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await resultPublicationApi.getScoreSummaryExcel(periodFilter || undefined);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const periodName = periods.find((period) => period.id === periodFilter)?.name;
      anchor.href = objectUrl;
      anchor.download = `tong-hop-cham-diem${periodName ? `-${periodName}` : ""}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Đã xuất file Excel bảng tổng hợp chấm điểm.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  if (!isPeriodFilterReady || submissionsQuery.isLoading || clustersQuery.isLoading || periodsQuery.isLoading)
    return <PageLoading label="Đang tổng hợp và xếp hạng điểm…" />;
  if (submissionsQuery.isError || clustersQuery.isError || periodsQuery.isError) {
    const error = submissionsQuery.error ?? clustersQuery.error ?? periodsQuery.error;
    return (
      <EmptyState
        variant="error"
        title={periodsQuery.isError ? "Không tải được danh sách kỳ thi đua" : clustersQuery.isError ? "Không tải được danh sách cụm" : "Không tải được bảng tổng hợp"}
        description={
          error instanceof Error
            ? error.message
            : "Vui lòng thử lại sau."
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      <PageHeader
        title="Bảng tổng hợp điểm"
        actions={
          <FilterSelect
            label="Kỳ thi đua"
            labelPosition="outside"
            value={periodFilter}
            onChange={setPeriodFilter}
            allLabel="Tất cả kỳ thi đua"
            options={sortedPeriods.map((period) => ({ value: period.id, label: period.name }))}
          />
        }
      />
      <section
        className="overflow-hidden rounded-lg border border-border bg-card"
        aria-label="Tổng quan kết quả và bảng xếp hạng"
      >
        <div className="flex flex-wrap items-center justify-end gap-3 px-4 py-2 sm:px-5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{rows.length} đơn vị</Badge>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleExport()}
                disabled={exporting}
                disabledReason="Đang xuất file Excel…"
              >
                <Download className="size-4" />
                {exporting ? "Đang xuất…" : "Xuất Excel"}
              </Button>
            )}
            {canPublish && (
              <Button
                type="button"
                size="sm"
               
                onClick={() => setPublishOpen(true)}
              >
                <Trophy className="size-4" />
                Công bố kết quả
              </Button>
            )}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={!overviewCollapsed}
                aria-controls="specialist-score-summary-overview"
                onClick={() => setOverviewCollapsed((collapsed) => !collapsed)}
              >
                {overviewCollapsed ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
                {overviewCollapsed ? "Mở rộng" : "Thu gọn"}
              </Button>
            )}
          </div>
        </div>
        <div
          id="specialist-score-summary-overview"
          hidden={overviewCollapsed}
          className={
            overviewCollapsed
              ? "hidden"
              : "grid items-start gap-3 border-t border-border p-3 xl:grid-cols-[minmax(270px,.8fr)_minmax(360px,1.1fr)_minmax(270px,.8fr)]"
          }
        >
          <section
            className="self-start overflow-hidden rounded-lg border border-border border-l-[3px] border-l-primary bg-card"
            aria-label="Đề xuất điểm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Award className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Đề xuất điểm
                  </h2>
                </div>
              </div>
              <Badge variant="secondary">{rows.length} đơn vị</Badge>
            </div>
            <ResultSummary
              label="Đề xuất"
              distribution={proposedDistribution}
            />
            <div className="border-t border-border">
              <ResultSummary
                label="Tỉnh chấm"
                distribution={provinceDistribution}
                emphasized
              />
            </div>
          </section>

          <aside
            className="self-start overflow-hidden rounded-lg border border-border bg-card"
            aria-label="Xếp hạng xã phường theo điểm tỉnh chấm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md bg-accent/20 text-foreground">
                  <Trophy className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Xếp hạng tỉnh chấm
                  </h2>
                </div>
              </div>
              <Badge variant="outline">
                {rows.filter((row) => row.provinceTotal !== null).length} đã
                chấm
              </Badge>
            </div>
            {rows.some((row) => row.provinceTotal !== null) ? (
              <ol className="max-h-[120px] divide-y divide-border overflow-y-auto overscroll-contain">
                {rows
                  .filter((row) => row.provinceTotal !== null)
                  .map((row, index) => (
                    <li
                      key={row.localityId}
                      className="group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-muted/40"
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                          index < 3
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {row.localityName}
                        </p>
                      
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-primary">
                          {formatScore(row.provinceTotal)}
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            ) : (
              <div className="flex min-h-28 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                Chưa xếp hạng
              </div>
            )}
          </aside>
          <section
            className="self-start overflow-hidden rounded-lg border border-border bg-card"
            aria-label="Thang điểm xếp loại"
          >
            <div className="border-b border-border bg-muted/20 px-4 py-2">
              <h2 className="text-sm font-semibold text-foreground">
                Thang điểm xếp loại
              </h2>
              <p className="text-xs text-muted-foreground">
                Áp dụng cho tổng điểm chấm và điểm thưởng.
              </p>
            </div>
            <dl className="divide-y divide-border">
              <div className="flex items-baseline justify-between gap-2 px-4 py-2">
                <dt className="text-xs font-semibold text-success">Xuất sắc</dt>
                <dd className="text-xs text-foreground">Từ 95 đến 100 điểm</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 px-4 py-2">
                <dt className="text-xs font-semibold text-foreground">Tốt</dt>
                <dd className="text-xs text-foreground">
                  Từ 85 đến dưới 95 điểm
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 px-4 py-2">
                <dt className="text-xs font-semibold text-info">Khá</dt>
                <dd className="text-xs text-foreground">
                  Thấp hơn 85 điểm
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </section>

      <section
        className="min-w-[1480px] overflow-clip rounded-lg border border-border bg-card"
        aria-label="Bảng tổng hợp chấm điểm toàn tỉnh"
      >
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-border px-5 py-4">
          <TableSortSelect sort={summarySort} options={SCORE_SUMMARY_SORT_OPTIONS} onChange={setSummarySort} />
          <Badge variant="secondary">{rows.length} đơn vị</Badge>
        </div>
        {groupedRows.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu tổng hợp"
            description="Chưa có hồ sơ địa phương để tổng hợp và xếp hạng."
            icon={<Search className="size-8" />}
          />
        ) : (
          <Table
            className="table-fixed"
            containerClassName="!overflow-visible"
          >
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[15.5%]" />
              <col className="w-[15.5%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground sm:top-[-24px]">
                  Cụm thi đua
                </TableHead>
                <TableHead className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground sm:top-[-24px]">
                  Tên xã, phường
                </TableHead>
                <SortableTableHead column="proposedScore" label="Địa phương chấm" ariaLabel="Điểm địa phương" sort={summarySort} onSort={() => setSummarySort((current) => toggleTableSort(current, 'proposedScore', 'desc'))} align="right" className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary sm:top-[-24px]" />
                <SortableTableHead column="proposedBonus" label="Điểm thưởng địa phương" ariaLabel="Điểm thưởng địa phương" sort={summarySort} onSort={() => setSummarySort((current) => toggleTableSort(current, 'proposedBonus', 'desc'))} align="right" className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary sm:top-[-24px]" />
                <SortableTableHead column="provinceScore" label="Tỉnh chấm" ariaLabel="Điểm tỉnh chấm" sort={summarySort} onSort={() => setSummarySort((current) => toggleTableSort(current, 'provinceScore', 'desc'))} align="right" className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary sm:top-[-24px]" />
                <SortableTableHead column="provinceBonus" label="Điểm thưởng của tỉnh" ariaLabel="Điểm thưởng tỉnh" sort={summarySort} onSort={() => setSummarySort((current) => toggleTableSort(current, 'provinceBonus', 'desc'))} align="right" className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary sm:top-[-24px]" />
                <SortableTableHead column="proposedTotal" label={<>Địa phương chấm<br />(điểm tự chấm + điểm thưởng)</>} ariaLabel="Tổng điểm địa phương" sort={summarySort} onSort={() => setSummarySort((current) => toggleTableSort(current, 'proposedTotal', 'desc'))} align="right" className="sticky top-[-16px] z-10 whitespace-normal border-r border-white/30 bg-primary sm:top-[-24px]" />
                <SortableTableHead column="provinceTotal" label={<>Tỉnh chấm<br />(điểm chấm + điểm thưởng)</>} ariaLabel="Tổng điểm tỉnh" sort={summarySort} onSort={() => setSummarySort((current) => toggleTableSort(current, 'provinceTotal', 'desc'))} align="right" className="sticky top-[-16px] z-10 whitespace-normal bg-primary sm:top-[-24px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroupedRows.flatMap((group) =>
                group.rows.length === 0 ? [
                  <TableRow key={group.id} className="border-b-2 border-border">
                    <TableCell className="whitespace-normal border-r border-primary/15 bg-muted/30 px-3 text-center font-semibold">
                      {group.cluster}
                    </TableCell>
                    <TableCell colSpan={7} className="px-4 py-4 text-sm text-muted-foreground">
                      Chưa có xã, phường trong cụm.
                    </TableCell>
                  </TableRow>,
                ] : group.rows.map((row, rowIndex) => (
                  <TableRow key={row.localityId} className="border-b-2 border-border hover:bg-muted/40">
                    {rowIndex === 0 && (
                      <TableCell
                        rowSpan={group.rows.length}
                        className="whitespace-normal border-r border-primary/15 bg-muted/30 px-3 text-center align-middle"
                      >
                        <p className="font-semibold leading-5 text-foreground">
                          {group.cluster}
                        </p>
                        <p className="mt-1 text-xs leading-4 text-muted-foreground">
                          ({group.rows.length} đơn vị)
                        </p>
                      </TableCell>
                    )}
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-3">
                      {row.submissions.length > 0 ? (
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 text-left font-semibold leading-5 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedLocalityId(row.localityId)}
                        >
                          <span className="min-w-0">{row.localityName}</span>
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-info-foreground dark:text-info">
                            <Eye className="size-4" aria-hidden="true" />
                            Xem
                          </span>
                        </button>
                      ) : (
                        <p className="font-semibold leading-5 text-foreground">{row.localityName}</p>
                      )}
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell value={row.submissions.length > 0 ? row.proposedScore : null} />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell value={row.submissions.length > 0 ? row.proposedBonus : null} />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell value={row.hasProvinceScore ? row.provinceScore : null} />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell value={row.hasProvinceScore ? row.provinceBonus : null} />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell value={row.submissions.length > 0 ? row.proposedTotal : null} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <ScoreCell value={row.provinceTotal} />
                    </TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        )}
      </section>
      <LocalityCriteriaDialog
        locality={selectedLocality}
        onClose={() => setSelectedLocalityId(null)}
        canReview={canReview}
      />
      {canPublish && <ResultPublicationDialog open={publishOpen} onOpenChange={setPublishOpen} selectedPeriodId={periodFilter} />}
    </div>
  );
}
