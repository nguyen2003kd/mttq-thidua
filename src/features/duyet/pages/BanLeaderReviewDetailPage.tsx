import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FilePlus2, FileText, History, MessageSquareWarning, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { Button, ConfirmDialog, EmptyState, PageHeader } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  EvidenceModal,
  StatusStepper,
  SupplementaryCriterionModal,
} from '@/features/workflow/components';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
import type { CriteriaItem, ScoreEntry } from '@/types/domain';

interface SelectedEvidence {
  entry: ScoreEntry;
  criterion?: CriteriaItem;
}

interface LeaderDraft {
  score: string;
  bonusScore: string;
  reason: string;
}

function ScoreView({ label, score, maximum }: { label: string; score: number; maximum: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
      <p className="min-h-8 text-xs leading-4 text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-foreground">{score}<span className="ml-1 text-xs font-normal text-muted-foreground">/ {maximum}</span></p>
    </div>
  );
}

function LeaderScoreInput({ label, value, maximum, disabled, onChange }: { label: string; value: string; maximum: number; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="truncate text-[11px] font-medium leading-none text-muted-foreground">{label}</p>
      <div className="group relative flex h-9 min-w-[104px] items-center rounded-md border border-border bg-background transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/30 focus-within:border-primary focus-within:bg-primary/[0.02] focus-within:ring-2 focus-within:ring-primary/10">
        <Input aria-label={`${label} Lãnh đạo, tối đa ${maximum} điểm`} className="h-full min-w-0 flex-1 appearance-none rounded-md border-0 bg-transparent py-0 pl-2.5 pr-14 text-right text-sm font-semibold tabular-nums text-foreground shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="number" min={0} max={maximum} step="0.25" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
        <span className="pointer-events-none absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center rounded-[4px] bg-success/10 px-1.5 py-1 text-[11px] font-semibold leading-none tabular-nums text-success transition-colors group-focus-within:bg-success/15">/{maximum}</span>
      </div>
    </div>
  );
}

