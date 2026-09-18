import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, FileText, History, Megaphone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { DataTable, DetailDialog, FileUpload, FormDialog, PageHeader, ScoreStateBadge, TruncatedText } from '@/components/core';
import { Button } from '@/components/core';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore, type ScoreRecord } from '@/store/scoreStore';
import type { CriteriaTableAttachment, Locality } from '@/types/domain';
import { PublishResultModal, type PublishResultValue } from '@/features/workflow/components/PublishResultModal';
import { RequestSpecialistDialog } from '@/features/workflow/components/RequestSpecialistDialog';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface CommitteeLocalityRow {
  locality: Locality;
  records: Array<{ tableId: string; tableName: string; record: ScoreRecord }>;
  score: number;
  bonus: number;
  proposed: number;
  proposedBonus: number;
  state: 'CHO_DUYET_BTT' | 'DA_CONG_BO';
  summaryRecord: ScoreRecord;
}

const generalCommentSchema = z.object({
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung nhận xét chung.'),
  file: z.instanceof(File).nullable().refine(
    (file) => !file || file.size <= 20 * 1024 * 1024,
    'Tập tin đính kèm không được vượt quá 20MB.',
  ),
});

type GeneralCommentForm = z.infer<typeof generalCommentSchema>;

function GeneralCommitteeCommentDialog({
  open,
  onOpenChange,
  localityCount,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityCount: number;
  onSave: (value: GeneralCommentForm) => boolean;
}) {
  const form = useForm<GeneralCommentForm>({
    resolver: zodResolver(generalCommentSchema),
    defaultValues: { content: '', file: null },
  });
  const file = form.watch('file');

  useEffect(() => {
    if (open) form.reset({ content: '', file: null });
  }, [form, open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nhận xét chung toàn địa phương"
      description={`Nhận xét sẽ được gửi để toàn bộ ${localityCount} địa phương tham khảo và cải thiện phong trào thi đua.`}
      onSubmit={form.handleSubmit((value) => {
        if (onSave(value)) onOpenChange(false);
      })}
      submitLabel="Lưu và gửi"
      size="max-w-2xl sm:max-w-2xl"
    >
      <div className="space-y-1.5">
        <Label htmlFor="general-committee-comment">Nội dung nhận xét chung <span className="text-destructive">★</span></Label>
        <Textarea
          id="general-committee-comment"
          rows={6}
          placeholder="Nhập nhận xét chung về phong trào thi đua của toàn bộ các địa phương"
          {...form.register('content')}
        />
        {form.formState.errors.content && <p role="alert" className="text-xs font-medium text-destructive">{form.formState.errors.content.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><FileText className="size-4 text-primary" />File đính kèm</Label>
        <FileUpload
          value={file ? [file] : []}
          onChange={(files) => form.setValue('file', files[0] ?? null, { shouldValidate: true })}
          multiple={false}
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          maxSizeMb={20}
          error={form.formState.errors.file?.message}
        />
        <p className="text-xs text-muted-foreground">Không bắt buộc. Mỗi file tối đa 20MB.</p>
      </div>
    </FormDialog>
  );
}

/** COL.01.11 — Ban thường trực công bố theo địa phương, không sửa điểm. */
export default function CommitteeApprovalPage() {
  const user = useAuthStore((state) => state.user);
  const criteriaTables = useScoreStore((state) => state.criteriaTables);
  const localities = useScoreStore((state) => state.localities);
  const assignments = useScoreStore((state) => state.assignments);
  const scores = useScoreStore((state) => state.scores);
  const emptyRecord = useScoreStore((state) => state.emptyRecord);
  const publish = useScoreStore((state) => state.publish);
  const reject = useScoreStore((state) => state.reject);
  const generalCommitteeComments = useScoreStore((state) => state.generalCommitteeComments);
  const sendGeneralCommitteeComment = useScoreStore((state) => state.sendGeneralCommitteeComment);
  const [selected, setSelected] = useState<CommitteeLocalityRow | null>(null);
  const [viewing, setViewing] = useState<CommitteeLocalityRow | null>(null);
  const [publishing, setPublishing] = useState<CommitteeLocalityRow | null>(null);
  const [requesting, setRequesting] = useState<CommitteeLocalityRow | null>(null);
  const [generalCommentOpen, setGeneralCommentOpen] = useState(false);

  const rows = useMemo<CommitteeLocalityRow[]>(() => localities.flatMap((locality) => {
    const records = criteriaTables.flatMap((table) => {
      if (!(assignments[table.id] ?? []).includes(locality.id)) return [];
      const record = scores[table.id]?.[locality.id] ?? emptyRecord;
      return record.state === 'CHO_DUYET_BTT' || record.state === 'DA_CONG_BO' ? [{ tableId: table.id, tableName: table.name, record }] : [];
    });
    if (!records.length) return [];
    const totals = records.reduce((value, { record }) => record.entries.reduce((sum, entry) => ({ score: sum.score + (entry.stageScores?.LEADER?.score ?? entry.stageScores?.SPECIALIST?.score ?? entry.proposedScore ?? 0), bonus: sum.bonus + (entry.stageScores?.LEADER?.bonusScore ?? entry.stageScores?.SPECIALIST?.bonusScore ?? entry.proposedBonusScore ?? 0), proposed: sum.proposed + (entry.proposedScore ?? 0), proposedBonus: sum.proposedBonus + (entry.proposedBonusScore ?? 0) }), value), { score: 0, bonus: 0, proposed: 0, proposedBonus: 0 });
    const state = records.some(({ record }) => record.state === 'CHO_DUYET_BTT') ? 'CHO_DUYET_BTT' : 'DA_CONG_BO';
    return [{ locality, records, ...totals, state, summaryRecord: { ...records[0].record, totalScore: totals.score + totals.bonus } }];
  }), [assignments, criteriaTables, emptyRecord, localities, scores]);

  const columns = useMemo<ColumnDef<CommitteeLocalityRow>[]>(() => [
    { accessorFn: (row) => row.locality.fullName, header: 'Tên địa phương', cell: ({ row }) => <div><p className="font-semibold">{row.original.locality.name}</p><p className="text-xs text-muted-foreground">{row.original.locality.region}</p></div>, meta: { list: { width: 'minmax(240px,1.2fr)' } } },
    { accessorFn: (row) => row.score, header: 'Tổng điểm', cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.score}</span>, meta: { align: 'right', list: { width: 'minmax(130px,.7fr)' } } },
    { accessorFn: (row) => row.proposed, header: 'Tổng điểm đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposed}</span>, meta: { align: 'right', list: { width: 'minmax(150px,.8fr)' } } },
    { accessorFn: (row) => row.bonus, header: 'Tổng điểm thưởng', cell: ({ row }) => <span className="tabular-nums">{row.original.bonus}</span>, meta: { align: 'right', list: { width: 'minmax(145px,.75fr)' } } },
    { accessorFn: (row) => row.proposedBonus, header: 'Điểm thưởng đề xuất', cell: ({ row }) => <span className="tabular-nums">{row.original.proposedBonus}</span>, meta: { align: 'right', list: { width: 'minmax(160px,.85fr)' } } },
    { id: 'groups', accessorFn: (row) => row.records.length, header: 'Nhóm tiêu chí', cell: ({ row }) => <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{row.original.records.length} nhóm</span>, meta: { align: 'center', list: { width: 'minmax(130px,.7fr)' } } },
    { accessorFn: (row) => row.state, header: 'Trạng thái', cell: ({ row }) => <ScoreStateBadge state={row.original.state} />, meta: { align: 'center', list: { width: 'minmax(145px,.8fr)' } } },
  ], []);
  const canPublish = selected?.state === 'CHO_DUYET_BTT';
  const latestGeneralComment = generalCommitteeComments.at(-1);
  return <div className="space-y-6">
    <PageHeader title="Danh sách địa phương" description="Hồ sơ chờ Ban thường trực công bố kết quả. Điểm chỉ được xem, không chỉnh sửa." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setGeneralCommentOpen(true)}><Megaphone className="mr-1.5 size-4" />Nhận xét chung</Button><Button variant="outline" render={<Link to="/uy-ban/lich-su" />} nativeButton={false}><History className="mr-1.5 size-4" />Lịch sử công bố</Button></div>} />
    {latestGeneralComment && <section className="rounded-lg border border-primary/20 bg-primary/[0.035] px-4 py-3" aria-label="Nhận xét chung mới nhất">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Nhận xét chung đã gửi</p>
          <TruncatedText value={latestGeneralComment.content} maxLines={2} className="mt-1 max-w-4xl text-sm text-muted-foreground" />
          {latestGeneralComment.attachment && <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary"><FileText className="size-3.5" />{latestGeneralComment.attachment.fileName}</p>}
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">{latestGeneralComment.actorName} · {formatDateTime(latestGeneralComment.sentAt)}</p>
      </div>
    </section>}
    <DataTable data={rows} columns={columns} pageSize={10} variant="list" searchable searchPlaceholder="Tìm theo tên địa phương..." getRowId={(row) => row.locality.id} selectedRowId={selected?.locality.id} onRowClick={setSelected} toolbar={<div className="flex flex-wrap gap-2"><Button variant="info" disabled={!selected} disabledReason="Chọn một địa phương để xem chi tiết." onClick={() => setViewing(selected)}><Eye className="mr-1.5 size-4" />Xem chi tiết</Button><Button variant="outline" disabled={!canPublish} disabledReason={!selected ? 'Chọn một địa phương để yêu cầu Chuyên viên bổ sung.' : 'Hồ sơ đã công bố, không thể yêu cầu bổ sung.'} className="border-[#D9773D]/70 text-[#9A481D] hover:bg-[#D9773D]/10" onClick={() => selected && setRequesting(selected)}>Yêu cầu bổ sung</Button><Button disabled={!canPublish} disabledReason={!selected ? 'Chọn một địa phương để công bố.' : 'Hồ sơ này đã được công bố.'} className="bg-accent text-foreground hover:bg-accent/85" onClick={() => selected && setPublishing(selected)}><Send className="mr-1.5 size-4" />Công bố kết quả</Button></div>} emptyState={{ title: 'Không có hồ sơ chờ công bố', description: 'Hiện chưa có hồ sơ nào được Hội đồng chuyển đến Ban thường trực.', icon: <Eye className="size-8" /> }} stickyTitle="Danh sách địa phương" stickyDescription="Hồ sơ chờ công bố kết quả" />
    <DetailDialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} title="Tổng hợp kết quả địa phương" subtitle={viewing?.locality.fullName} items={[{ label: 'Tổng điểm chính thức', value: viewing ? viewing.score + viewing.bonus : 0 }, { label: 'Tổng điểm đề xuất', value: viewing ? viewing.proposed + viewing.proposedBonus : 0 }, { label: 'Nhóm tiêu chí', value: viewing?.records.map((item) => item.tableName).join(', ') || '—' }, { label: 'Trạng thái', value: viewing ? <ScoreStateBadge state={viewing.state} /> : '—' }]} />
    <PublishResultModal open={!!publishing} onOpenChange={(open) => { if (!open) setPublishing(null); }} locality={publishing?.locality} record={publishing?.summaryRecord} onPublish={(value: PublishResultValue) => { if (!user || !publishing) return; publishing.records.filter((item) => item.record.state === 'CHO_DUYET_BTT').forEach((item) => publish(item.tableId, publishing.locality.id, user.name, user.role, value.attachments, value.comment)); toast.success('Đã công bố kết quả', { description: `${publishing.locality.name} có thể xem kết quả chính thức.` }); setPublishing(null); }} />
    <RequestSpecialistDialog open={!!requesting} onOpenChange={(open) => { if (!open) setRequesting(null); }} localityName={requesting?.locality.name} onConfirm={({ reason, file }) => { if (!user || !requesting) return; const auditReason = file ? `${reason}\n\nTập tin đính kèm: ${file.name}` : reason; requesting.records.filter((item) => item.record.state === 'CHO_DUYET_BTT').forEach((item) => reject(item.tableId, requesting.locality.id, auditReason, user.name, user.role)); toast.success('Đã gửi yêu cầu đến Chuyên viên.'); setRequesting(null); }} />
    <GeneralCommitteeCommentDialog
      open={generalCommentOpen}
      onOpenChange={setGeneralCommentOpen}
      localityCount={localities.length}
      onSave={({ content, file }) => {
        if (!user) return false;
        const attachment: CriteriaTableAttachment | undefined = file ? { id: `general-comment-${Date.now()}`, fileName: file.name, fileSize: file.size } : undefined;
        const saved = sendGeneralCommitteeComment({ content, attachment, actorName: user.name, actorRole: user.role });
        if (saved) toast.success('Đã lưu và gửi nhận xét chung', { description: `Đã ghi nhận gửi đến ${localities.length} địa phương.` });
        return saved;
      }}
    />
  </div>;
}
