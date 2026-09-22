import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Eye, FileText, MessageSquareText, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button, DataTable, EmptyState, ListDialog, PageHeader, PageLoading, TruncatedText } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTimeline } from '@/components/core';
import { localityApi, getLocalityApiError, type ApprovalHistoryItem, type CriteriaApi, type SubmissionApi, type SubmissionResultFile, type SubmissionResultItem } from '@/features/dia-phuong/api/localityApi';
import { downloadFile } from '@/features/files/api/filesApi';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import type { AuditEntry } from '@/types/domain';
import type { ActionType, Role } from '@/types/rbac';

const FINAL_STAGE = 'CommitteeFinalized' as const;

const ACTION_MAP: Record<string, ActionType> = {
  approve: 'APPROVE',
  reject: 'REJECT',
  requestrevision: 'REJECT',
  submit: 'APPROVE',
  publish: 'PUBLISH',
  finalize: 'PUBLISH',
  score: 'SCORE',
  updatescore: 'SCORE',
  addsupplementarycriteria: 'EDIT',
  edit: 'EDIT',
};

// stageLevel = stage hồ sơ đang ở khi hành động diễn ra → suy ra cấp thao tác
const STAGE_ACTOR_MAP: Record<string, { role: Role; label: string }> = {
  Draft: { role: 'LOCAL', label: 'Địa phương' },
  RequiresRevision: { role: 'SPECIALIST', label: 'Chuyên viên' },
  LocalSubmitted: { role: 'SPECIALIST', label: 'Chuyên viên' },
  SpecialistApproved: { role: 'LEADER', label: 'Lãnh đạo ban' },
  LeaderApproved: { role: 'COUNCIL', label: 'Hội đồng thi đua' },
  CouncilApproved: { role: 'COMMITTEE', label: 'Ban thường trực' },
  CommitteeFinalized: { role: 'COMMITTEE', label: 'Ban thường trực' },
};

function mapHistoryToAudit(item: ApprovalHistoryItem): AuditEntry {
  const actor = STAGE_ACTOR_MAP[item.stageLevel];
  return {
    id: item.id,
    timestamp: item.createdAt,
    actorName: actor?.label ?? 'Hệ thống',
    actorRole: actor?.role ?? 'LOCAL',
    action: ACTION_MAP[item.action?.toLowerCase()] ?? 'EDIT',
    fieldName: item.submissionId,
    oldValue: null,
    newValue: item.action,
    reason: item.reason,
  };
}

function classification(score: number, maxScore: number) {
  const ratio = maxScore ? score / maxScore : 0;
  if (ratio >= 0.9) return 'Hoàn thành xuất sắc';
  if (ratio >= 0.8) return 'Hoàn thành tốt';
  if (ratio >= 0.65) return 'Hoàn thành';
  return 'Chưa hoàn thành';
}

interface ResultRow {
  submission: SubmissionApi;
  groupName: string;
  groupContent: string;
  proposedBonus: number;
  officialBonus: number;
  maxTotal: number;
  rank: number;
  rankTotal: number;
}


function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return <div className={label === 'Nội dung' ? 'sm:col-span-2' : ''}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6">{value}</dd></div>;
}

function childCriterionName(criterion: CriteriaApi, result: SubmissionResultItem | null) {
  return result?.criteriaContent && result.criteriaContent !== criterion.content ? result.criteriaContent : 'Tiêu chí con';
}