export default function BanLeaderReviewDetailPage() {
  const { banId = 'ban1', tableId, localityId } = useParams<{ banId?: string; tableId?: string; localityId?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const evidence = useScoreStore((state) => state.evidence);
  const reviewCriterion = useScoreStore((state) => state.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((state) => state.addSupplementaryCriterion);
  const approve = useScoreStore((state) => state.approve);
  const reject = useScoreStore((state) => state.reject);

  const [viewing, setViewing] = useState<SelectedEvidence | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, LeaderDraft>>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  const table = criteriaTables.find((item) => item.id === tableId);
  const locality = localities.find((item) => item.id === localityId);
  const record = table && localityId ? (scores[table.id]?.[localityId] ?? emptyRecord) : emptyRecord;
  const canProcess = record.state === 'CHO_DUYET_BAN';
  const backToGroups = `/thi-dua/duyet/lanh-dao-ban/${banId}/${localityId}`;
  const backToList = `/thi-dua/duyet/lanh-dao-ban/${banId}`;

  const reviewRows = useMemo(() => {
    if (!table) return [];
    const regular = table.criteria.map((criterion) => ({ criterion, entry: record.entries.find((entry) => entry.criteriaId === criterion.id) }));
    const supplementary = record.entries.filter((entry) => entry.isSupplementary).map((entry) => ({ criterion: undefined, entry }));
    return [...regular, ...supplementary];
  }, [record.entries, table]);

  const scoreSummary = useMemo(() => reviewRows.reduce((summary, { criterion, entry }) => {
    if (!entry) return summary;
    const specialist = entry.stageScores?.SPECIALIST;
    const leaderDraft = drafts[entry.criteriaId];
    const maxPoint = criterion?.maxScore ?? entry.supplementaryMaxScore ?? 0;
    const proposed = entry.proposedScore ?? 0;
    const specialistScore = specialist?.score ?? proposed;
    const leaderScore = Number(leaderDraft?.score ?? specialistScore);

    return {
      maximum: summary.maximum + maxPoint,
      proposed: summary.proposed + proposed,
      specialist: summary.specialist + specialistScore,
      leader: summary.leader + (Number.isFinite(leaderScore) ? leaderScore : 0),
    };
  }, { maximum: 0, proposed: 0, specialist: 0, leader: 0 }), [drafts, reviewRows]);

  useEffect(() => {
    setDrafts(Object.fromEntries(reviewRows.filter((row): row is { criterion?: CriteriaItem; entry: ScoreEntry } => Boolean(row.entry)).map(({ entry }) => {
      const specialist = entry.stageScores?.SPECIALIST;
      const leader = entry.stageScores?.LEADER;
      return [entry.criteriaId, {
        score: String(leader?.score ?? specialist?.score ?? entry.proposedScore ?? 0),
        bonusScore: String(leader?.bonusScore ?? specialist?.bonusScore ?? entry.proposedBonusScore ?? 0),
        reason: leader?.reason ?? '',
      }];
    })));
    setDraftErrors({});
  }, [reviewRows]);

  if (!table || !locality || !localityId) {
    return <EmptyState title="Không tìm thấy hồ sơ" description="Hồ sơ địa phương hoặc bảng tiêu chí không hợp lệ." />;
  }

  const hasRevisionRequest = record.entries.some((entry) => Boolean(entry.revisionRequest));
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.localityId === localityId && item.criteriaId === criteriaId);
  const updateDraft = (criteriaId: string, patch: Partial<LeaderDraft>) => setDrafts((current) => ({ ...current, [criteriaId]: { ...current[criteriaId], ...patch } }));

  const validateLeaderScores = () => {
    const errors: Record<string, string> = {};
    reviewRows.forEach(({ criterion, entry }) => {
      if (!entry) return;
      const draft = drafts[entry.criteriaId];
      const score = Number(draft?.score);
      const bonus = Number(draft?.bonusScore || 0);
      const maxScore = criterion?.maxScore ?? entry.supplementaryMaxScore ?? 0;
      const maxBonus = criterion?.bonusScore ?? 0;
      const specialist = entry.stageScores?.SPECIALIST;
      const specialistScore = specialist?.score ?? entry.proposedScore ?? 0;
      const specialistBonus = specialist?.bonusScore ?? entry.proposedBonusScore ?? 0;
      if (!Number.isFinite(score) || score < 0 || score > maxScore) errors[entry.criteriaId] = `Điểm phải từ 0 đến ${maxScore}.`;
      else if (!Number.isFinite(bonus) || bonus < 0 || bonus > maxBonus) errors[entry.criteriaId] = `Điểm thưởng phải từ 0 đến ${maxBonus}.`;
      else if ((entry.isSupplementary || score !== specialistScore || bonus !== specialistBonus) && !draft?.reason.trim()) errors[entry.criteriaId] = 'Nhập lý do khi điểm khác Chuyên viên.';
    });
    setDraftErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveLeaderScores = () => {
    if (!user || !validateLeaderScores()) return false;
    const saved = reviewRows.filter((row): row is { criterion?: CriteriaItem; entry: ScoreEntry } => Boolean(row.entry)).every(({ entry }) => {
      const draft = drafts[entry.criteriaId];
      return reviewCriterion({ tableId: table.id, localityId, criteriaId: entry.criteriaId, score: Number(draft.score), bonusScore: Number(draft.bonusScore || 0), reason: draft.reason.trim() || undefined, stage: 'LEADER', actorName: user.name, actorRole: user.role });
    });
    if (!saved) toast.error('Không thể lưu một hoặc nhiều điểm thẩm định.');
    return saved;
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1480px] flex-col gap-5 pb-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to={backToList} className="hover:text-primary">Danh sách địa phương</Link>
        <span>/</span>
        <Link to={backToGroups} className="hover:text-primary">{locality.name}</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{table.name}</span>
      </nav>

      <PageHeader
        title="Thẩm định hồ sơ địa phương"
        description={`${locality.fullName} · ${table.name} · Đối chiếu kết quả trước khi trình Hội đồng.`}
        actions={<div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link to={`${backToList}/lich-su`} />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử</Button><Button variant="outline" render={<Link to={backToGroups} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại nhóm tiêu chí</Button></div>}
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Tóm tắt hồ sơ thẩm định">
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="bg-card px-4 py-3.5 sm:col-span-2 xl:col-span-1"><p className="text-xs font-medium text-muted-foreground">Địa phương</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{locality.fullName}</p></div>
          <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Bảng tiêu chí</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{table.name}</p></div>
          <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Địa phương đề xuất</p><p className="mt-1 text-base font-semibold tabular-nums text-foreground">{scoreSummary.proposed}<span className="text-sm font-normal text-success"> / {scoreSummary.maximum}</span></p></div>
          <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Chuyên viên chấm</p><p className="mt-1 text-base font-semibold tabular-nums text-foreground">{scoreSummary.specialist}<span className="text-sm font-normal text-success"> / {scoreSummary.maximum}</span></p></div>
          <div className="bg-card px-4 py-3.5"><p className="text-xs font-medium text-muted-foreground">Lãnh đạo chấm</p><p className="mt-1 text-base font-semibold tabular-nums text-primary">{scoreSummary.leader}<span className="text-sm font-normal text-success"> / {scoreSummary.maximum}</span></p></div>
        </div>
      </section>

      <StatusStepper state={record.state} hasRevisionRequest={hasRevisionRequest} />

      <section className="overflow-clip rounded-lg border border-border border-t-2 border-t-primary bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-5">
          <div><p className="flex items-center gap-2 text-base font-semibold text-foreground"><ShieldCheck className="size-4 text-primary" />Chi tiết tiêu chí con</p><p className="mt-1 text-sm text-muted-foreground">Đối chiếu minh chứng và kết quả chấm trước khi trình Hội đồng.</p></div>
          <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">{reviewRows.length} tiêu chí</span>
        </div>
        <div className="sticky top-[-16px] z-20 flex flex-col gap-3 border-b border-border bg-card/95 px-4 py-3 shadow-[0_6px_12px_-12px_rgba(31,27,26,0.22)] backdrop-blur sm:top-[-24px] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button variant="outline" disabled={!canProcess} onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="mr-1.5 size-4" />Thêm tiêu chí bổ sung</Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" disabled={!canProcess} className="border-warning text-warning-foreground hover:bg-warning/10" onClick={() => setRejectOpen(true)}><MessageSquareWarning className="mr-1.5 size-4" />Yêu cầu Chuyên viên bổ sung</Button>
            <Button disabled={!canProcess} onClick={() => { if (validateLeaderScores()) setApproveOpen(true); }}><Send className="mr-1.5 size-4" />Duyệt &amp; Trình Hội đồng</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1320px] table-fixed">
            <colgroup><col className="w-[23%]" /><col className="w-[12%]" /><col className="w-[15%]" /><col className="w-[15%]" /><col className="w-[18%]" /><col className="w-[17%]" /></colgroup>
            <TableHeader><TableRow className="sticky top-[-16px] z-10 bg-primary shadow-[0_6px_12px_-10px_rgba(31,27,26,0.35)] hover:bg-primary sm:top-[-24px]"><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Tiêu chí con</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Minh chứng</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Địa phương đề xuất</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Chuyên viên chấm</TableHead><TableHead className="border-r border-white/30 bg-primary px-4 py-3 text-primary-foreground">Lãnh đạo chấm</TableHead><TableHead className="bg-primary px-4 py-3 text-primary-foreground">Lý do sửa điểm</TableHead></TableRow></TableHeader>
            <TableBody>
              {reviewRows.map(({ criterion, entry }) => {
                const criteriaId = criterion?.id ?? entry?.criteriaId ?? '';
                const draft = drafts[criteriaId] ?? { score: '', bonusScore: '0', reason: '' };
                const files = filesFor(criteriaId);
                const specialist = entry?.stageScores?.SPECIALIST;
                const proposedScore = entry?.proposedScore ?? 0;
                const proposedBonus = entry?.proposedBonusScore ?? 0;
                const specialistScore = specialist?.score ?? proposedScore;
                const specialistBonus = specialist?.bonusScore ?? proposedBonus;
                const maxScore = criterion?.maxScore ?? entry?.supplementaryMaxScore ?? 0;
                const maxBonus = criterion?.bonusScore ?? 0;
                return <TableRow key={criteriaId} className="align-top hover:bg-muted/60"><TableCell className="border-r border-primary/15 px-4 py-5"><p className="font-semibold leading-5 text-foreground">{criterion?.name ?? entry?.criteriaName}</p><p className="mt-2 text-xs font-medium text-muted-foreground">{entry?.isSupplementary ? 'Tiêu chí bổ sung' : `Mã tiêu chí: ${criteriaId}`}</p></TableCell><TableCell className="border-r border-primary/15 px-4 py-5">{files.length ? <Button size="sm" variant="outline" onClick={() => entry && setViewing({ entry, criterion })}><FileText className="size-4" />Xem file <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">{files.length}</span></Button> : <span className="text-xs text-muted-foreground">Chưa có minh chứng</span>}</TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreView label="Điểm" score={proposedScore} maximum={maxScore} /><ScoreView label="Điểm thưởng" score={proposedBonus} maximum={maxBonus} /></div></TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><ScoreView label="Điểm" score={specialistScore} maximum={maxScore} /><ScoreView label="Điểm thưởng" score={specialistBonus} maximum={maxBonus} /></div></TableCell><TableCell className="border-r border-primary/15 px-4 py-5"><div className="grid grid-cols-2 gap-2"><LeaderScoreInput label="Điểm" maximum={maxScore} value={draft.score} disabled={!canProcess || !entry} onChange={(value) => updateDraft(criteriaId, { score: value })} /><LeaderScoreInput label="Điểm thưởng" maximum={maxBonus} value={draft.bonusScore} disabled={!canProcess || !entry} onChange={(value) => updateDraft(criteriaId, { bonusScore: value })} /></div></TableCell><TableCell className="px-4 py-5"><Textarea aria-label={`Lý do sửa điểm ${criterion?.name ?? entry?.criteriaName}`} rows={3} value={draft.reason} disabled={!canProcess || !entry} placeholder="Bắt buộc nếu điểm khác Chuyên viên" onChange={(event) => updateDraft(criteriaId, { reason: event.target.value })} />{draftErrors[criteriaId] && <p className="mt-1 text-xs font-medium text-destructive">{draftErrors[criteriaId]}</p>}</TableCell></TableRow>;
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <SupplementaryCriterionModal
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        showScore={false}
        onSave={({ file, ...value }) => {
          if (!user) return false;
          const saved = addSupplementaryCriterion({ tableId: table.id, localityId, ...value, fileName: file.name, fileSize: file.size, actorName: user.name, actorRole: user.role, stage: 'LEADER' });
          if (saved) toast.success('Đã thêm tiêu chí bổ sung.');
          return saved;
        }}
      />
      <RequestSpecialistDialog open={rejectOpen} onOpenChange={setRejectOpen} localityName={locality.name} onConfirm={({ reason, file }) => {
        if (!user) return;
        const requestReason = file ? `${reason}\n\nTập tin đính kèm: ${file.name}` : reason;
        reject(table.id, localityId, requestReason, user.name, user.role);
        toast.success('Đã gửi yêu cầu chỉnh sửa về Chuyên viên.');
        navigate(backToList);
      }} />
      <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Duyệt và trình Hội đồng" description="Xác nhận hoàn tất thẩm định và chuyển hồ sơ lên Hội đồng TĐKT? Sau bước này, Lãnh đạo ban không thể tiếp tục sửa điểm." confirmLabel="Duyệt & Trình Hội đồng" cancelLabel="Đóng" action="approve" state="CHO_DUYET_BAN" onConfirm={() => {
        if (!user || !saveLeaderScores()) return;
        approve(table.id, localityId, user.name, user.role);
        toast.success('Đã chuyển hồ sơ lên Hội đồng TĐKT.');
        navigate(backToList);
      }} />
    </div>
  );
}
