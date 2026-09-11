import { useMemo, useState, type ComponentType } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import {
  PageHeader,
  DataTable,
  EmptyState,
  ConfirmDialog,
  ScoreStateBadge,
  RejectDialog,
  AuditTimelineDialog,
} from '@/components/core';
import { Button } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { X, History, Building2, ClipboardCheck, Landmark, Send, Trophy, Eye, FilePlus2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CriteriaItem, CriteriaTable, Locality, ScoreEntry, ScoringStage } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';
import type { ScoreState } from '@/types/rbac';
import type { Action } from '@/lib/rbac';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CriterionGrid, EvidenceModal, ReviewScoreModal, SupplementaryCriterionModal } from '@/features/workflow/components';

interface ApprovalRow {
  table: CriteriaTable;
  locality: Locality;
  record: ScoreRecord;
}

interface ApprovalPageConfig {
  targetState: ScoreState;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: ComponentType<{ className?: string }>;
  approveLabel: string;
  approveAction: Action;
  approveIcon: ComponentType<{ className?: string }>;
  approveClassName?: string;
  approveSuccessMessage: (localityName: string) => string;
  rejectSuccessMessage: (localityName: string) => string;
  requireChair?: boolean;
  useConfirmDialog?: boolean;
  confirmKeyword?: string;
  confirmDescription?: string;
}

const REVIEW_STAGES = [
  { state: 'DRAFT', label: 'Địa phương nộp', icon: Building2 },
  { state: 'CHO_CHUYEN_VIEN', label: 'Chuyên viên', icon: ClipboardCheck },
  { state: 'CHO_DUYET_BAN', label: 'Lãnh đạo ban', icon: ClipboardCheck },
  { state: 'CHO_DUYET_HOI_DONG', label: 'Hội đồng TĐKT', icon: Landmark },
  { state: 'CHO_DUYET_BTT', label: 'Ban thường trực', icon: Send },
  { state: 'DA_CONG_BO', label: 'Công bố kết quả', icon: Trophy },
] as const;

