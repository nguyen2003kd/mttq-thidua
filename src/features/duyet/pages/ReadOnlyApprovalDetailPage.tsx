import { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText, History } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, EmptyState, ListDialog, PageHeader, PageLoading, TruncatedText } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { specialistApi, type SubmissionResultFile, type SubmissionStage } from '@/features/cham-diem/api/specialistApi';
import { downloadFile } from '@/features/files/api/filesApi';
import type { ScoreState } from '@/types/rbac';

type Reviewer = 'council' | 'committee';

const REVIEWER_CONFIG: Record<Reviewer, {
  stage: SubmissionStage;
  state: ScoreState;
  label: string;
  listPath: string;
  historyPath: string;
  groupPath: (localityId: string) => string | null;
  description: string;
}> = {
  council: {
    stage: 'LeaderApproved', state: 'CHO_DUYET_HOI_DONG', label: 'Hội đồng thi đua',
    listPath: '/thi-dua/duyet/hoi-dong-tdkt', historyPath: '/hoi-dong/lich-su',
    groupPath: (localityId) => `/thi-dua/duyet/hoi-dong-tdkt/${localityId}`,
    description: 'Đối chiếu kết quả lãnh đạo ban đã duyệt trước khi xét duyệt hồ sơ.',
  },
  committee: {
    stage: 'CouncilApproved', state: 'CHO_DUYET_BTT', label: 'Ban thường trực',
    listPath: '/thi-dua/duyet/ban-thuong-truc', historyPath: '/uy-ban/lich-su', groupPath: () => null,
    description: 'Đối chiếu kết quả Hội đồng đã duyệt trước khi công bố kết quả.',
  },
};

function ScorePair({ point, bonus, maxPoint, maxBonus }: { point: number; bonus: number; maxPoint: number; maxBonus: number }) {
  return <div className="grid grid-cols-2 gap-2"><div className="rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{point}<span className="ml-1 text-xs font-medium text-success">/ {maxPoint}</span></p></div><div className="rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thưởng</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{bonus}<span className="ml-1 text-xs font-medium text-success">/ {maxBonus}</span></p></div></div>;
}

