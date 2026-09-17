import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FilePlus2, History, MessageSquareWarning, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { Button, ConfirmDialog, EmptyState, PageHeader, RejectDialog, ScoreStateBadge } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import {
  AuditTrailPopup,
  CriterionGrid,
  EvidenceModal,
  ReviewScoreModal,
  SupplementaryCriterionModal,
} from '@/features/workflow/components';
import type { CriteriaItem, ScoreEntry } from '@/types/domain';

interface SelectedRow { entry: ScoreEntry; criterion?: CriteriaItem }

export default function ScoreByLocalityPage() {
  const { id: localityId } = useParams<{ id?: string }>();
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const evidence = useScoreStore((state) => state.evidence);
  const audits = useScoreStore((state) => state.audits);
  const reviewCriterion = useScoreStore((state) => state.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((state) => state.addSupplementaryCriterion);
  const requestRevision = useScoreStore((state) => state.requestRevision);
  const submit = useScoreStore((state) => state.submit);
  const [editing, setEditing] = useState<SelectedRow | null>(null);
  const [viewing, setViewing] = useState<SelectedRow | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<SelectedRow | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const locality = localities.find((item) => item.id === localityId);
  const table = criteriaTables.find((item) => localityId && assignments[item.id]?.includes(localityId));
  const record = table && localityId ? (scores[table.id]?.[localityId] ?? emptyRecord) : emptyRecord;

  if (!locality || !table || !localityId) {
    return <EmptyState title="Không tìm thấy hồ sơ" description="Địa phương hoặc nhóm tiêu chí không hợp lệ." />;
  }

  const canProcess = record.state === 'CHO_CHUYEN_VIEN';
  const filesFor = (criteriaId?: string) => evidence.filter((item) => item.localityId === localityId && item.criteriaId === criteriaId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chấm điểm · ${locality.name}`}
        description={`COL.01.04 · ${table.name}`}
        actions={<div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link to={`/thi-dua/cham-diem/theo-tieu-chi/${table.id}`} />} nativeButton={false}><ArrowLeft className="mr-1.5 h-4 w-4" />Quay lại</Button><Button variant="outline" onClick={() => setHistoryOpen(true)}><History className="mr-1.5 h-4 w-4" />Lịch sử</Button></div>}
      />

      <Card className="border-primary/15 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold text-primary">Hồ sơ địa phương</p><h2 className="mt-1 text-lg font-bold">{locality.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">{record.entries.length} bản ghi · {evidence.filter((item) => item.localityId === localityId).length} file minh chứng</p></div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-muted-foreground">Tổng điểm hiện tại</p><p className="text-2xl font-bold tabular-nums">{record.totalScore}</p></div><ScoreStateBadge state={record.state} /></div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={!canProcess} onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="mr-1.5 h-4 w-4" />Thêm mới tiêu chí bổ sung</Button>
        <Button variant="outline" disabled={!canProcess} className="text-warning-foreground" onClick={() => setRevisionTarget({ entry: record.entries[0], criterion: table.criteria[0] })}><MessageSquareWarning className="mr-1.5 h-4 w-4" />Yêu cầu chỉnh sửa</Button>
        <Button disabled={!canProcess} action="submit" state="CHO_CHUYEN_VIEN" onClick={() => setForwardOpen(true)}><Send className="mr-1.5 h-4 w-4" />Gửi yêu cầu</Button>
      </div>

      <CriterionGrid criteria={table.criteria} record={record} evidence={evidence} localityId={localityId} mode="review" onEdit={canProcess ? (entry, criterion) => setEditing({ entry, criterion }) : undefined} onEvidence={(entry, criterion) => setViewing({ entry, criterion })} />

      <ReviewScoreModal
        open={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        entry={editing?.entry}
        criterion={editing?.criterion}
        onSave={(value) => {
          if (!editing || !user) return false;
          const ok = reviewCriterion({ tableId: table.id, localityId, criteriaId: editing.entry.criteriaId, ...value, stage: 'SPECIALIST', actorName: user.name, actorRole: user.role });
          if (ok) toast.success('Đã lưu điểm chuyên viên');
          return ok;
        }}
      />
      <EvidenceModal open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} criterion={viewing?.criterion} entry={viewing?.entry} evidence={filesFor(viewing?.entry.criteriaId)} readonly />
      <SupplementaryCriterionModal
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ file, ...value }) => {
          if (!user) return false;
          const ok = addSupplementaryCriterion({ tableId: table.id, localityId, ...value, fileName: file.name, fileSize: file.size, stage: 'SPECIALIST', actorName: user.name, actorRole: user.role });
          if (ok) toast.success('Đã thêm tiêu chí bổ sung');
          return ok;
        }}
      />
      <RejectDialog
        open={!!revisionTarget}
        onOpenChange={(open) => { if (!open) setRevisionTarget(null); }}
        localityName={locality.name}
        state="CHO_CHUYEN_VIEN"
        onConfirm={(reason) => {
          if (!user) return;
          if (requestRevision(table.id, localityId, revisionTarget?.entry.criteriaId ?? null, reason, user.name, user.role)) toast.success('Đã gửi yêu cầu chỉnh sửa về địa phương');
          setRevisionTarget(null);
        }}
      />
      <ConfirmDialog
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        title="Gửi yêu cầu"
        description="Xác nhận hoàn tất chấm điểm và chuyển hồ sơ lên Lãnh đạo Ban?"
        confirmLabel="Tiếp tục"
        cancelLabel="Đóng"
        action="submit"
        state="CHO_CHUYEN_VIEN"
        onConfirm={() => {
          if (!user) return;
          submit(table.id, localityId, user.name, user.role);
          toast.success('Đã chuyển hồ sơ lên Lãnh đạo Ban');
        }}
      />
      <AuditTrailPopup open={historyOpen} onOpenChange={setHistoryOpen} title={locality.name} entries={audits.filter((item) => item.fieldName.endsWith(` - ${localityId}`))} />
    </div>
  );
}