function ResultCards({ rows, page, onPageChange, onView }: { rows: ResultRow[]; page: number; onPageChange: (page: number) => void; onView: (row: ResultRow) => void }) {
  const pageCount = Math.max(1, Math.ceil(rows.length / 10));
  const safePage = Math.min(page, pageCount);
  const visibleRows = rows.slice((safePage - 1) * 10, safePage * 10);
  return <div className="space-y-3 md:hidden">
    {visibleRows.map((row, index) => <article key={row.submission.id} className="rounded-[10px] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">STT {(safePage - 1) * 10 + index + 1}</p><h2 className="mt-1 text-sm font-semibold leading-5">{row.groupName}</h2></div><Badge className="shrink-0 bg-success text-success-foreground">Đã duyệt</Badge></div>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{row.groupContent || '—'}</p>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-border py-3 text-sm"><span className="text-muted-foreground">Điểm đề xuất</span><span className="text-right font-semibold tabular-nums">{row.submission.totalProposedPoint}</span><span className="text-muted-foreground">Tổng điểm</span><span className="text-right font-semibold tabular-nums text-primary">{row.submission.totalFinalPoint}</span><span className="text-muted-foreground">Xếp loại</span><span className="text-right font-medium text-success">{classification(row.submission.totalFinalPoint, row.maxTotal)}</span><span className="text-muted-foreground">Thứ hạng</span><span className="text-right tabular-nums">{row.rank ? `${row.rank}/${row.rankTotal}` : '—'}</span></div>
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => onView(row)}><Eye className="size-4" />Xem chi tiết</Button>
    </article>)}
    {!rows.length && <EmptyState title="Chưa có kết quả phù hợp" description="Thử điều chỉnh điều kiện tìm kiếm." />}
    {rows.length > 10 && <nav aria-label="Phân trang kết quả" className="flex items-center justify-between border-t border-border pt-3"><p className="text-xs text-muted-foreground">Trang {safePage}/{pageCount}</p><div className="flex gap-2"><Button type="button" variant="outline" size="icon" aria-label="Trang trước" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)}><ChevronLeft className="size-4" /></Button><Button type="button" variant="outline" size="icon" aria-label="Trang sau" disabled={safePage === pageCount} onClick={() => onPageChange(safePage + 1)}><ChevronRight className="size-4" /></Button></div></nav>}
  </div>;
}

function ScorePair({ point, bonus, maxPoint, maxBonus }: { point: number; bonus: number; maxPoint: number; maxBonus: number }) {
  return <div className="grid grid-cols-2 gap-1.5"><div className="min-w-0 rounded-md border border-border bg-muted/30 px-2 py-1.5"><p className="whitespace-nowrap text-xs text-muted-foreground">Điểm</p><p className="mt-0.5 whitespace-nowrap text-sm font-semibold tabular-nums">{point}<span className="ml-1 text-xs font-medium text-success">/ {maxPoint}</span></p></div><div className="min-w-0 rounded-md border border-border bg-muted/30 px-2 py-1.5"><p className="whitespace-nowrap text-xs text-muted-foreground">Điểm thưởng</p><p className="mt-0.5 whitespace-nowrap text-sm font-semibold tabular-nums">{bonus}<span className="ml-1 text-xs font-medium text-success">/ {maxBonus}</span></p></div></div>;
}

/** Nút nhận xét — bấm mở popup hiển thị nhận xét của một cấp xét duyệt. */
function CommentButton({ label, value }: { label: string; value?: string | null }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); setOpen(true); }}><MessageSquareText className="size-4" />Xem nhận xét</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <p className="whitespace-pre-wrap text-sm leading-6">{value || '—'}</p>
      </DialogContent>
    </Dialog>
  </>;
}

