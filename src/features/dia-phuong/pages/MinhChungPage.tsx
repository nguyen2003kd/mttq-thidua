import { useMemo, useState } from 'react';
import { FileCheck2, MapPin, Save, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState, Button, ConfirmDialog, ScoreStateBadge } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { CriterionGrid, EvidenceModal, type EvidenceFormValue } from '@/features/workflow/components';
import type { CriteriaItem, Evidence, ScoreEntry } from '@/types/domain';

interface EditingRow {
  entry: ScoreEntry;
  criterion?: CriteriaItem;
}

export default function MinhChungPage() {
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const evidence = useScoreStore((state) => state.evidence);
  const lockedCriteria = useScoreStore((state) => state.lockedCriteria);
  const saveSelfAssessment = useScoreStore((state) => state.saveSelfAssessment);
  const uploadEvidence = useScoreStore((state) => state.uploadEvidence);
  const deleteEvidence = useScoreStore((state) => state.deleteEvidence);
  const submit = useScoreStore((state) => state.submit);

  const localityId = user?.localityId;
  const table = useMemo(
    () => criteriaTables.find((item) => localityId && assignments[item.id]?.includes(localityId)) ?? null,
    [criteriaTables, assignments, localityId],
  );
  const record = table && localityId ? (scores[table.id]?.[localityId] ?? emptyRecord) : emptyRecord;
  const [editing, setEditing] = useState<EditingRow | null>(null);
  const [viewing, setViewing] = useState<EditingRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  if (!localityId) {
    return <EmptyState title="Chưa gán địa phương" description="Tài khoản hiện tại chưa được gán địa phương nào." icon={<MapPin className="h-8 w-8" />} />;
  }
  if (!table) {
    return <EmptyState title="Chưa có nhóm tiêu chí" description="Địa phương chưa được áp dụng nhóm tiêu chí nào." icon={<FileCheck2 className="h-8 w-8" />} />;
  }

  const filesFor = (criteriaId?: string) => evidence.filter(
    (item) => item.localityId === localityId && item.criteriaId === criteriaId,
  );
  const lockedIds = lockedCriteria[table.id]?.[localityId] ?? [];
  const regularEntries = table.criteria.map((criterion) => record.entries.find((entry) => entry.criteriaId === criterion.id));
  const complete = regularEntries.every((entry) =>
    entry && entry.proposedScore !== undefined && entry.explanation?.trim() && filesFor(entry.criteriaId).length > 0,
  );
  const editable = record.state === 'DRAFT';

  const save = (value: EvidenceFormValue) => {
    if (!editing?.criterion || !user) return false;
    if (value.file) {
      uploadEvidence({
        criteriaId: editing.criterion.id,
        localityId,
        fileName: value.file.name,
        fileUrl: URL.createObjectURL(value.file),
        fileSize: value.file.size,
        description: value.explanation,
        kind: 'STANDARD',
      });
    }
    if (value.bonusFile) {
      uploadEvidence({
        criteriaId: editing.criterion.id,
        localityId,
        fileName: value.bonusFile.name,
        fileUrl: URL.createObjectURL(value.bonusFile),
        fileSize: value.bonusFile.size,
        description: value.explanation,
        kind: 'BONUS',
      });
    }
    const ok = saveSelfAssessment({
      tableId: table.id,
      localityId,
      criteriaId: editing.criterion.id,
      proposedScore: value.proposedScore,
      proposedBonusScore: value.proposedBonusScore,
      explanation: value.explanation,
      actorName: user.name,
    });
    if (ok) toast.success('Đã lưu bản nháp', { description: editing.criterion.name });
    return ok;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tự đánh giá & nộp bằng chứng"
        description="COL.01.02 · Nhập điểm đề xuất, diễn giải và file bằng chứng cho từng tiêu chí."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.success('Đã lưu toàn bộ bản nháp')} disabled={!editable}>
              <Save className="mr-1.5 h-4 w-4" /> Lưu
            </Button>
            <Button onClick={() => setSubmitOpen(true)} disabled={!editable} action="submit" state="DRAFT">
              <Send className="mr-1.5 h-4 w-4" /> Gửi yêu cầu
            </Button>
          </div>
        }
      />

      <Card className="border-primary/15 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-primary">Nhóm tiêu chí đang áp dụng</p>
            <h2 className="mt-1 text-lg font-bold">{table.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hạn nộp: {table.closeDate || 'Chưa quy định'} · Tổng điểm tối đa: {table.totalScore}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Điểm tự đánh giá</p>
              <p className="text-2xl font-bold tabular-nums">{record.totalScore}</p>
            </div>
            <ScoreStateBadge state={record.state} />
          </div>
        </CardContent>
      </Card>

      {record.revisionRequestedAt && record.state === 'DRAFT' && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
          <div>
            <p className="font-semibold">Hồ sơ được mở lại để chỉnh sửa</p>
            <p className="mt-1 text-sm text-muted-foreground">Các phản hồi được hiển thị tại cột “Diễn giải / phản hồi”. Cập nhật đủ nội dung rồi bấm “Gửi yêu cầu” để nộp lại.</p>
          </div>
        </div>
      )}

      <CriterionGrid
        criteria={table.criteria}
        record={record}
        evidence={evidence}
        localityId={localityId}
        lockedCriteriaIds={lockedIds}
        onEdit={editable ? (entry, criterion) => setEditing({ entry, criterion }) : undefined}
        onEvidence={(entry, criterion) => setViewing({ entry, criterion })}
      />

      <EvidenceModal
        open={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        criterion={editing?.criterion}
        entry={editing?.entry}
        evidence={filesFor(editing?.entry.criteriaId)}
        onSave={save}
        onDeleteEvidence={(id) => setDeleteTarget(evidence.find((item) => item.id === id) ?? null)}
      />
      <EvidenceModal
        open={!!viewing}
        onOpenChange={(open) => { if (!open) setViewing(null); }}
        criterion={viewing?.criterion}
        entry={viewing?.entry}
        evidence={filesFor(viewing?.entry.criteriaId)}
        readonly
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Xóa bằng chứng"
        description={`Xóa file “${deleteTarget?.fileName ?? ''}” khỏi bản tự đánh giá?`}
        confirmLabel="Tiếp tục"
        cancelLabel="Đóng"
        variant="destructive"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEvidence(deleteTarget.id);
          toast.success('Đã xóa bằng chứng');
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Gửi yêu cầu"
        description={complete ? 'Xác nhận nộp báo cáo tự đánh giá lên cấp chuyên viên?' : 'Chưa đủ điều kiện gửi: mỗi tiêu chí phải có điểm đề xuất, diễn giải và ít nhất một file bằng chứng.'}
        confirmLabel="Tiếp tục"
        cancelLabel="Đóng"
        onConfirm={() => {
          if (!complete || !user) {
            toast.error('Hồ sơ chưa đủ điều kiện gửi');
            return;
          }
          submit(table.id, localityId, user.name, user.role);
          toast.success('Đã gửi yêu cầu', { description: 'Báo cáo đã chuyển lên cấp chuyên viên.' });
        }}
      />
    </div>
  );
}