export function ApprovalPage(config: ApprovalPageConfig) {
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const scores = useScoreStore((s) => s.scores);
  const emptyRecord = useScoreStore((s) => s.emptyRecord);
  const audits = useScoreStore((s) => s.audits);
  const approve = useScoreStore((s) => s.approve);
  const publish = useScoreStore((s) => s.publish);
  const reject = useScoreStore((s) => s.reject);
  const evidence = useScoreStore((s) => s.evidence);
  const reviewCriterion = useScoreStore((s) => s.reviewCriterion);
  const addSupplementaryCriterion = useScoreStore((s) => s.addSupplementaryCriterion);

  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [diffRow, setDiffRow] = useState<ApprovalRow | null>(null);
  const [confirmRow, setConfirmRow] = useState<ApprovalRow | null>(null);
  const [detailRow, setDetailRow] = useState<ApprovalRow | null>(null);
  const [editing, setEditing] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [viewing, setViewing] = useState<{ entry: ScoreEntry; criterion?: CriteriaItem } | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);

  const scoringStage: Exclude<ScoringStage, 'LOCAL' | 'SPECIALIST'> =
    config.targetState === 'CHO_DUYET_BAN'
      ? 'LEADER'
      : config.targetState === 'CHO_DUYET_HOI_DONG'
        ? 'COUNCIL'
        : 'COMMITTEE';

  const canApprove = !config.requireChair || user?.role === 'COUNCIL';

  const rows = useMemo(() => {
    const list: ApprovalRow[] = [];
    criteriaTables.forEach((table) => {
      const assignedIds = assignments[table.id] ?? [];
      assignedIds.forEach((localityId) => {
        const locality = localities.find((l) => l.id === localityId);
        if (!locality) return;
        const record = scores[table.id]?.[localityId] ?? emptyRecord;
        if (record.state === config.targetState) {
          list.push({ table, locality, record });
        }
      });
    });
    return list;
  }, [criteriaTables, localities, assignments, scores, emptyRecord, config.targetState]);

  const handleApprove = (row: ApprovalRow) => {
    if (!user) return;
    if (config.approveAction === 'publish') {
      publish(row.table.id, row.locality.id, user.name, user.role);
    } else {
      approve(row.table.id, row.locality.id, user.name, user.role);
    }
    toast.success('Đã duyệt', { description: config.approveSuccessMessage(row.locality.name) });
  };

  const handleReject = (reason: string) => {
    if (!user || !rejectRow) return;
    reject(rejectRow.table.id, rejectRow.locality.id, reason, user.name, user.role);
    toast.success('Đã trả lại', { description: config.rejectSuccessMessage(rejectRow.locality.name) });
    setRejectRow(null);
  };

  const columns = useMemo<ColumnDef<ApprovalRow>[]>(
    () => [
      {
        accessorFn: (row) => row.locality.name,
        header: 'Địa phương',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.locality.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.locality.region}</p>
          </div>
        ),
      },
      { accessorFn: (row) => row.table.name, header: 'Bảng tiêu chí' },
      { accessorFn: (row) => row.record.totalScore, header: 'Tổng điểm', meta: { align: 'center' } },
      {
        accessorFn: (row) => row.record.state,
        header: 'Trạng thái',
        cell: ({ row }) => <ScoreStateBadge state={row.original.record.state} />,
        meta: { align: 'center' },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDetailRow(row.original)}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Xem chi tiết
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDiffRow(row.original)}>
              <History className="h-3.5 w-3.5 mr-1.5" />
              Lịch sử
            </Button>
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                className={config.approveClassName ?? 'text-success hover:bg-success/10'}
                action={config.approveAction}
                state={config.targetState}
                onClick={() =>
                  config.useConfirmDialog
                    ? setConfirmRow(row.original)
                    : handleApprove(row.original)
                }
              >
                <config.approveIcon className="h-3.5 w-3.5 mr-1.5" />
                {config.approveLabel}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              action="reject"
              state={config.targetState}
              onClick={() => setRejectRow(row.original)}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Trả lại
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canApprove],
  );

  const EmptyIcon = config.emptyIcon;
  const activeStage = REVIEW_STAGES.findIndex((stage) => stage.state === config.targetState);

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description} />

      <Card className="overflow-hidden border-primary/15 bg-primary/[0.03]">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold text-primary">Trung tâm xét duyệt</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tabular-nums">{rows.length}</p>
              <p className="pb-1 text-sm text-muted-foreground">hồ sơ đang chờ bạn xử lý</p>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Kiểm tra điểm, minh chứng và lịch sử thay đổi trước khi chuyển hồ sơ sang chặng tiếp theo.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Chặng đang xử lý</p>
              <p className="text-sm font-semibold">{REVIEW_STAGES[activeStage]?.label}</p>
            </div>
          </div>
        </CardContent>
        <div className="border-t bg-background/55 px-5 py-4">
          <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            {REVIEW_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const complete = index < activeStage;
              const current = index === activeStage;
              return (
                <div key={stage.state} className="relative flex min-w-0 items-center gap-2">
                  {index > 0 && <span className="absolute -left-1/2 top-4 hidden h-px w-5 bg-border sm:block" />}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      current || complete
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className={`text-xs leading-tight ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title={config.emptyTitle}
          description={config.emptyDescription}
          icon={<EmptyIcon className="h-8 w-8" />}
        />
      ) : (
        <DataTable data={rows} columns={columns} pageSize={10} className="overflow-auto" searchable searchPlaceholder="Tìm kiếm địa phương hoặc nhóm tiêu chí..." />
      )}

      {config.useConfirmDialog && (
        <ConfirmDialog
          open={!!confirmRow}
          onOpenChange={(v) => setConfirmRow(v ? confirmRow : null)}
          title={config.approveLabel}
          description={config.confirmDescription ?? ''}
          confirmLabel={config.approveLabel}
          variant="destructive"
          action={config.approveAction}
          state={config.targetState}
          confirmKeyword={config.confirmKeyword}
          confirmKeywordHint={config.confirmKeyword ? `Nhập "${config.confirmKeyword}" để xác nhận` : undefined}
          onConfirm={() => {
            if (confirmRow) handleApprove(confirmRow);
            setConfirmRow(null);
          }}
        />
      )}

      <RejectDialog
        open={!!rejectRow}
        onOpenChange={(v) => { if (!v) setRejectRow(null); }}
        localityName={rejectRow?.locality.name}
        state={config.targetState}
        onConfirm={handleReject}
      />

      <AuditTimelineDialog
        open={!!diffRow}
        onOpenChange={(v) => { if (!v) setDiffRow(null); }}
        localityName={diffRow?.locality.name}
        entries={
          diffRow
            ? audits.filter((a) => a.fieldName.endsWith(` - ${diffRow.locality.id}`))
            : []
        }
      />

      <Dialog open={!!detailRow} onOpenChange={(open) => { if (!open) setDetailRow(null); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Thẩm định chi tiết — {detailRow?.locality.name}</DialogTitle>
          </DialogHeader>
          {detailRow && (() => {
            const liveRecord = scores[detailRow.table.id]?.[detailRow.locality.id] ?? detailRow.record;
            return (
              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                  <div><p className="font-semibold">{detailRow.table.name}</p><p className="text-xs text-muted-foreground">Điểm hiện tại: {liveRecord.totalScore}</p></div>
                  <Button variant="outline" onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="mr-1.5 h-4 w-4" />Thêm tiêu chí bổ sung</Button>
                </div>
                <CriterionGrid
                  criteria={detailRow.table.criteria}
                  record={liveRecord}
                  evidence={evidence}
                  localityId={detailRow.locality.id}
                  mode="review"
                  onEdit={(entry, criterion) => setEditing({ entry, criterion })}
                  onEvidence={(entry, criterion) => setViewing({ entry, criterion })}
                />
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setDetailRow(null)}>Đóng</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ReviewScoreModal
        open={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        entry={editing?.entry}
        criterion={editing?.criterion}
        onSave={(value) => {
          if (!detailRow || !editing || !user) return false;
          const ok = reviewCriterion({ tableId: detailRow.table.id, localityId: detailRow.locality.id, criteriaId: editing.entry.criteriaId, ...value, stage: scoringStage, actorName: user.name, actorRole: user.role });
          if (ok) toast.success('Đã lưu điểm thẩm định');
          return ok;
        }}
      />
      <EvidenceModal
        open={!!viewing}
        onOpenChange={(open) => { if (!open) setViewing(null); }}
        entry={viewing?.entry}
        criterion={viewing?.criterion}
        evidence={detailRow && viewing ? evidence.filter((item) => item.localityId === detailRow.locality.id && item.criteriaId === viewing.entry.criteriaId) : []}
        readonly
      />
      <SupplementaryCriterionModal
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ file, ...value }) => {
          if (!detailRow || !user) return false;
          const ok = addSupplementaryCriterion({ tableId: detailRow.table.id, localityId: detailRow.locality.id, ...value, fileName: file.name, fileSize: file.size, actorName: user.name, actorRole: user.role, stage: scoringStage });
          if (ok) toast.success('Đã thêm tiêu chí bổ sung');
          return ok;
        }}
      />
    </div>
  );
}
