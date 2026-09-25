import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Trophy,
} from "lucide-react";
import { Button, EmptyState, PageLoading } from "@/components/core";
import { Badge } from "@/components/ui/badge";
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
} from "@/features/cham-diem/api/specialistApi";
import { resultPublicationApi } from "@/features/duyet/api/resultPublicationApi";
import { ResultPublicationDialog } from "@/features/duyet/components/ResultPublicationDialog";

interface ScoreTotals {
  proposedScore: number;
  proposedBonus: number;
  provinceScore: number;
  provinceBonus: number;
  hasProvinceScore: boolean;
}

type Classification = "EXCELLENT" | "GOOD" | "FAIR" | "BELOW" | "UNSCORED";

interface LocalityScoreSummary extends ScoreTotals {
  localityId: string;
  localityName: string;
  cluster: string;
  clusterOrder: number;
  localityOrder: number;
  submissions: SubmissionApi[];
  proposedTotal: number;
  provinceTotal: number | null;
  proposedClassification: Classification;
  provinceClassification: Classification;
}

const COMPETITION_CLUSTERS = [
  [
    "Trấn Biên",
    "Biên Hòa",
    "Tân Triều",
    "Tam Hiệp",
    "Long Bình",
    "Trảng Dài",
    "Hố Nai",
    "Tam Phước",
    "Long Hưng",
    "Phước Tân",
  ],
  [
    "Phước Sơn",
    "Nghĩa Trung",
    "Bù Đăng",
    "Thọ Sơn",
    "Đak Nhau",
    "Bom Bo",
    "Bù Gia Mập",
    "Đăk Ơ",
  ],
  [
    "Nhơn Trạch",
    "Long Phước",
    "Đại Phước",
    "Phước An",
    "Phước Thái",
    "Long Thành",
    "Bình An",
    "An Phước",
    "An Viễn",
    "Bình Minh",
    "Trảng Bom",
    "Bàu Hàm",
    "Hưng Thịnh",
  ],
  [
    "Cẩm Mỹ",
    "Sông Ray",
    "Dầu Giây",
    "Gia Kiệm",
    "Thống Nhất",
    "Trị An",
    "Tân An",
    "Phú Lý",
  ],
  [
    "Xuân Lộc",
    "Xuân Đường",
    "Xuân Định",
    "Xuân Phú",
    "Xuân Hòa",
    "Xuân Thành",
    "Xuân Bắc",
    "Xuân Đông",
    "Xuân Quế",
  ],
  [
    "Định Quán",
    "La Ngà",
    "Phú Vinh",
    "Phú Hòa",
    "Thanh Sơn",
    "Tà Lài",
    "Nam Cát Tiên",
    "Tân Phú",
    "Phú Lâm",
    "Đak Lua",
  ],
  [
    "Minh Hưng",
    "Chơn Thành",
    "Bình Long",
    "An Lộc",
    "Tân Khai",
    "Tân Hưng",
    "Minh Đức",
    "Nha Bích",
    "Tân Quan",
  ],
  [
    "Long Khánh",
    "Bình Lộc",
    "Bảo Vinh",
    "Xuân Lập",
    "Hàng Gòn",
    "Bình Phước",
    "Đồng Xoài",
    "Phước Bình",
    "Phước Long",
  ],
  [
    "Lộc Ninh",
    "Lộc Thành",
    "Lộc Hưng",
    "Lộc Tấn",
    "Lộc Thạnh",
    "Lộc Quang",
    "Tân Tiến",
    "Thiện Hưng",
    "Hưng Phước",
  ],
  [
    "Đồng Tâm",
    "Tân Lợi",
    "Đồng Phú",
    "Thuận Lợi",
    "Phú Trung",
    "Phú Riềng",
    "Long Hà",
    "Bình Tân",
    "Đa Kia",
    "Phú Nghĩa",
  ],
] as const;

const CLUSTER_LOOKUP = COMPETITION_CLUSTERS.flatMap((localities, index) =>
  localities.map((locality, localityOrder) => ({
    locality: locality.toLocaleLowerCase("vi"),
    // Giữ đúng cách gọi cụm và số lượng đơn vị của file Bảng tổng.
    cluster: `Cụm ${index + 1} (${localities.length} đơn vị)`,
    clusterOrder: index + 1,
    localityOrder,
  })),
);

function normalizeLocalityCode(submission: SubmissionApi) {
  return (
    submission.createdByWardCode ??
    submission.createdBy ??
    `submission:${submission.id}`
  ).replace(/^loc-/i, "");
}