/** Kết quả thi đua của địa phương — chỉ hiển thị hồ sơ đã được Ủy ban công bố (CommitteeFinalized). */
export default function LocalityResultsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const localityId = user?.localityId;
  const [selectedRow, setSelectedRow] = useState<ResultRow | null>(null);
  const [evidenceDialog, setEvidenceDialog] = useState<{ criterionName: string; files: SubmissionResultFile[] } | null>(null);
  const [criterionDialog, setCriterionDialog] = useState<{ criterion: CriteriaApi; result: SubmissionResultItem | null } | null>(null);
  const [mobilePage, setMobilePage] = useState(1);

  const submissionsQuery = useQuery({
    queryKey: ['locality-final-submissions'],
    queryFn: () => localityApi.listMySubmissions({ stage: FINAL_STAGE, page: 1, pageSize: 100 }),
    enabled: !id,
  });
  const groupsQuery = useQuery({
    queryKey: ['locality-criteria-groups'],
    queryFn: () => localityApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  const submissions = useMemo(() => submissionsQuery.data?.items ?? [], [submissionsQuery.data]);
  const groupById = useMemo(() => new Map((groupsQuery.data?.items ?? []).map((group) => [group.id, group])), [groupsQuery.data]);

  const detailQuery = useQuery({
    queryKey: ['locality-final-submission', id],
    queryFn: () => localityApi.getSubmission(id!),
    enabled: Boolean(id),
  });
  const detailSubmission = detailQuery.data;
  const detailGroupQuery = useQuery({
    queryKey: ['locality-final-group', detailSubmission?.criteriaGroupId],
    queryFn: () => localityApi.getCriteriaGroup(detailSubmission!.criteriaGroupId),
    enabled: Boolean(detailSubmission?.criteriaGroupId),
  });
  const historiesQuery = useQuery({
    queryKey: ['locality-final-histories', id],
    queryFn: () => localityApi.listApprovalHistories(id!, { page: 1, pageSize: 100 }),
    enabled: Boolean(id),
  });

  const groupIds = useMemo(() => {
    const ids = new Set(submissions.map((submission) => submission.criteriaGroupId));
    if (detailSubmission?.criteriaGroupId) ids.add(detailSubmission.criteriaGroupId);
    return [...ids];
  }, [detailSubmission?.criteriaGroupId, submissions]);

  const ranksQuery = useQuery({
    queryKey: ['locality-final-ranks', groupIds],
    enabled: groupIds.length > 0,
    queryFn: async () => {
      const pages = await Promise.all(groupIds.map((groupId) => localityApi.listSubmissionsByGroup(groupId, { stage: FINAL_STAGE, page: 1, pageSize: 100 })));
      const ranks = new Map<string, { rank: number; total: number }>();
      for (const page of pages) {
        const sorted = [...page.items].sort((left, right) => right.totalFinalPoint - left.totalFinalPoint);
        sorted.forEach((item, index) => ranks.set(item.id, { rank: index + 1, total: sorted.length }));
      }
      return ranks;
    },
  });

  // Nhận xét của Hội đồng / Ban thường trực — lấy từ approval_histories.reason theo stage
  const commentsQuery = useQuery({
    queryKey: ['locality-final-comments', submissions.map((submission) => submission.id)],
    enabled: submissions.length > 0,
    queryFn: async () => {
      const pages = await Promise.all(submissions.map((submission) => localityApi.listApprovalHistories(submission.id, { page: 1, pageSize: 100 })));
      const comments = new Map<string, { council: string | null; committee: string | null }>();
      pages.forEach((page, index) => {
        const items = page.items;
        comments.set(submissions[index].id, {
          council: [...items].reverse().find((item) => item.stageLevel === 'LeaderApproved' && item.reason)?.reason ?? null,
          committee: [...items].reverse().find((item) => (item.stageLevel === 'CouncilApproved' || item.stageLevel === 'CommitteeFinalized') && item.reason)?.reason ?? null,
        });
      });
      return comments;
    },
  });

  const rows = useMemo<ResultRow[]>(() => submissions.map((submission) => {
    const rankInfo = ranksQuery.data?.get(submission.id);
    return {
      submission,
      groupName: submission.criteriaGroupName ?? groupById.get(submission.criteriaGroupId)?.name ?? submission.criteriaGroupId,
      groupContent: groupById.get(submission.criteriaGroupId)?.content ?? '',
      proposedBonus: submission.results.reduce((total, result) => total + result.bonusPoint, 0),
      officialBonus: submission.results.reduce((total, result) => total + (result.officialBonusPoint ?? result.bonusPoint), 0),
      maxTotal: submission.results.reduce((total, result) => total + result.snapshotMaxPoint + result.snapshotMaxBonusPoint, 0),
      rank: rankInfo?.rank ?? 0,
      rankTotal: rankInfo?.total ?? 0,
    };
  }), [groupById, ranksQuery.data, submissions]);

  const columns = useMemo<ColumnDef<ResultRow>[]>(() => [
    { accessorFn: (row) => row.groupName, header: 'Nhóm tiêu chí', cell: ({ row }) => <TruncatedText as="p" value={row.original.groupName} maxLines={2} className="font-semibold leading-5 text-foreground" />, meta: { list: { width: 'minmax(220px,1.2fr)' }, disableTooltip: true } },
    { accessorFn: (row) => row.groupContent, header: 'Nội dung', cell: ({ row }) => <TruncatedText as="p" value={row.original.groupContent || '—'} maxLines={2} className="text-sm leading-5 text-muted-foreground" />, meta: { list: { width: 'minmax(260px,1.4fr)' }, disableTooltip: true } },
    { accessorFn: (row) => row.submission.totalProposedPoint, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.submission.totalProposedPoint}</span>, meta: { align: 'right', list: { width: 'minmax(140px,.7fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Tổng điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.8fr)' } } },
    { id: 'decision', header: 'Quyết định kết quả', cell: () => <Badge className="bg-success px-2.5 py-1 text-success-foreground">Đã duyệt</Badge>, meta: { align: 'center', list: { width: 'minmax(140px,.75fr)' } } },
  ], []);

  if (!localityId) return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương." />;

  // ── Danh sách kết quả đã công bố ────────────────────────────────────────────
  if (!id) {
    if (submissionsQuery.isLoading || groupsQuery.isLoading) return <PageLoading label="Đang tải kết quả thi đua…" />;
    if (submissionsQuery.isError || groupsQuery.isError) return <EmptyState variant="error" title="Không tải được kết quả" description={getLocalityApiError(submissionsQuery.error ?? groupsQuery.error)} />;

    const selectedComments = selectedRow ? commentsQuery.data?.get(selectedRow.submission.id) : null;

    return <div className="space-y-5">
      <PageHeader title="Kết quả tiêu chí thi đua" description="Kết quả chính thức đã được Ủy ban thường trực công bố." />
      {selectedRow && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-6 p-5">
            <div className="min-w-0 flex-1 basis-72">
              <div className="flex items-center gap-2"><Trophy className="size-4 text-success" /><p className="text-sm text-muted-foreground">Trạng thái</p><Badge className="bg-foreground px-3 text-sm text-background">Đã công bố</Badge></div>
              <p className="mt-2 truncate font-semibold" title={selectedRow.groupName}>{selectedRow.groupName}</p>
              {selectedRow.groupContent && <TruncatedText as="p" value={selectedRow.groupContent} maxLines={2} className="mt-1 text-sm text-muted-foreground" />}
              <p className="mt-2 text-xs text-muted-foreground">Ngày công bố {selectedRow.submission.updatedAt ? formatDate(selectedRow.submission.updatedAt) : '—'}</p>
            </div>
            <div className="grid min-w-0 flex-[2] basis-[420px] grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Tổng điểm thực tế</p><p className="mt-0.5 text-xl font-bold tabular-nums text-primary">{selectedRow.submission.totalFinalPoint}</p></div>
              <div><p className="text-xs text-muted-foreground">Tổng điểm thưởng thực tế</p><p className="mt-0.5 text-xl font-bold tabular-nums">{selectedRow.officialBonus}</p></div>
              <div><p className="text-xs text-muted-foreground">Kết quả xếp loại</p><Badge className="mt-1 max-w-full whitespace-normal bg-success px-2.5 py-0.5 text-left text-xs leading-5 text-success-foreground">{classification(selectedRow.submission.totalFinalPoint, selectedRow.maxTotal)}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Thứ hạng</p><p className="mt-0.5 text-xl font-bold tabular-nums">{selectedRow.rank ? `${selectedRow.rank}/${selectedRow.rankTotal}` : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Nhận xét Hội đồng thi đua</p><div className="mt-1"><CommentButton label="Nhận xét từ Hội đồng thi đua" value={selectedComments?.council} /></div></div>
              <div><p className="text-xs text-muted-foreground">Nhận xét Ban thường trực</p><div className="mt-1"><CommentButton label="Nhận xét từ Ban thường trực" value={selectedComments?.committee} /></div></div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="hidden md:block"><DataTable
        data={rows}
        columns={columns}
        pageSize={10}
        variant="list"
        searchable
        searchPlaceholder="Tìm tên nhóm tiêu chí..."
        getRowId={(row) => row.submission.id}
        selectedRowId={selectedRow?.submission.id}
        onRowClick={setSelectedRow}
        onRowDoubleClick={(row) => navigate(`/dia-phuong/ket-qua/${row.submission.id}`)}
        toolbar={<Button variant="info" disabled={!selectedRow} disabledReason="Chọn một kết quả để xem chi tiết." onClick={() => selectedRow && navigate(`/dia-phuong/ket-qua/${selectedRow.submission.id}`)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button>}
        emptyState={{ title: 'Chưa có kết quả được công bố', description: 'Kết quả sẽ xuất hiện tại đây sau khi hồ sơ được Ủy ban thường trực công bố.', icon: <Trophy className="size-8" /> }}
        stickyTitle="Kết quả tiêu chí thi đua"
        stickyDescription="Danh sách nhóm tiêu chí đã công bố"
      /></div>
      <ResultCards rows={rows} page={mobilePage} onPageChange={setMobilePage} onView={(row) => navigate(`/dia-phuong/ket-qua/${row.submission.id}`)} />
    </div>;
  }

  // ── Chi tiết kết quả ────────────────────────────────────────────────────────
  if (detailQuery.isLoading || detailGroupQuery.isLoading) return <PageLoading label="Đang tải chi tiết kết quả…" />;
  if (detailQuery.isError) return <EmptyState variant="error" title="Không tải được chi tiết kết quả" description={getLocalityApiError(detailQuery.error)} />;
  if (!detailSubmission || detailSubmission.currentStage !== FINAL_STAGE) {
    return <EmptyState title="Kết quả chưa được công bố" description="Chi tiết chỉ hiển thị khi hồ sơ đã được Ủy ban thường trực công bố." action={<Button variant="outline" render={<Link to="/dia-phuong/ket-qua" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />;
  }

  const group = detailGroupQuery.data;
  const criteria = (group?.criteria ?? []).filter((criterion) => criterion.type !== 'Supplementary' || criterion.targetSubmissionId === detailSubmission.id);
  const resultByCriterion = new Map(detailSubmission.results.map((result) => [result.criteriaId, result]));
  const audits = (historiesQuery.data?.items ?? []).map(mapHistoryToAudit).sort((left, right) => +new Date(right.timestamp) - +new Date(left.timestamp));
  const detailProposedBonus = detailSubmission.results.reduce((total, result) => total + result.bonusPoint, 0);
  const detailOfficialBonus = detailSubmission.results.reduce((total, result) => total + (result.officialBonusPoint ?? result.bonusPoint), 0);

  return <div className="space-y-5">
    <nav aria-label="Điều hướng" className="flex min-w-0 items-center gap-2 text-sm"><Link to="/dia-phuong/ket-qua" className="shrink-0 text-primary hover:underline">Kết quả tiêu chí thi đua</Link><span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">{group?.name ?? detailSubmission.criteriaGroupName ?? 'Chi tiết nhóm'}</span></nav>
    <PageHeader title="Chi tiết kết quả thi đua" description={group?.name ?? detailSubmission.criteriaGroupName ?? ''} actions={<Button variant="outline" render={<Link to="/dia-phuong/ket-qua" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>} />

    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-6 p-5">
        <div className="min-w-0 flex-1 basis-72">
          <div className="flex items-center gap-2"><Trophy className="size-4 text-success" /><p className="text-sm text-muted-foreground">Trạng thái</p><Badge className="bg-foreground px-3 text-sm text-background">Đã công bố</Badge></div>
          <p className="mt-2 truncate font-semibold" title={group?.name ?? detailSubmission.criteriaGroupName ?? ''}>{group?.name ?? detailSubmission.criteriaGroupName}</p>
          {group?.content && <TruncatedText as="p" value={group.content} maxLines={2} className="mt-1 text-sm text-muted-foreground" />}
          <p className="mt-2 text-xs text-muted-foreground">Ngày công bố {detailSubmission.updatedAt ? formatDate(detailSubmission.updatedAt) : '—'}</p>
        </div>
        <div className="grid min-w-0 flex-[2] basis-[380px] grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">Tổng điểm đề xuất</p><p className="mt-0.5 text-xl font-bold tabular-nums">{detailSubmission.totalProposedPoint}</p></div>
          <div><p className="text-xs text-muted-foreground">Tổng điểm thưởng đề xuất</p><p className="mt-0.5 text-xl font-bold tabular-nums">{detailProposedBonus}</p></div>
          <div><p className="text-xs text-muted-foreground">Tổng điểm thực tế</p><p className="mt-0.5 text-xl font-bold tabular-nums text-primary">{detailSubmission.totalFinalPoint}</p></div>
          <div><p className="text-xs text-muted-foreground">Tổng điểm thưởng thực tế</p><p className="mt-0.5 text-xl font-bold tabular-nums text-primary">{detailOfficialBonus}</p></div>
        </div>
      </CardContent>
    </Card>

    <section className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div><h2 className="flex items-center gap-2 text-base font-semibold"><FileText className="size-4 text-primary" />Chi tiết tiêu chí con</h2><p className="mt-1 text-sm text-muted-foreground">Điểm chính thức đã được các cấp thẩm định và công bố.</p></div>
      </div>
      <div className="hidden overflow-x-auto md:block"><Table className="min-w-[1480px] table-fixed">
        <colgroup><col className="w-[29%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[11%]" /><col className="w-[4%]" /></colgroup>
        <TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-center text-primary-foreground">Điểm đề xuất</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-center text-primary-foreground">Điểm thực tế</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Lý do</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Bằng chứng</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Ghi chú</TableHead><TableHead className="bg-primary px-3 py-3 text-center text-primary-foreground"><span className="sr-only">Xem chi tiết</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {criteria.map((criterion) => {
            const result = resultByCriterion.get(criterion.id);
            const files = result?.files ?? [];
            return <TableRow key={criterion.id} className="cursor-pointer align-top" onClick={() => setCriterionDialog({ criterion, result: result ?? null })}>
              <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5"><TruncatedText as="p" value={criterion.content} maxLines={4} className="font-semibold leading-5" /><p className="mt-2 text-xs text-muted-foreground">{criterion.type === 'Supplementary' ? 'Tiêu chí bổ sung' : 'Tiêu chí chấm điểm'}{criterion.deadline ? ` · Hạn nộp ${formatDate(criterion.deadline)}` : ''}</p></TableCell>
              <TableCell className="border-r border-primary/15 px-2 py-5">{result ? <ScorePair point={result.point} bonus={result.bonusPoint} maxPoint={result.snapshotMaxPoint} maxBonus={result.snapshotMaxBonusPoint} /> : <span className="block text-center text-sm text-muted-foreground">—</span>}</TableCell>
              <TableCell className="border-r border-primary/15 px-2 py-5">{result ? <ScorePair point={result.officialPoint ?? result.point} bonus={result.officialBonusPoint ?? result.bonusPoint} maxPoint={result.snapshotMaxPoint} maxBonus={result.snapshotMaxBonusPoint} /> : <span className="block text-center text-sm text-muted-foreground">—</span>}</TableCell>
              <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5 text-sm leading-6 text-muted-foreground"><TruncatedText value={result?.officialReason || '—'} maxLines={4} /></TableCell>
              <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5">{files.length ? <Button type="button" variant="outline" size="sm" className="w-full justify-center" onClick={(event) => { event.stopPropagation(); setEvidenceDialog({ criterionName: criterion.content, files }); }}><FileText className="size-4" />Xem ({files.length})</Button> : <span className="text-xs text-muted-foreground">Chưa có</span>}</TableCell>
              <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5 text-sm leading-6 text-muted-foreground"><TruncatedText value={criterion.note || '—'} maxLines={4} /></TableCell>
              <TableCell className="px-3 py-5 text-center"><Button type="button" variant="ghost" size="icon" aria-label={`Xem chi tiết ${childCriterionName(criterion, result ?? null)}`} onClick={(event) => { event.stopPropagation(); setCriterionDialog({ criterion, result: result ?? null }); }}><Eye className="size-4" /></Button></TableCell>
            </TableRow>;
          })}
          {!criteria.length && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Chưa có tiêu chí con.</TableCell></TableRow>}
        </TableBody>
      </Table></div>
      <div className="space-y-3 p-4 md:hidden">{criteria.map((criterion) => {
        const result = resultByCriterion.get(criterion.id) ?? null;
        const files = result?.files ?? [];
        return <article key={criterion.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Tiêu chí con</p><p className="mt-1 text-sm font-semibold">{criterion.content}</p></div><Button type="button" variant="ghost" size="icon" aria-label={`Xem chi tiết ${childCriterionName(criterion, result)}`} onClick={() => setCriterionDialog({ criterion, result })}><Eye className="size-4" /></Button></div><p className="mt-3 text-xs text-muted-foreground">Nội dung</p><p className="mt-1 text-sm leading-5">{criterion.content}</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-xs text-muted-foreground">Điểm đề xuất</p><p className="mt-1 font-semibold tabular-nums">{result?.point ?? '—'}</p></div><div><p className="text-xs text-muted-foreground">Điểm thực tế</p><p className="mt-1 font-semibold tabular-nums text-primary">{result?.officialPoint ?? result?.point ?? '—'}</p></div></div><p className="mt-3 text-xs text-muted-foreground">Lý do</p><p className="mt-1 text-sm leading-5">{result?.officialReason || '—'}</p><div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs text-muted-foreground">Ghi chú: {criterion.note || '—'}</span>{files.length ? <Button type="button" variant="outline" size="sm" onClick={() => setEvidenceDialog({ criterionName: criterion.content, files })}><FileText className="size-4" />Xem ({files.length})</Button> : <span className="text-xs text-muted-foreground">Chưa có bằng chứng</span>}</div></article>;
      })}{!criteria.length && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có tiêu chí con.</p>}</div>
    </section>

    {(group?.files ?? []).length > 0 && (
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="bg-primary px-4 py-3 text-primary-foreground"><p className="text-sm font-semibold">Quyết định đính kèm</p><p className="mt-0.5 text-xs text-white/75">File đính kèm của nhóm tiêu chí</p></div>
        <div className="p-3"><ul className="space-y-2">{(group?.files ?? []).map((file) => (
          <li key={file.id} className="overflow-hidden rounded-md border border-border border-l-[3px] border-l-primary bg-card">
            <div className="flex items-center gap-3 px-3 py-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10"><FileText className="h-4.5 w-4.5 text-primary" /></span><TruncatedText value={file.displayName || file.originalName} className="flex-1 text-[13px] font-semibold text-foreground" /></div>
            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-1.5">
              <span className="truncate text-[11px] text-muted-foreground">{file.sizeBytes ? `${Math.ceil(file.sizeBytes / 1024)} KB` : ''} · {formatDate(file.createdAt)}</span>
              <button type="button" title="Tải file về máy" onClick={() => void downloadFile(file.id, file.displayName || file.originalName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.'))} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><Download className="h-4 w-4" /></button>
            </div>
          </li>
        ))}</ul></div>
      </div>
    )}

    <Card><CardContent className="p-5"><p className="mb-3 text-base font-semibold">Lịch sử thay đổi</p><AuditTimeline entries={audits} /></CardContent></Card>

    <Dialog open={Boolean(criterionDialog)} onOpenChange={(open) => { if (!open) setCriterionDialog(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Chi tiết tiêu chí con</DialogTitle>
          <DialogDescription>{detailSubmission.criteriaGroupName ?? group?.name}</DialogDescription>
        </DialogHeader>
        {criterionDialog && (() => {
          const { criterion, result } = criterionDialog;
          const files = result?.files ?? [];
          return <div className="space-y-4">
            <section aria-label="Thông tin nhóm tiêu chí" className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Thông tin nhóm tiêu chí</h3>
              <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                <DetailItem label="Tên nhóm tiêu chí" value={group?.name ?? detailSubmission.criteriaGroupName ?? '—'} />
                <DetailItem label="Trạng thái" value={<Badge className="bg-success text-success-foreground">Đã công bố</Badge>} />
                <DetailItem label="Nội dung" value={group?.content ?? '—'} />
              </dl>
            </section>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">Nội dung tiêu chí con</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6">{criterion.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">{criterion.type === 'Supplementary' ? 'Tiêu chí bổ sung' : 'Tiêu chí chấm điểm'} · Hạn nộp: {criterion.deadline ? formatDate(criterion.deadline) : '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm đề xuất</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{result?.point ?? 0}<span className="ml-1 text-xs font-medium text-success">/ {result?.snapshotMaxPoint ?? criterion.maxPoint}</span></p></div>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thưởng ĐX</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{result?.bonusPoint ?? 0}<span className="ml-1 text-xs font-medium text-success">/ {result?.snapshotMaxBonusPoint ?? criterion.maxBonusPoint}</span></p></div>
              <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thực tế</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">{result?.officialPoint ?? result?.point ?? 0}<span className="ml-1 text-xs font-medium text-success">/ {result?.snapshotMaxPoint ?? criterion.maxPoint}</span></p></div>
              <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thưởng TT</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">{result?.officialBonusPoint ?? result?.bonusPoint ?? 0}<span className="ml-1 text-xs font-medium text-success">/ {result?.snapshotMaxBonusPoint ?? criterion.maxBonusPoint}</span></p></div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nội dung diễn giải</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{result?.explanation?.trim() || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Lý do chấm điểm (Chuyên viên/Lãnh đạo)</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{result?.officialReason?.trim() || '—'}</p>
            </div>
            <div><p className="text-xs font-medium text-muted-foreground">Hạn nộp</p><p className="mt-1 text-sm leading-6">{criterion.deadline ? formatDate(criterion.deadline) : '—'}</p></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bằng chứng</p>
              {files.length ? <ul className="mt-2 space-y-2">{files.map((file) => (
                <li key={file.id} className="flex min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2.5">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <TruncatedText value={file.displayName || file.originalName} className="flex-1 text-sm font-medium" />
                  <span className="shrink-0 text-xs text-muted-foreground">{Math.ceil(file.sizeBytes / 1024)} KB</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void downloadFile(file.id, file.displayName || file.originalName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.'))}><Download className="size-4" />Tải về</Button>
                </li>
              ))}</ul> : <p className="mt-1 text-sm text-muted-foreground">Chưa có minh chứng</p>}
            </div>
            {criterion.note && <div><p className="text-xs font-medium text-muted-foreground">Ghi chú</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{criterion.note}</p></div>}
          </div>;
        })()}
      </DialogContent>
    </Dialog>

    <ListDialog open={Boolean(evidenceDialog)} onOpenChange={(open) => { if (!open) setEvidenceDialog(null); }} title="Minh chứng đã nộp" description={evidenceDialog?.criterionName} searchable={false} className="sm:max-w-xl" items={(evidenceDialog?.files ?? []).map((file) => ({ id: file.id, label: file.displayName || file.originalName, description: `${Math.ceil(file.sizeBytes / 1024)} KB` }))} emptyText="Tiêu chí này chưa có file minh chứng." renderItem={(item) => { const file = evidenceDialog?.files.find((candidate) => candidate.id === item.id); return <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2.5"><FileText className="size-4 shrink-0 text-primary" /><TruncatedText value={item.label} className="flex-1 text-sm font-medium" /><Button type="button" variant="outline" size="sm" onClick={() => { if (file) void downloadFile(file.id, file.displayName || file.originalName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.')); }}><Download className="size-4" />Tải về</Button></div>; }} />
  </div>;
}