/** Lớp 3 dùng chung: Hội đồng/Ban thường trực xem hồ sơ trên trang, không dùng popup. */
export default function ReadOnlyApprovalDetailPage({ reviewer }: { reviewer: Reviewer }) {
  const { localityId, groupId } = useParams<{ localityId: string; groupId: string }>();
  const [evidenceDialog, setEvidenceDialog] = useState<{ criterionName: string; files: SubmissionResultFile[] } | null>(null);
  const config = REVIEWER_CONFIG[reviewer];
  const localityCode = localityId?.startsWith('loc-') ? localityId.slice(4) : localityId ?? '';
  const groupQuery = useQuery({ queryKey: ['approval-detail-group', groupId], queryFn: () => specialistApi.getCriteriaGroup(groupId!), enabled: Boolean(groupId) });
  const submissionsQuery = useQuery({ queryKey: ['approval-detail-submissions', reviewer, groupId, localityCode], queryFn: async () => { const page = await specialistApi.listSubmissionsByGroup(groupId!, { stage: config.stage, page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }); return page.items.find((item) => (item.createdByWardCode ?? item.createdBy ?? '') === localityCode) ?? null; }, enabled: Boolean(groupId && localityCode) });
  const detailQuery = useQuery({ queryKey: ['approval-detail-submission', submissionsQuery.data?.id], queryFn: () => specialistApi.getSubmission(submissionsQuery.data!.id), enabled: Boolean(submissionsQuery.data?.id) });
  const submission = detailQuery.data ?? submissionsQuery.data;
  const criteria = useMemo(() => (groupQuery.data?.criteria ?? []).filter((criterion) => criterion.type !== 'Supplementary' || criterion.targetSubmissionId === submission?.id), [groupQuery.data, submission?.id]);
  const resultByCriterion = useMemo(() => new Map((submission?.results ?? []).map((result) => [result.criteriaId, result])), [submission]);

  if (!groupId || !localityId) return <EmptyState title="Không tìm thấy hồ sơ" description="Thiếu mã nhóm tiêu chí hoặc địa phương." />;
  if (groupQuery.isLoading || submissionsQuery.isLoading || detailQuery.isLoading) return <PageLoading label="Đang tải chi tiết hồ sơ…" />;
  if (groupQuery.isError || submissionsQuery.isError || detailQuery.isError) return <EmptyState variant="error" title="Không tải được chi tiết hồ sơ" description="Vui lòng thử lại sau." />;
  if (!submission || !groupQuery.data) return <EmptyState title="Không tìm thấy hồ sơ" description={`Hồ sơ không còn ở bước ${config.label}.`} />;

  const localityName = submission.localityFullName ?? submission.createdByUsername ?? localityCode;
  const groupPath = config.groupPath(localityId);
  const proposed = submission.results.reduce((total, item) => total + item.point, 0);
  const proposedBonus = submission.results.reduce((total, item) => total + item.bonusPoint, 0);
  const official = submission.results.reduce((total, item) => total + (item.officialPoint ?? item.point), 0);
  const officialBonus = submission.results.reduce((total, item) => total + (item.officialBonusPoint ?? item.bonusPoint), 0);

  return <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 pb-6">
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><Link to={config.listPath} className="hover:text-primary">Danh sách địa phương</Link><span>/</span>{groupPath ? <Link to={groupPath} className="hover:text-primary">{localityName}</Link> : <span>{localityName}</span>}<span>/</span><span className="font-medium text-foreground">{groupQuery.data.name}</span></nav>
    <PageHeader title="Chi tiết kết quả tiêu chí" description={`${localityName} · ${config.label}`} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link to={config.historyPath} />} nativeButton={false}><History className="size-4" />Lịch sử</Button><Button variant="outline" render={<Link to={groupPath ?? config.listPath} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button></div>} />
    <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-5"><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Địa phương</p><p className="mt-1 truncate font-semibold">{localityName}</p></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Trạng thái</p><Badge className="mt-1 bg-warning/15 text-warning-foreground">Chờ {config.label} xử lý</Badge></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Điểm địa phương đề xuất</p><p className="mt-1 text-lg font-semibold tabular-nums">{proposed}</p></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Điểm thưởng đề xuất</p><p className="mt-1 text-lg font-semibold tabular-nums">{proposedBonus}</p></div><div className="bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">Điểm đã thẩm định</p><p className="mt-1 text-lg font-semibold tabular-nums">{official + officialBonus}</p></div></div></section>
    <section className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5"><div><h2 className="flex items-center gap-2 text-base font-semibold"><FileText className="size-4 text-primary" />Chi tiết tiêu chí con</h2><p className="mt-1 text-sm text-muted-foreground">{config.description}</p></div><Badge variant="outline">{criteria.length} tiêu chí</Badge></div><Table className="min-w-[1220px] table-fixed"><colgroup><col className="w-[25%]" /><col className="w-[13%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[26%]" /></colgroup><TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Minh chứng</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Địa phương đề xuất</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Điểm đã thẩm định</TableHead><TableHead className="bg-primary px-4 py-3 text-primary-foreground">Nội dung diễn giải</TableHead></TableRow></TableHeader><TableBody>{criteria.map((criterion) => { const result = resultByCriterion.get(criterion.id); return <TableRow key={criterion.id} className="align-top"><TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5"><TruncatedText as="p" value={criterion.content} maxLines={4} className="font-semibold leading-5" /><p className="mt-2 text-xs text-muted-foreground">{criterion.type === 'Supplementary' ? 'Tiêu chí bổ sung' : 'Tiêu chí chấm điểm'}</p></TableCell><TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5">{result?.files.length ? <Button type="button" variant="outline" className="w-full justify-center" onClick={() => setEvidenceDialog({ criterionName: criterion.content, files: result.files })}><FileText className="size-4" />Xem file ({result.files.length})</Button> : <span className="text-xs text-muted-foreground">Chưa có minh chứng</span>}</TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><ScorePair point={result?.point ?? 0} bonus={result?.bonusPoint ?? 0} maxPoint={criterion.maxPoint} maxBonus={criterion.maxBonusPoint} /></TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><ScorePair point={result?.officialPoint ?? result?.point ?? 0} bonus={result?.officialBonusPoint ?? result?.bonusPoint ?? 0} maxPoint={criterion.maxPoint} maxBonus={criterion.maxBonusPoint} /></TableCell><TableCell className="whitespace-normal px-4 py-5 text-sm leading-6 text-muted-foreground">{result?.explanation || '—'}{result?.officialReason && <p className="mt-2 border-t border-border pt-2"><span className="font-medium text-foreground">Lý do chấm:</span> {result.officialReason}</p>}</TableCell></TableRow>; })}{criteria.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}</TableBody></Table></section>
    <ListDialog open={Boolean(evidenceDialog)} onOpenChange={(open) => { if (!open) setEvidenceDialog(null); }} title="Minh chứng đã nộp" description={evidenceDialog?.criterionName} items={(evidenceDialog?.files ?? []).map((file) => ({ id: file.id, label: file.displayName || file.originalName, description: `${Math.ceil(file.sizeBytes / 1024)} KB` }))} emptyText="Tiêu chí này chưa có file minh chứng." renderItem={(item) => { const file = evidenceDialog?.files.find((candidate) => candidate.id === item.id); return <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2.5"><FileText className="size-4 shrink-0 text-primary" /><TruncatedText value={item.label} className="flex-1 text-sm font-medium" /><Button type="button" variant="outline" size="sm" onClick={() => { if (file) void downloadFile(file.id, file.displayName || file.originalName).catch(() => toast.error('Không thể tải file. Vui lòng thử lại.')); }}><Download className="size-4" />Tải về</Button></div>; }} />
  </div>;
}