function getCompetitionCluster(localityName: string) {
  const normalized = localityName
    .normalize("NFC")
    .trim()
    .replace(/^(xã|phường|x\.?|p\.?)\s*/iu, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");
  const matchedCluster = CLUSTER_LOOKUP.find(
    ({ locality }) =>
      normalized === locality ||
      normalized.startsWith(`${locality},`) ||
      normalized.startsWith(`${locality} `),
  );
  return (
    matchedCluster ?? {
      cluster: "Chưa phân cụm",
      clusterOrder: Number.MAX_SAFE_INTEGER,
      localityOrder: Number.MAX_SAFE_INTEGER,
    }
  );
}

function getTotals(submissions: SubmissionApi[]): ScoreTotals {
  return submissions.reduce<ScoreTotals>(
    (totals, submission) =>
      submission.results.reduce<ScoreTotals>(
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
  if (scoreForClassification >= 70) return "FAIR";
  return "BELOW";
}

function formatScore(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    value,
  );
}

async function listEverySubmission() {
  const firstPage = await specialistApi.listAllSubmissions({
    includeUnsubmitted: true,
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

/** Mỗi nhóm chỉ tải hồ sơ chi tiết sau khi người dùng mở tiêu chí cha. */
function CriteriaGroupRows({
  submission,
  index,
}: {
  submission: SubmissionApi;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const detailQuery = useQuery({
    queryKey: ["specialist-score-summary-submission-detail", submission.id],
    queryFn: () => specialistApi.getSubmission(submission.id),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });
  const totals = getTotals([submission]);
  const name = submission.criteriaGroupName?.trim() || `Nhóm tiêu chí ${index + 1}`;
  const childPanelId = `score-summary-group-${submission.id}`;

  return (
    <Fragment>
      <TableRow className="border-b border-border hover:bg-muted/40">
        <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-3">
          <button
            type="button"
            className="flex w-full items-start gap-2 text-left font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
            aria-controls={expanded ? childPanelId : undefined}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-primary" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />}
            <span className="min-w-0 leading-5">{name}</span>
          </button>
        </TableCell>
        <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={totals.proposedScore} /></TableCell>
        <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={totals.proposedBonus} /></TableCell>
        <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={totals.hasProvinceScore ? totals.provinceScore : null} /></TableCell>
        <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={totals.hasProvinceScore ? totals.provinceBonus : null} /></TableCell>
        <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={totals.proposedScore + totals.proposedBonus} /></TableCell>
        <TableCell className="px-4 py-3"><ScoreCell value={totals.hasProvinceScore ? totals.provinceScore + totals.provinceBonus : null} /></TableCell>
      </TableRow>
      {expanded && (
        <Fragment>
          {detailQuery.isLoading ? (
            <TableRow><TableCell colSpan={7} className="bg-muted/20 px-10 py-4 text-sm text-muted-foreground" id={childPanelId}>Đang tải tiêu chí con…</TableCell></TableRow>
          ) : detailQuery.isError ? (
            <TableRow><TableCell colSpan={7} className="bg-muted/20 px-10 py-4" id={childPanelId}><div className="flex items-center gap-3 text-sm text-destructive">Không tải được tiêu chí con.<Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>Thử lại</Button></div></TableCell></TableRow>
          ) : (detailQuery.data?.results.length ?? 0) === 0 ? (
            <TableRow><TableCell colSpan={7} className="bg-muted/20 px-10 py-4 text-sm text-muted-foreground" id={childPanelId}>Nhóm này chưa có kết quả tiêu chí con.</TableCell></TableRow>
          ) : detailQuery.data?.results.map((result, childIndex) => (
            <TableRow key={result.id} id={childIndex === 0 ? childPanelId : undefined} className="border-b border-border bg-muted/25 hover:bg-muted/40">
              <TableCell className="whitespace-normal border-r border-primary/15 py-3 pl-10 pr-4">
                <p className="text-sm font-medium leading-5 text-foreground">{result.criteriaContent?.trim() || `Tiêu chí con ${childIndex + 1}`}</p>
                <p className="mt-1 text-xs text-muted-foreground">Điểm chuẩn {formatScore(result.snapshotMaxPoint)} · Điểm thưởng tối đa {formatScore(result.snapshotMaxBonusPoint)}</p>
              </TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.point} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.bonusPoint} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.officialPoint} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.officialBonusPoint} /></TableCell>
              <TableCell className="border-r border-primary/15 px-4 py-3"><ScoreCell value={result.point + result.bonusPoint} /></TableCell>
              <TableCell className="px-4 py-3"><ScoreCell value={result.officialPoint !== null || result.officialBonusPoint !== null ? (result.officialPoint ?? 0) + (result.officialBonusPoint ?? 0) : null} /></TableCell>
            </TableRow>
          ))}
        </Fragment>
      )}
    </Fragment>
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
    { EXCELLENT: 0, GOOD: 0, FAIR: 0, BELOW: 0, UNSCORED: 0 } satisfies Record<
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
export default function SpecialistScoreSummaryPage() {
  const [overviewCollapsed, setOverviewCollapsed] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [expandedLocalityIds, setExpandedLocalityIds] = useState<Set<string>>(() => new Set());
  const toggleLocality = (localityId: string) => {
    setExpandedLocalityIds((current) => {
      const next = new Set(current);
      if (next.has(localityId)) next.delete(localityId);
      else next.add(localityId);
      return next;
    });
  };
  // Backend là nguồn sự thật: chỉ công bố được khi mọi địa phương đã nộp và
  // hoàn tất mọi nhóm tiêu chí.
  const publicationPreviewQuery = useQuery({
    queryKey: ["result-publication-preview"],
    queryFn: resultPublicationApi.getPreview,
  });
  const canPublish = publicationPreviewQuery.data?.canPublish === true;
  const submissionsQuery = useQuery({
    queryKey: ["specialist-score-summary-submissions"],
    queryFn: listEverySubmission,
  });

  const rows = useMemo<LocalityScoreSummary[]>(() => {
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const submission of submissionsQuery.data?.items ?? []) {
      const localityId = normalizeLocalityCode(submission);
      byLocality.set(localityId, [
        ...(byLocality.get(localityId) ?? []),
        submission,
      ]);
    }

    return Array.from(byLocality.entries())
      .map(([localityId, entries]) => {
        const submissions = entries
          .filter(isRealSubmission)
          .filter((submission) => submission.currentStage !== "Draft");
        const localityName =
          entries[0]?.localityFullName ??
          entries[0]?.createdByUsername ??
          localityId;
        const clusterMatch = getCompetitionCluster(localityName);
        const totals = getTotals(submissions);
        const proposedTotal = totals.proposedScore + totals.proposedBonus;
        const provinceTotal = totals.hasProvinceScore
          ? totals.provinceScore + totals.provinceBonus
          : null;
        return {
          localityId,
          localityName,
          cluster: clusterMatch.cluster,
          clusterOrder: clusterMatch.clusterOrder,
          localityOrder: clusterMatch.localityOrder,
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
  }, [submissionsQuery.data]);

  const proposedDistribution = useMemo(
    () => getDistribution(rows, "proposedClassification"),
    [rows],
  );
  const provinceDistribution = useMemo(
    () => getDistribution(rows, "provinceClassification"),
    [rows],
  );

  const groupedRows = useMemo(() => {
    const groups = new Map<string, LocalityScoreSummary[]>();
    rows.forEach((row) =>
      groups.set(row.cluster, [...(groups.get(row.cluster) ?? []), row]),
    );
    return Array.from(groups.entries())
      .map(([cluster, localityRows]) => ({
        cluster,
        clusterOrder: localityRows[0]?.clusterOrder ?? Number.MAX_SAFE_INTEGER,
        rows: localityRows
          .slice()
          .sort(
            (left, right) =>
              left.localityOrder - right.localityOrder ||
              left.localityName.localeCompare(right.localityName, "vi"),
          ),
      }))
      .sort(
        (left, right) =>
          left.clusterOrder - right.clusterOrder ||
          left.cluster.localeCompare(right.cluster, "vi"),
      );
  }, [rows]);

  if (submissionsQuery.isLoading)
    return <PageLoading label="Đang tổng hợp và xếp hạng điểm…" />;
  if (submissionsQuery.isError)
    return (
      <EmptyState
        variant="error"
        title="Không tải được bảng tổng hợp"
        description={
          submissionsQuery.error instanceof Error
            ? submissionsQuery.error.message
            : "Vui lòng thử lại sau."
        }
      />
    );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      <section
        className="overflow-hidden rounded-lg border border-border bg-card"
        aria-label="Tổng quan kết quả và bảng xếp hạng"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-5">
          <div></div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{rows.length} đơn vị</Badge>
            <Button
              type="button"
              size="sm"
              className="bg-accent text-foreground hover:bg-accent/90"
              disabled={!canPublish}
              disabledReason={
                !canPublish
                  ? (publicationPreviewQuery.data?.message ??
                    "Chỉ có thể công bố khi tất cả hồ sơ của tất cả địa phương đã được hội đồng chấm.")
                  : undefined
              }
              onClick={() => setPublishOpen(true)}
            >
              <Trophy className="size-4" />
              Công bố kết quả
            </Button>
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
                  Từ 70 đến dưới 85 điểm
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-lg border border-border bg-card"
        aria-label="Bảng tổng hợp chấm điểm toàn tỉnh"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
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
            className="min-w-[1480px] table-fixed"
            containerClassName="max-w-full"
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
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-center leading-5 text-primary-foreground">
                  Cụm thi đua
                </TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 leading-5 text-primary-foreground">
                  Tên xã, phường
                </TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-right leading-5 text-primary-foreground">
                  Xã (phường) chấm
                </TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-right leading-5 text-primary-foreground">
                  Điểm thưởng xã
                </TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-right leading-5 text-primary-foreground">
                  Tỉnh chấm
                </TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-right leading-5 text-primary-foreground">
                  Điểm thưởng của tỉnh
                </TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 px-4 py-3 text-right leading-5 text-primary-foreground">
                  Xã (phường) chấm
                  <br />
                  (điểm tự chấm + điểm thưởng)
                </TableHead>
                <TableHead className="whitespace-normal px-4 py-3 text-right leading-5 text-primary-foreground">
                  Tỉnh chấm
                  <br />
                  (điểm chấm + điểm thưởng)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedRows.flatMap((group) =>
                group.rows.map((row, rowIndex) => (
                  <Fragment key={row.localityId}>
                  <TableRow
                    className="border-b-2 border-border hover:bg-muted/40"
                  >
                    {rowIndex === 0 && (
                      <TableCell
                        rowSpan={group.rows.length + group.rows.filter((item) => expandedLocalityIds.has(item.localityId) && item.submissions.length > 0).length}
                        className="whitespace-normal border-r border-primary/15 bg-muted/30 px-3 text-center align-middle"
                      >
                        <p className="font-semibold leading-5 text-foreground">
                          {group.cluster.replace(/\s*\((\d+) đơn vị\)/, "")}
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
                          className="flex w-full items-center gap-2 text-left font-semibold leading-5 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-expanded={expandedLocalityIds.has(row.localityId)}
                          aria-controls={expandedLocalityIds.has(row.localityId) ? `score-summary-locality-${row.localityId}` : undefined}
                          onClick={() => toggleLocality(row.localityId)}
                        >
                          {expandedLocalityIds.has(row.localityId) ? <ChevronDown className="size-4 shrink-0 text-primary" /> : <ChevronRight className="size-4 shrink-0 text-primary" />}
                          <span>{row.localityName}</span>
                        </button>
                      ) : <p className="font-semibold leading-5 text-foreground">{row.localityName}</p>}
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell
                        value={
                          row.submissions.length > 0 ? row.proposedScore : null
                        }
                      />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell
                        value={
                          row.submissions.length > 0 ? row.proposedBonus : null
                        }
                      />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell
                        value={row.hasProvinceScore ? row.provinceScore : null}
                      />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell
                        value={row.hasProvinceScore ? row.provinceBonus : null}
                      />
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-3">
                      <ScoreCell
                        value={
                          row.submissions.length > 0 ? row.proposedTotal : null
                        }
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <ScoreCell value={row.provinceTotal} />
                    </TableCell>
                  </TableRow>
                  {expandedLocalityIds.has(row.localityId) && row.submissions.length > 0 && (
                    <TableRow className="border-b-2 border-border bg-primary/[0.025] hover:bg-primary/[0.025]">
                      <TableCell colSpan={7} className="px-4 py-4 align-top">
                        <div id={`score-summary-locality-${row.localityId}`} className="overflow-hidden rounded-md border border-border bg-card" role="region" aria-label={`Nhóm tiêu chí của ${row.localityName}`}>
                          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <p className="text-sm font-semibold text-foreground">Nhóm tiêu chí của {row.localityName}</p>
                            <Badge variant="secondary">{row.submissions.length} nhóm</Badge>
                          </div>
                          <Table className="min-w-[1080px] table-fixed">
                            <colgroup><col className="w-[28%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" /></colgroup>
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="whitespace-normal border-r border-primary/15 px-4 py-3 text-foreground">Nhóm tiêu chí / tiêu chí con</TableHead>
                                <TableHead className="whitespace-normal border-r border-primary/15 px-4 py-3 text-right text-foreground">Xã chấm</TableHead>
                                <TableHead className="whitespace-normal border-r border-primary/15 px-4 py-3 text-right text-foreground">Thưởng xã</TableHead>
                                <TableHead className="whitespace-normal border-r border-primary/15 px-4 py-3 text-right text-foreground">Tỉnh chấm</TableHead>
                                <TableHead className="whitespace-normal border-r border-primary/15 px-4 py-3 text-right text-foreground">Thưởng tỉnh</TableHead>
                                <TableHead className="whitespace-normal border-r border-primary/15 px-4 py-3 text-right text-foreground">Tổng xã</TableHead>
                                <TableHead className="whitespace-normal px-4 py-3 text-right text-foreground">Tổng tỉnh</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {row.submissions.map((submission, index) => <CriteriaGroupRows key={submission.id} submission={submission} index={index} />)}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                )),
              )}
            </TableBody>
          </Table>
        )}
      </section>
      <ResultPublicationDialog open={publishOpen} onOpenChange={setPublishOpen} />
    </div>
  );
}
