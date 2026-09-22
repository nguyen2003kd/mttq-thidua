import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FilePlus2, FileText, History, MessageSquareWarning, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { Button, ConfirmDialog, EmptyState, PageHeader, RejectDialog } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AuditTrailPopup,
  EvidenceModal,
  StatusStepper,
  SupplementaryCriterionModal,
} from '@/features/workflow/components';
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

export default function BanLeaderReviewDetailPage() {
  const { banId = 'ban1', tableId, localityId } = useParams<{ banId?: string; tableId?: string; localityId?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const evidence = useScoreStore((state) => state.evidence);
  const audits = useScoreStore((state) => state.audits);
  const reviewCriterion = useScoreStore((state) => state.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((state) => state.addSupplementaryCriterion);
  const approve = useScoreStore((state) => state.approve);
  const reject = useScoreStore((state) => state.reject);

  const [viewing, setViewing] = useState<SelectedEvidence | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, LeaderDraft>>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  const table = criteriaTables.find((item) => item.id === tableId);
  const locality = localities.find((item) => item.id === localityId);
  const record = table && localityId ? (scores[table.id]?.[localityId] ?? emptyRecord) : emptyRecord;
  const canProcess = record.state === 'CHO_DUYET_BAN';
  const backToList = `/thi-dua/duyet/lanh-dao-ban/${banId}`;

  const reviewRows = useMemo(() => {
    if (!table) return [];
    const regular = table.criteria.map((criterion) => ({ criterion, entry: record.entries.find((entry) => entry.criteriaId === criterion.id) }));
    const supplementary = record.entries.filter((entry) => entry.isSupplementary).map((entry) => ({ criterion: undefined, entry }));
    return [...regular, ...supplementary];
  }, [record.entries, table]);

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
    <div className="flex min-h-full flex-col gap-4 pb-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to={backToList} className="hover:text-primary">Danh sách địa phương</Link>
        <span>/</span>
        <span>{locality.name}</span>
        <span>/</span>
        <span className="font-medium text-foreground">{table.name}</span>
      </nav>

      <PageHeader
        title="Thẩm định chi tiết"
        description={`${locality.fullName} · ${table.name}`}
        actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setHistoryOpen(true)}><History className="mr-1.5 size-4" />Lịch sử</Button><Button variant="outline" render={<Link to={backToList} />} nativeButton={false}><ArrowLeft className="mr-1.5 size-4" />Quay lại</Button></div>}
      />

      <StatusStepper state={record.state} hasRevisionRequest={hasRevisionRequest} />

      <section className="overflow-clip rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <div><p className="text-sm font-semibold">Chi tiết tiêu chí</p><p className="mt-0.5 text-xs text-white/75">Đối chiếu điểm đề xuất, minh chứng và điểm thẩm định.</p></div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">Tổng điểm: {record.totalScore}</span>
        </div>
        <div className="sticky top-[-16px] z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-3 shadow-[0_6px_16px_-12px_rgba(31,27,26,0.28)] backdrop-blur sm:top-[-24px]">
          <Button variant="outline" disabled={!canProcess} onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="mr-1.5 size-4" />Thêm tiêu chí bổ sung</Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!canProcess} className="border-warning text-warning-foreground hover:bg-warning/10" onClick={() => setRejectOpen(true)}><MessageSquareWarning className="mr-1.5 size-4" />Yêu cầu chỉnh sửa</Button>
            <Button disabled={!canProcess} onClick={() => { if (validateLeaderScores()) setApproveOpen(true); }}><Send className="mr-1.5 size-4" />Gửi Hội đồng</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1260px]">
            <TableHeader><TableRow className="bg-primary hover:bg-primary"><TableHead className="min-w-[270px] text-primary-foreground">Tiêu chí con</TableHead><TableHead className="min-w-[180px] text-primary-foreground">Minh chứng</TableHead><TableHead className="min-w-[150px] text-right text-primary-foreground">Điểm ĐX địa phương</TableHead><TableHead className="min-w-[150px] text-right text-primary-foreground">Điểm CV chấm</TableHead><TableHead className="min-w-[220px] text-primary-foreground">Điểm Lãnh đạo chấm</TableHead><TableHead className="min-w-[280px] text-primary-foreground">Lý do Lãnh đạo sửa điểm</TableHead></TableRow></TableHeader>
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
                return <TableRow key={criteriaId} className="align-top hover:bg-surface-muted"><TableCell><p className="font-medium leading-5">{criterion?.name ?? entry?.criteriaName}</p><p className="mt-1 text-xs text-muted-foreground">{entry?.isSupplementary ? 'Tiêu chí bổ sung' : `Mã tiêu chí: ${criteriaId}`}</p></TableCell><TableCell>{files.length ? <Button size="sm" variant="outline" onClick={() => entry && setViewing({ entry, criterion })}><FileText className="mr-1.5 size-4" />{files.length} tệp</Button> : <span className="text-sm text-muted-foreground">Chưa có minh chứng</span>}</TableCell><TableCell className="text-right tabular-nums"><span className="font-semibold">{proposedScore}</span><span className="text-muted-foreground"> / {maxScore}</span>{proposedBonus > 0 && <p className="mt-1 text-xs text-muted-foreground">+{proposedBonus} / {maxBonus} thưởng</p>}</TableCell><TableCell className="text-right tabular-nums"><span className="font-semibold">{specialistScore}</span><span className="text-muted-foreground"> / {maxScore}</span>{specialistBonus > 0 && <p className="mt-1 text-xs text-muted-foreground">+{specialistBonus} / {maxBonus} thưởng</p>}</TableCell><TableCell><div className="grid grid-cols-2 gap-2"><div className="min-w-0"><p className="mb-1 text-xs font-medium text-muted-foreground">Điểm</p><div className="relative"><Input aria-label={`Điểm Lãnh đạo cho ${criterion?.name ?? entry?.criteriaName}`} className="pr-10 text-right tabular-nums" type="number" min={0} max={maxScore} step="0.25" value={draft.score} disabled={!canProcess || !entry} onChange={(event) => updateDraft(criteriaId, { score: event.target.value })} /><span className="pointer-events-none absolute inset-y-0 right-2 flex items-center border-l border-border pl-1.5 text-xs font-medium text-muted-foreground">/ {maxScore}</span></div></div><div className="min-w-0"><p className="mb-1 text-xs font-medium text-muted-foreground">Thưởng</p><div className="relative"><Input aria-label={`Điểm thưởng Lãnh đạo cho ${criterion?.name ?? entry?.criteriaName}`} className="pr-10 text-right tabular-nums" type="number" min={0} max={maxBonus} step="0.25" value={draft.bonusScore} disabled={!canProcess || !entry} onChange={(event) => updateDraft(criteriaId, { bonusScore: event.target.value })} /><span className="pointer-events-none absolute inset-y-0 right-2 flex items-center border-l border-border pl-1.5 text-xs font-medium text-muted-foreground">/ {maxBonus}</span></div></div></div></TableCell><TableCell><Textarea aria-label={`Lý do sửa điểm ${criterion?.name ?? entry?.criteriaName}`} rows={2} value={draft.reason} disabled={!canProcess || !entry} placeholder="Bắt buộc nếu điểm khác Chuyên viên" onChange={(event) => updateDraft(criteriaId, { reason: event.target.value })} />{draftErrors[criteriaId] && <p className="mt-1 text-xs font-medium text-destructive">{draftErrors[criteriaId]}</p>}</TableCell></TableRow>;
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <SupplementaryCriterionModal
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ file, ...value }) => {
          if (!user) return false;
          const saved = addSupplementaryCriterion({ tableId: table.id, localityId, ...value, fileName: file.name, fileSize: file.size, actorName: user.name, actorRole: user.role, stage: 'LEADER' });
          if (saved) toast.success('Đã thêm tiêu chí bổ sung.');
          return saved;
        }}
      />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} localityName={locality.name} state="CHO_DUYET_BAN" onConfirm={(reason) => {
        if (!user) return;
        reject(table.id, localityId, reason, user.name, user.role);
        toast.success('Đã gửi yêu cầu chỉnh sửa về Chuyên viên.');
        navigate(backToList);
      }} />
      <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Gửi Hội đồng" description="Xác nhận hoàn tất thẩm định và chuyển hồ sơ lên Hội đồng TĐKT?" confirmLabel="Gửi Hội đồng" cancelLabel="Đóng" action="approve" state="CHO_DUYET_BAN" onConfirm={() => {
        if (!user || !saveLeaderScores()) return;
        approve(table.id, localityId, user.name, user.role);
        toast.success('Đã chuyển hồ sơ lên Hội đồng TĐKT.');
        navigate(backToList);
      }} />
      <AuditTrailPopup open={historyOpen} onOpenChange={setHistoryOpen} title={locality.name} entries={audits.filter((item) => item.fieldName.endsWith(` - ${localityId}`))} />
    </div>
  );
}
