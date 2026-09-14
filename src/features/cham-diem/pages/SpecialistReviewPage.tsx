import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  MapPin,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, EmptyState, FileUpload, FormDialog, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ForwardSubmissionDialog } from '@/features/workflow/components';
import { specialistApi, type SubmissionApi } from '@/features/cham-diem/api/specialistApi';
import { downloadFile, getFilesApiError } from '@/features/files/api/filesApi';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  fileId: string;
}

interface SpecialistCriteriaItem {
  id: string;
  code: string;
  title: string;
  evidenceFiles: EvidenceFile[];
  proposedScore: number;
  proposedBonusScore: number;
  maxProposedScore: number;
  maxProposedBonusScore: number;
  explanation: string;
  officialScore: number | null;
  officialBonusScore: number | null;
  scoreReason: string;
  isAddedBySpecialist?: boolean;
}

interface SpecialistCriteriaGroup {
  id: string;
  code: string;
  groupName: string;
  description: string;
  totalProposedScore: number;
  totalProposedBonusScore: number;
  status: 'CHUA_NOP' | 'CHO_CHAM' | 'DA_CHAM' | 'YEU_CAU_SUA';
  hasModificationRequest: boolean;
  modificationNote?: string;
  items: SpecialistCriteriaItem[];
}

interface LocalityRow {
  localityId: string;
  localityName: string;
  completionRate: string;
  overallStatus: 'CHO_DUYET' | 'YEU_CAU_SUA' | 'DA_DUYET';
  hasNewSubmissions: boolean;
  hasModificationRequest: boolean;
  submissionIds: string[];
}

const STAGE_TO_STATUS: Record<string, LocalityRow['overallStatus']> = {
  LocalSubmitted: 'CHO_DUYET',
  SpecialistApproved: 'DA_DUYET',
  LeaderApproved: 'DA_DUYET',
  CouncilApproved: 'DA_DUYET',
  CommitteeFinalized: 'DA_DUYET',
  RequiresRevision: 'YEU_CAU_SUA',
};

const STAGE_TO_GROUP_STATUS: Record<string, SpecialistCriteriaGroup['status']> = {
  Draft: 'CHUA_NOP',
  LocalSubmitted: 'CHO_CHAM',
  SpecialistApproved: 'DA_CHAM',
  LeaderApproved: 'DA_CHAM',
  CouncilApproved: 'DA_CHAM',
  CommitteeFinalized: 'DA_CHAM',
  RequiresRevision: 'YEU_CAU_SUA',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const supplementarySchema = z.object({
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do bổ sung.'),
  score: z.number({ invalid_type_error: 'Vui lòng nhập điểm chấm.' }).min(0, 'Điểm chấm không được nhỏ hơn 0.'),
  file: z.instanceof(File).nullable().refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File đính kèm không được vượt quá 20MB.'),
});

type SupplementaryForm = z.infer<typeof supplementarySchema>;

function createScoreSchema(item: SpecialistCriteriaItem) {
  return z.object({
    score: z.coerce
      .number({ invalid_type_error: 'Vui lòng nhập điểm chấm.' })
      .min(0, 'Điểm chấm không được nhỏ hơn 0.')
      .max(item.maxProposedScore, `Điểm chấm không được vượt quá ${item.maxProposedScore}.`),
    bonusScore: z.coerce
      .number({ invalid_type_error: 'Vui lòng nhập điểm thưởng.' })
      .min(0, 'Điểm thưởng không được nhỏ hơn 0.')
      .max(item.maxProposedBonusScore, `Điểm thưởng không được vượt quá ${item.maxProposedBonusScore}.`),
    scoreReason: z.string().trim(),
  }).superRefine((value, context) => {
    const scoreChanged = value.score !== item.proposedScore || value.bonusScore !== item.proposedBonusScore;
    if (scoreChanged && !value.scoreReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập lý do khi điểm chấm khác điểm địa phương đề xuất.',
        path: ['scoreReason'],
      });
    }
  });
}

type ScoreForm = {
  score: number;
  bonusScore: number;
  scoreReason: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function SupplementaryDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: SupplementaryForm) => void;
}) {
  const form = useForm<SupplementaryForm>({
    resolver: zodResolver(supplementarySchema),
    defaultValues: { reason: '', score: 0, file: null },
  });
  const selectedFile = form.watch('file');

  useEffect(() => {
    if (open) form.reset({ reason: '', score: 0, file: null });
  }, [form, open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm tiêu chí bổ sung"
      description="Bổ sung tiêu chí phát sinh trong quá trình thẩm định hồ sơ."
      onSubmit={form.handleSubmit((value) => {
        onSave(value);
        onOpenChange(false);
      })}
      submitLabel="Lưu"
      cancelLabel="Đóng"
    >
      <div className="space-y-1.5">
        <Label htmlFor="supplementary-reason">Lý do bổ sung <span className="text-destructive">★</span></Label>
        <Textarea id="supplementary-reason" rows={3} {...form.register('reason')} placeholder="Nhập lý do cần bổ sung tiêu chí" />
        {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="supplementary-score">Điểm chấm <span className="text-destructive">★</span></Label>
        <Input id="supplementary-score" type="number" min={0} step="0.25" className="text-right" {...form.register('score', { valueAsNumber: true })} />
        {form.formState.errors.score && <p className="text-xs text-destructive">{form.formState.errors.score.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>File đính kèm</Label>
        <FileUpload
          value={selectedFile ? [selectedFile] : []}
          onChange={(files) => form.setValue('file', files[0] ?? null, { shouldValidate: true })}
          multiple={false}
          maxSizeMb={20}
          error={form.formState.errors.file?.message}
        />
      </div>
    </FormDialog>
  );
}

function ScoreDialog({
  item,
  open,
  onOpenChange,
  onSave,
}: {
  item: SpecialistCriteriaItem | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ScoreForm) => void;
}) {
  const schema = useMemo(() => createScoreSchema(item ?? {
    id: '', code: '', title: '', evidenceFiles: [], proposedScore: 0, proposedBonusScore: 0,
    maxProposedScore: 0, maxProposedBonusScore: 0, explanation: '', officialScore: null,
    officialBonusScore: null, scoreReason: '',
  }), [item]);
  const form = useForm<ScoreForm>({
    resolver: zodResolver(schema),
    defaultValues: { score: 0, bonusScore: 0, scoreReason: '' },
  });

  useEffect(() => {
    if (!open || !item) return;
    form.reset({
      score: item.officialScore ?? item.proposedScore,
      bonusScore: item.officialBonusScore ?? item.proposedBonusScore,
      scoreReason: item.scoreReason,
    });
  }, [form, item, open]);

  if (!item) return null;

  const isEditing = item.officialScore !== null || item.officialBonusScore !== null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Sửa điểm chấm' : 'Chấm điểm'}
      description={item.title}
      onSubmit={form.handleSubmit((values) => {
        onSave(values);
        onOpenChange(false);
      })}
      submitLabel="Lưu điểm"
      cancelLabel="Đóng"
    >
      <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
        <p className="text-xs font-medium text-muted-foreground">Địa phương đề xuất</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div><span className="text-xs text-muted-foreground">Điểm</span><p className="mt-0.5 font-semibold tabular-nums">{item.proposedScore} <span className="font-normal text-muted-foreground">/ {item.maxProposedScore}</span></p></div>
          <div><span className="text-xs text-muted-foreground">Điểm thưởng</span><p className="mt-0.5 font-semibold tabular-nums">{item.proposedBonusScore} <span className="font-normal text-muted-foreground">/ {item.maxProposedBonusScore}</span></p></div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="specialist-score">Điểm <span className="text-destructive">★</span></Label>
          <Input id="specialist-score" type="number" min={0} max={item.maxProposedScore} step="0.25" className="text-right tabular-nums" {...form.register('score', { valueAsNumber: true })} />
          {form.formState.errors.score && <p className="text-xs text-destructive">{form.formState.errors.score.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="specialist-bonus-score">Điểm thưởng <span className="text-destructive">★</span></Label>
          <Input id="specialist-bonus-score" type="number" min={0} max={item.maxProposedBonusScore} step="0.25" className="text-right tabular-nums" {...form.register('bonusScore', { valueAsNumber: true })} />
          {form.formState.errors.bonusScore && <p className="text-xs text-destructive">{form.formState.errors.bonusScore.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="specialist-score-reason">Lý do sửa điểm <span className="text-muted-foreground">(bắt buộc nếu khác điểm đề xuất)</span></Label>
        <Textarea id="specialist-score-reason" rows={3} className="resize-y" placeholder="Ví dụ: Đối chiếu minh chứng thực tế, điều chỉnh điểm phù hợp." {...form.register('scoreReason')} />
        {form.formState.errors.scoreReason && <p className="text-xs text-destructive">{form.formState.errors.scoreReason.message}</p>}
      </div>
    </FormDialog>
  );
}

const revisionSchema = z.object({
  reason: z.string().trim().min(1, 'Vui lòng nhập nội dung yêu cầu chỉnh sửa.'),
});

function RevisionDialog({
  open,
  onOpenChange,
  localityName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName: string;
  onSubmit: (reason: string) => void;
}) {
  const form = useForm<z.infer<typeof revisionSchema>>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) form.reset({ reason: '' });
  }, [form, open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yêu cầu địa phương chỉnh sửa"
      description={`Mở lại quyền sửa hồ sơ cho ${localityName}.`}
      onSubmit={form.handleSubmit(({ reason }) => {
        onSubmit(reason);
        onOpenChange(false);
      })}
      submitLabel="Gửi yêu cầu"
      cancelLabel="Đóng"
    >
      <div className="space-y-1.5">
        <Label htmlFor="revision-reason">Nội dung yêu cầu chỉnh sửa <span className="text-destructive">★</span></Label>
        <Textarea id="revision-reason" rows={4} {...form.register('reason')} placeholder="Ví dụ: Minh chứng chưa rõ nét, đề nghị bổ sung ảnh chụp thực tế" />
        {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
      </div>
    </FormDialog>
  );
}

function OverallStatusBadge({ status }: { status: LocalityRow['overallStatus'] }) {
  if (status === 'DA_DUYET') return <Badge variant="success">Đã duyệt</Badge>;
  if (status === 'YEU_CAU_SUA') return <Badge variant="warning">Yêu cầu chỉnh sửa</Badge>;
  return <Badge className="border border-accent/40 bg-accent/20 text-foreground">Đang chờ duyệt</Badge>;
}

function GroupStatusBadge({ status }: { status: SpecialistCriteriaGroup['status'] }) {
  if (status === 'DA_CHAM') return <Badge variant="success"><CheckCircle2 className="size-3" />Đã chấm</Badge>;
  if (status === 'CHO_CHAM') return <Badge className="border border-accent/40 bg-accent/20 text-foreground">Chờ chấm</Badge>;
  if (status === 'YEU_CAU_SUA') return <Badge variant="warning">Yêu cầu chỉnh sửa</Badge>;
  return <Badge variant="secondary">Chưa nộp</Badge>;
}

function TableSectionHeader({ title, countLabel, actions }: { title: string; countLabel: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-5">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{countLabel}</span>
      </div>
      {actions}
    </div>
  );
}

function EvidenceList({ files }: { files: EvidenceFile[] }) {
  if (files.length === 0) {
    return <p className="text-xs text-muted-foreground">Chưa có minh chứng</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={`#file-${file.fileId}`}
          onClick={(event) => {
            event.preventDefault();
            void downloadFile(file.fileId, file.fileName).catch(() => toast.error('Không tải được file'));
          }}
          className="flex min-w-0 items-start gap-2 rounded-md border border-border bg-muted/60 px-3 py-2.5 text-xs transition-[border-color,background-color,color,transform] duration-150 hover:border-primary/40 hover:bg-primary/[0.03] hover:text-primary active:translate-y-px"
        >
          <FileText className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{file.fileName}</span>
            <span className="mt-0.5 block text-muted-foreground">{file.fileSize} · {file.uploadedAt}</span>
          </span>
          <Download className="mt-0.5 size-3.5 shrink-0" />
        </a>
      ))}
    </div>
  );
}

function ProposedScoreSummary({ item }: { item: SpecialistCriteriaItem }) {
  return (
    <div className="grid grid-cols-2 gap-2" aria-label="Điểm địa phương đề xuất">
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <p className="min-h-8 text-xs leading-4 text-muted-foreground">Điểm</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">
          {item.proposedScore}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {item.maxProposedScore}</span>
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <p className="min-h-8 text-xs leading-4 text-muted-foreground">Điểm thưởng</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">
          {item.proposedBonusScore}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {item.maxProposedBonusScore}</span>
        </p>
      </div>
    </div>
  );
}

export default function SpecialistReviewPage() {
  const { diaPhuongId, nhomTieuChiId } = useParams<{ diaPhuongId?: string; nhomTieuChiId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localitySearch, setLocalitySearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [scoringCriterionId, setScoringCriterionId] = useState<string | null>(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const allSubmissionsQuery = useQuery({
    queryKey: ['specialist-submissions'],
    queryFn: () => specialistApi.listAllSubmissions({ page: 1, pageSize: 200 }),
  });

  const groupsQuery = useQuery({
    queryKey: ['specialist-criteria-groups'],
    queryFn: () => specialistApi.listCriteriaGroups({ page: 1, pageSize: 100 }),
  });

  // Danh sách địa phương = nhóm submissions theo locality (wardCode)
  const totalAppliedGroups = useMemo(
    () => (groupsQuery.data?.items ?? []).filter((g) => g.status === 'Applied').length,
    [groupsQuery.data],
  );

  const localityRows: LocalityRow[] = useMemo(() => {
    const submissions = allSubmissionsQuery.data?.items ?? [];
    const byLocality = new Map<string, SubmissionApi[]>();
    for (const s of submissions) {
      const key = s.createdByWardCode ?? s.createdBy ?? 'unknown';
      if (!byLocality.has(key)) byLocality.set(key, []);
      byLocality.get(key)!.push(s);
    }
    return Array.from(byLocality.entries()).map(([wardCode, subs]) => {
      const statuses = subs.map((s) => STAGE_TO_STATUS[s.currentStage] ?? 'CHO_DUYET');
      const overallStatus: LocalityRow['overallStatus'] = statuses.includes('YEU_CAU_SUA')
        ? 'YEU_CAU_SUA'
        : statuses.includes('CHO_DUYET')
          ? 'CHO_DUYET'
          : 'DA_DUYET';
      return {
        localityId: wardCode,
        localityName: subs[0]?.localityFullName ?? subs[0]?.createdByUsername ?? wardCode,
        completionRate: `${subs.length}/${totalAppliedGroups}`,
        overallStatus,
        hasNewSubmissions: statuses.includes('CHO_DUYET'),
        hasModificationRequest: statuses.includes('YEU_CAU_SUA'),
        submissionIds: subs.map((s) => s.id),
      };
    });
  }, [allSubmissionsQuery.data, totalAppliedGroups]);

  // Submissions của địa phương đang chọn
  const localitySubmissions = useMemo(
    () => (allSubmissionsQuery.data?.items ?? []).filter((s) => (s.createdByWardCode ?? s.createdBy ?? 'unknown') === diaPhuongId),
    [allSubmissionsQuery.data, diaPhuongId],
  );

  const submissionByGroup = useMemo(() => {
    const map = new Map<string, SubmissionApi>();
    for (const s of localitySubmissions) map.set(s.criteriaGroupId, s);
    return map;
  }, [localitySubmissions]);

  // Nhóm tiêu chí của địa phương đang chọn (chỉ hiện group Applied hoặc đã có submission)
  const localityGroups: SpecialistCriteriaGroup[] = useMemo(() => {
    const groups = groupsQuery.data?.items ?? [];
    return groups
      .filter((g) => g.status === 'Applied' || submissionByGroup.has(g.id))
      .map((g) => {
        const submission = submissionByGroup.get(g.id);
        const items: SpecialistCriteriaItem[] = (g.criteria ?? []).map((c, idx) => {
          const result = submission?.results.find((r) => r.criteriaId === c.id);
          return {
            id: c.id,
            code: `TC_${String(idx + 1).padStart(2, '0')}`,
            title: c.content,
            evidenceFiles: [],
            proposedScore: result?.point ?? 0,
            proposedBonusScore: result?.bonusPoint ?? 0,
            maxProposedScore: c.maxPoint,
            maxProposedBonusScore: c.maxBonusPoint,
            explanation: result?.explanation ?? '',
            officialScore: null,
            officialBonusScore: null,
            scoreReason: '',
          };
        });
        return {
          id: g.id,
          code: g.name,
          groupName: g.name,
          description: g.content ?? '',
          totalProposedScore: submission?.results.reduce((sum, r) => sum + r.point, 0) ?? 0,
          totalProposedBonusScore: submission?.results.reduce((sum, r) => sum + r.bonusPoint, 0) ?? 0,
          status: submission ? (STAGE_TO_GROUP_STATUS[submission.currentStage] ?? 'CHO_CHAM') : 'CHUA_NOP',
          hasModificationRequest: submission?.currentStage === 'RequiresRevision',
          items,
        };
      });
  }, [groupsQuery.data, submissionByGroup]);

  const district: LocalityRow | undefined = useMemo(
    () => localityRows.find((row) => row.localityId === diaPhuongId),
    [localityRows, diaPhuongId],
  );

  // Chi tiết submission đang chọn
  const selectedSubmission = useMemo(
    () => localitySubmissions.find((s) => s.criteriaGroupId === nhomTieuChiId),
    [localitySubmissions, nhomTieuChiId],
  );

  const selectedGroupDetailQuery = useQuery({
    queryKey: ['specialist-group-detail', nhomTieuChiId],
    queryFn: () => specialistApi.getCriteriaGroup(nhomTieuChiId!),
    enabled: Boolean(nhomTieuChiId),
  });

  const selectedSubmissionDetailQuery = useQuery({
    queryKey: ['specialist-submission-detail', selectedSubmission?.id],
    queryFn: () => specialistApi.getSubmission(selectedSubmission!.id),
    enabled: Boolean(selectedSubmission?.id),
  });

  const selectedGroup: SpecialistCriteriaGroup | undefined = useMemo(() => {
    if (!nhomTieuChiId) return undefined;
    const group = selectedGroupDetailQuery.data;
    if (!group) return undefined;
    const submission = selectedSubmissionDetailQuery.data;
    const items: SpecialistCriteriaItem[] = (group.criteria ?? []).map((c, idx) => {
      const result = submission?.results.find((r) => r.criteriaId === c.id);
      return {
        id: c.id,
        code: `TC_${String(idx + 1).padStart(2, '0')}`,
        title: c.content,
        evidenceFiles: [],
        proposedScore: result?.point ?? 0,
        proposedBonusScore: result?.bonusPoint ?? 0,
        maxProposedScore: c.maxPoint,
        maxProposedBonusScore: c.maxBonusPoint,
        explanation: result?.explanation ?? '',
        officialScore: null,
        officialBonusScore: null,
        scoreReason: '',
      };
    });
    return {
      id: group.id,
      code: group.name,
      groupName: group.name,
      description: group.content ?? '',
      totalProposedScore: submission?.results.reduce((sum, r) => sum + r.point, 0) ?? 0,
      totalProposedBonusScore: submission?.results.reduce((sum, r) => sum + r.bonusPoint, 0) ?? 0,
      status: submission ? (STAGE_TO_GROUP_STATUS[submission.currentStage] ?? 'CHO_CHAM') : 'CHUA_NOP',
      hasModificationRequest: submission?.currentStage === 'RequiresRevision',
      items,
    };
  }, [nhomTieuChiId, selectedGroupDetailQuery.data, selectedSubmissionDetailQuery.data]);

  // Local state cho điểm chuyên viên chấm (đè lên dữ liệu API)
  const [scoreOverrides, setScoreOverrides] = useState<Map<string, Partial<SpecialistCriteriaItem>>>(new Map());

  const applyOverrides = (group: SpecialistCriteriaGroup): SpecialistCriteriaGroup => ({
    ...group,
    items: group.items.map((item) => {
      const override = scoreOverrides.get(item.id);
      return override ? { ...item, ...override } : item;
    }),
  });

  const updateCriterion = (criterionId: string, values: Partial<SpecialistCriteriaItem>) => {
    setScoreOverrides((prev) => new Map(prev).set(criterionId, { ...prev.get(criterionId), ...values }));
  };

  const filteredGroups = useMemo(() => {
    const keyword = groupSearch.trim().toLocaleLowerCase('vi');
    if (!keyword) return localityGroups;
    return localityGroups.filter((group) =>
      `${group.code} ${group.groupName} ${group.description}`.toLocaleLowerCase('vi').includes(keyword),
    );
  }, [localityGroups, groupSearch]);

  const filteredLocalityRows = useMemo(() => {
    const keyword = localitySearch.trim().toLocaleLowerCase('vi');
    if (!keyword) return localityRows;
    return localityRows.filter((row) =>
      `${row.localityId} ${row.localityName}`.toLocaleLowerCase('vi').includes(keyword),
    );
  }, [localityRows, localitySearch]);

  if (!diaPhuongId) {
    const visibleRows = filteredLocalityRows;
    const selectedLocality = visibleRows.find((row) => row.localityId === selectedLocalityId);
    if (allSubmissionsQuery.isLoading || groupsQuery.isLoading) {
      return <div className="mx-auto w-full max-w-[1480px] space-y-6"><PageHeader title="Danh sách địa phương" description="COL.01.05 · Theo dõi tiến độ và trạng thái hồ sơ" /><p className="text-sm text-muted-foreground">Đang tải…</p></div>;
    }
    if (allSubmissionsQuery.isError || groupsQuery.isError) {
      return <EmptyState title="Không tải được dữ liệu" description={getFilesApiError(allSubmissionsQuery.error ?? groupsQuery.error)} />;
    }

    return (
      <div className="mx-auto w-full max-w-[1480px] space-y-6">
        <PageHeader title="Danh sách địa phương" description="COL.01.05 · Theo dõi tiến độ và trạng thái hồ sơ" />
        <div className="overflow-hidden rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
          <TableSectionHeader title="Hồ sơ địa phương" countLabel={`${visibleRows.length} địa phương`} />
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full max-w-xl sm:flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm địa phương"
                value={localitySearch}
                onChange={(event) => setLocalitySearch(event.target.value)}
                placeholder="Tìm kiếm tên hoặc mã địa phương"
                className="pl-9"
              />
            </div>
            <Button
              variant="info"
              disabled={!selectedLocality}
              onClick={() => selectedLocality && navigate(`/chuyen-vien/duyet/${selectedLocality.localityId}`)}
            >
              <Eye className="size-4" />Xem hồ sơ
            </Button>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{visibleRows.length}</span> kết quả phù hợp
            </p>
          </div>

          <div className="hidden xl:block">
            <Table className="w-full min-w-[1120px] table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[16%]" />
                <col className="w-[17%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Tên địa phương</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Nhóm tiêu chí đã hoàn thành</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Trạng thái hồ sơ</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Tiêu chí mới được nộp</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Yêu cầu chỉnh sửa</TableHead>
                  <TableHead className="whitespace-normal bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Cập nhật thông tin mới</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => {
                  const newGroups = row.hasNewSubmissions ? 1 : 0;
                  return (
                  <TableRow
                    key={row.localityId}
                    aria-selected={selectedLocalityId === row.localityId}
                    className={selectedLocalityId === row.localityId ? 'cursor-pointer bg-primary/10 hover:bg-primary/10' : 'cursor-pointer hover:bg-muted'}
                    onClick={() => setSelectedLocalityId(row.localityId)}
                    onDoubleClick={() => navigate(`/chuyen-vien/duyet/${row.localityId}`)}
                  >
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-4" /></span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-5 text-foreground">{row.localityName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{row.localityId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center"><span className="font-semibold tabular-nums">{row.completionRate}</span><span className="ml-1 text-xs text-muted-foreground">nhóm</span></TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center"><OverallStatusBadge status={row.overallStatus} /></TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center">{newGroups > 0 ? <Badge variant="secondary">{newGroups} nhóm</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center">{row.hasModificationRequest ? <Badge variant="warning">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                    <TableCell className="px-4 py-4 text-center">{row.hasNewSubmissions ? <Badge variant="secondary">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                  </TableRow>
                  );
                })}
                {visibleRows.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Không có địa phương phù hợp.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="xl:hidden">
            {visibleRows.length > 0 ? visibleRows.map((row) => (
              <article key={row.localityId} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-5 text-foreground">{row.localityName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{row.localityId}</p>
                    </div>
                  </div>
                  <OverallStatusBadge status={row.overallStatus} />
                </div>
                <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Đã hoàn thành</dt><dd className="mt-1 font-semibold tabular-nums">{row.completionRate} nhóm</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Tiêu chí mới</dt><dd className="mt-1 font-semibold tabular-nums">{row.hasNewSubmissions ? '1 nhóm' : '0 nhóm'}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Yêu cầu sửa</dt><dd className="mt-1 font-medium">{row.hasModificationRequest ? 'Có' : 'Không'}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Cập nhật mới</dt><dd className="mt-1 font-medium">{row.hasNewSubmissions ? 'Có' : 'Không'}</dd></div>
                </dl>
                <Button className="mt-4 w-full sm:w-auto" onClick={() => navigate(`/chuyen-vien/duyet/${row.localityId}`)}><Eye className="size-4" />Xem hồ sơ</Button>
              </article>
            )) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">Không có địa phương phù hợp.</p>
            )}
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">{visibleRows.length} kết quả · 10 dòng/trang</div>
        </div>
      </div>
    );
  }

  if (!district) {
    return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không tồn tại trong dữ liệu." />;
  }

  if (!nhomTieuChiId) {
    const completedGroups = localityGroups.filter((group) => group.status === 'DA_CHAM').length;
    const revisionGroups = localityGroups.filter((group) => group.hasModificationRequest).length;
    const totalCount = localityGroups.length;
    const completionPercent = totalCount > 0 ? Math.min(100, Math.round((completedGroups / totalCount) * 100)) : 0;
    const selectedGroupRow = filteredGroups.find((group) => group.id === selectedGroupId);

    return (
      <div className="mx-auto w-full max-w-[1480px] space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link>
          <span>/</span>
          <span className="font-medium text-foreground">{district.localityName}</span>
        </div>
        <PageHeader
          title={`Nhóm tiêu chí của ${district.localityName}`}
          description="Xem tiến độ và thực hiện chấm điểm từng nhóm tiêu chí"
          actions={<Button variant="outline" render={<Link to="/chuyen-vien/duyet" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>}
        />

        <section className="grid gap-5 rounded-lg border border-border border-l-[3px] border-l-primary bg-card p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-center" aria-label="Tổng quan địa phương">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-5" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{district.localityName}</h2>
                <OverallStatusBadge status={district.overallStatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Hồ sơ thi đua năm 2026 · {completedGroups} nhóm đã chấm</p>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nhóm tiêu chí đã hoàn thành</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{completedGroups}/{totalCount}</p>
              </div>
              {revisionGroups > 0 && <Badge variant="warning">{revisionGroups} nhóm cần chỉnh sửa</Badge>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tiến độ hoàn thành nhóm tiêu chí" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
          <TableSectionHeader title="Nhóm tiêu chí thi đua" countLabel={`${filteredGroups.length} nhóm tiêu chí`} />
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full max-w-xl sm:flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm nhóm tiêu chí"
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm kiếm tên hoặc mã nhóm tiêu chí"
              />
            </div>
            <Button
              variant={selectedGroupRow?.status === 'DA_CHAM' ? 'outline' : 'info'}
              disabled={!selectedGroupRow}
              onClick={() => selectedGroupRow && navigate(`/chuyen-vien/duyet/${district.localityId}/${selectedGroupRow.id}`)}
            >
              {selectedGroupRow?.status === 'CHO_CHAM' || selectedGroupRow?.status === 'YEU_CAU_SUA' ? <Edit3 className="size-4" /> : <Eye className="size-4" />}
              {selectedGroupRow?.status === 'CHO_CHAM' || selectedGroupRow?.status === 'YEU_CAU_SUA' ? 'Chấm điểm' : 'Xem chi tiết'}
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span><strong className="font-semibold text-success">{completedGroups}</strong> đã chấm</span>
              <span className="h-3 w-px bg-border" />
              <span><strong className="font-semibold text-warning-foreground">{revisionGroups}</strong> cần chỉnh sửa</span>
            </div>
          </div>

          <div className="hidden xl:block">
            <Table className="w-full min-w-[1180px] table-fixed">
              <colgroup>
                <col className="w-[23%]" />
                <col className="w-[31%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Nhóm tiêu chí</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Nội dung</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-right leading-5 text-primary-foreground">Điểm đề xuất</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-right leading-5 text-primary-foreground">Điểm thưởng</TableHead>
                  <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Trạng thái</TableHead>
                  <TableHead className="whitespace-normal bg-primary px-4 py-3 text-center leading-5 text-primary-foreground">Yêu cầu sửa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow
                    key={group.id}
                    aria-selected={selectedGroupId === group.id}
                    className={selectedGroupId === group.id ? 'cursor-pointer bg-primary/10 hover:bg-primary/10' : 'cursor-pointer hover:bg-muted'}
                    onClick={() => setSelectedGroupId(group.id)}
                    onDoubleClick={() => navigate(`/chuyen-vien/duyet/${district.localityId}/${group.id}`)}
                  >
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4 align-top"><p className="font-semibold leading-5 text-foreground">{group.groupName}</p><p className="mt-2 text-xs text-muted-foreground">{group.code}</p></TableCell>
                    <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-4 align-top text-sm leading-5 text-muted-foreground">{group.description}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-right align-top font-semibold tabular-nums">{group.totalProposedScore}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-right align-top tabular-nums">{group.totalProposedBonusScore}</TableCell>
                    <TableCell className="border-r border-primary/15 px-4 py-4 text-center align-top"><GroupStatusBadge status={group.status} /></TableCell>
                    <TableCell className="px-4 py-4 text-center align-top">{group.hasModificationRequest ? <Badge variant="warning">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                  </TableRow>
                ))}
                {filteredGroups.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Không có nhóm tiêu chí phù hợp.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border xl:hidden">
            {filteredGroups.map((group) => (
              <article key={group.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-primary">{group.code}</p>
                    <h3 className="mt-1 font-semibold leading-5 text-foreground">{group.groupName}</h3>
                  </div>
                  <GroupStatusBadge status={group.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{group.description}</p>
                <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-border bg-border">
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Điểm đề xuất</dt><dd className="mt-1 font-semibold tabular-nums">{group.totalProposedScore}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Điểm thưởng</dt><dd className="mt-1 font-semibold tabular-nums">{group.totalProposedBonusScore}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Yêu cầu sửa</dt><dd className="mt-1 font-medium">{group.hasModificationRequest ? 'Có' : 'Không'}</dd></div>
                </dl>
                <Button className="mt-4 w-full sm:w-auto" variant={group.status === 'DA_CHAM' ? 'outline' : 'default'} onClick={() => navigate(`/chuyen-vien/duyet/${district.localityId}/${group.id}`)}>
                  {group.status === 'CHO_CHAM' || group.status === 'YEU_CAU_SUA' ? <Edit3 className="size-4" /> : <Eye className="size-4" />}
                  {group.status === 'CHO_CHAM' || group.status === 'YEU_CAU_SUA' ? 'Chấm điểm' : 'Xem chi tiết'}
                </Button>
              </article>
            ))}
            {filteredGroups.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Không có nhóm tiêu chí phù hợp.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Mã nhóm tiêu chí không tồn tại trong dữ liệu." />;
  }

  const displayGroup = applyOverrides(selectedGroup);
  const selectedCriterion = selectedCriterionId
    ? displayGroup.items.find((item) => item.id === selectedCriterionId)
    : undefined;
  const scoringItem = scoringCriterionId
    ? displayGroup.items.find((item) => item.id === scoringCriterionId)
    : undefined;

  const copyProposedScores = () => {
    const newOverrides = new Map(scoreOverrides);
    for (const item of displayGroup.items) {
      newOverrides.set(item.id, {
        ...newOverrides.get(item.id),
        officialScore: item.proposedScore,
        officialBonusScore: item.proposedBonusScore,
        scoreReason: item.isAddedBySpecialist ? item.scoreReason : '',
      });
    }
    setScoreOverrides(newOverrides);
    toast.success('Đã sao chép toàn bộ điểm đề xuất sang điểm Chuyên viên chấm.');
  };

  const openForwardDialog = () => {
    if (displayGroup.items.length === 0) {
      toast.error('Nhóm tiêu chí chưa có tiêu chí con để gửi duyệt.');
      return;
    }
    const missingScore = displayGroup.items.some((item) => item.officialScore === null || item.officialBonusScore === null);
    if (missingScore) {
      toast.error('Vui lòng chấm đủ điểm và điểm thưởng cho tất cả tiêu chí.');
      return;
    }
    const missingReason = displayGroup.items.some((item) => {
      const changed = item.officialScore !== item.proposedScore || item.officialBonusScore !== item.proposedBonusScore;
      return changed && !item.scoreReason.trim();
    });
    if (missingReason) {
      toast.error('Vui lòng nhập lý do cho các tiêu chí có điểm chấm khác điểm đề xuất.');
      return;
    }
    setForwardOpen(true);
  };

  const confirmForward = async () => {
    const submission = submissionByGroup.get(selectedGroup.id);
    if (!submission) {
      toast.error('Nhóm này chưa có hồ sơ để chuyển.');
      return;
    }
    if (submission.currentStage !== 'LocalSubmitted') {
      toast.error('Chỉ hồ sơ ở trạng thái Chờ chấm mới có thể chuyển lên Lãnh đạo ban.');
      return;
    }
    try {
      await specialistApi.approveSubmission(submission.id);
      await queryClient.invalidateQueries({ queryKey: ['specialist-submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['specialist-submission-detail'] });
      setScoreOverrides(new Map());
      toast.success('Đã chuyển hồ sơ lên Lãnh đạo ban.');
    } catch (error) {
      toast.error('Không chuyển được hồ sơ lên Lãnh đạo ban.', { description: getFilesApiError(error) });
      throw error;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-5 pb-24">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link>
        <span>/</span>
        <Link className="hover:text-primary" to={`/chuyen-vien/duyet/${district.localityId}`}>{district.localityName}</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{selectedGroup.groupName}</span>
      </div>
      <PageHeader
        title="Chi tiết chấm điểm kết quả tiêu chí"
        description={`${selectedGroup.code} · ${selectedGroup.groupName}`}
        actions={<Button variant="outline" render={<Link to={`/chuyen-vien/duyet/${district.localityId}`} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại nhóm tiêu chí</Button>}
      />

      {/* <StatusStepper state="CHO_CHUYEN_VIEN" hasRevisionRequest={selectedGroup.hasModificationRequest} /> */}

      {selectedGroup.modificationNote && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div><p className="font-medium">Yêu cầu chỉnh sửa</p><p className="mt-0.5 text-foreground">{selectedGroup.modificationNote}</p></div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-primary bg-card shadow-[0_2px_12px_-4px_rgba(31,27,26,0.07)]">
        <TableSectionHeader
          title="Chi tiết tiêu chí con"
          countLabel={`${selectedGroup.items.length} tiêu chí`}
          actions={(
            <Button
              size="sm"
              variant={!selectedCriterion || selectedCriterion.officialScore === null ? 'default' : 'outline'}
              disabled={!selectedCriterion}
              onClick={() => selectedCriterion && setScoringCriterionId(selectedCriterion.id)}
            >
              <Edit3 className="size-4" />
              {!selectedCriterion || selectedCriterion.officialScore === null ? 'Chấm điểm' : 'Sửa điểm'}
            </Button>
          )}
        />

        <div className="hidden xl:block">
          <Table className="w-full min-w-[1240px] table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[16%]" />
              <col className="w-[15%]" />
              <col className="w-[21%]" />
              <col className="w-[28%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Tiêu chí con</TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Minh chứng</TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Địa phương đề xuất</TableHead>
                <TableHead className="whitespace-normal border-r border-white/30 bg-primary px-4 py-3 leading-5 text-primary-foreground">Nội dung diễn giải</TableHead>
                <TableHead className="whitespace-normal bg-primary px-4 py-3 leading-5 text-primary-foreground">Chuyên viên chấm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayGroup.items.map((item) => (
                <TableRow
                  key={item.id}
                  aria-selected={selectedCriterionId === item.id}
                  className={selectedCriterionId === item.id ? 'cursor-pointer align-top bg-primary/10 hover:bg-primary/10' : 'cursor-pointer align-top hover:bg-muted'}
                  onClick={() => setSelectedCriterionId(item.id)}
                  onDoubleClick={() => setScoringCriterionId(item.id)}
                >
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5">
                    <p className="font-semibold leading-5 text-foreground">{item.title}</p>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">{item.code}</p>
                    {item.isAddedBySpecialist && <Badge className="mt-3 bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
                  </TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5"><EvidenceList files={item.evidenceFiles} /></TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5"><ProposedScoreSummary item={item} /></TableCell>
                  <TableCell className="whitespace-normal border-r border-primary/15 px-4 py-5 text-sm leading-6 text-muted-foreground">{item.explanation || '—'}</TableCell>
                  <TableCell className="whitespace-normal px-4 py-5">
                    {item.officialScore === null || item.officialBonusScore === null ? (
                      <p className="text-sm text-muted-foreground">Chưa chấm điểm</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border border-border bg-muted/40 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm</p><p className="mt-1 font-semibold tabular-nums">{item.officialScore}</p></div>
                        <div className="rounded-md border border-border bg-muted/40 px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thưởng</p><p className="mt-1 font-semibold tabular-nums">{item.officialBonusScore}</p></div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {displayGroup.items.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border xl:hidden">
          {displayGroup.items.map((item) => (
            <article key={item.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary">{item.code}</p>
                  <h3 className="mt-1 font-semibold leading-5 text-foreground">{item.title}</h3>
                </div>
                {item.isAddedBySpecialist && <Badge className="bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Minh chứng</h4>
                    <div className="mt-2"><EvidenceList files={item.evidenceFiles} /></div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Nội dung diễn giải</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.explanation || '—'}</p>
                  </div>
                </div>
                <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Địa phương đề xuất</h4>
                    <div className="mt-2"><ProposedScoreSummary item={item} /></div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <h4 className="text-xs font-semibold text-foreground">Chuyên viên chấm</h4>
                    {item.officialScore === null || item.officialBonusScore === null ? (
                      <p className="mt-2 text-sm text-muted-foreground">Chưa chấm điểm</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border border-border bg-background px-3 py-2"><p className="text-xs text-muted-foreground">Điểm</p><p className="mt-1 font-semibold tabular-nums">{item.officialScore}</p></div>
                        <div className="rounded-md border border-border bg-background px-3 py-2"><p className="text-xs text-muted-foreground">Điểm thưởng</p><p className="mt-1 font-semibold tabular-nums">{item.officialBonusScore}</p></div>
                      </div>
                    )}
                    <Button className="mt-3 w-full" variant={item.officialScore === null ? 'default' : 'outline'} onClick={() => setScoringCriterionId(item.id)}>
                      <Edit3 className="size-4" />{item.officialScore === null ? 'Chấm điểm' : 'Sửa điểm'}
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {displayGroup.items.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Nhóm này chưa có tiêu chí con.</p>}
        </div>
      </div>

      <div className="border-t border-border bg-background py-3 md:sticky md:bottom-0 md:z-20 md:-mx-6 md:px-6">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <Button variant="outline" onClick={copyProposedScores} disabled={displayGroup.items.length === 0}><Sparkles className="size-4" />Cho điểm theo đề xuất</Button>
            <Button variant="outline" onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="size-4" />Thêm tiêu chí bổ sung</Button>
            <Button variant="outline" className="border-warning/60 text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground sm:col-span-2 lg:col-span-1" onClick={() => setRevisionOpen(true)}><AlertCircle className="size-4 text-warning" />Yêu cầu địa phương chỉnh sửa</Button>
          </div>
          <Button className="w-full lg:w-auto" onClick={openForwardDialog}><Send className="size-4" />Gửi Lãnh đạo ban</Button>
        </div>
      </div>

      <ScoreDialog
        item={scoringItem}
        open={Boolean(scoringItem)}
        onOpenChange={(open) => {
          if (!open) setScoringCriterionId(null);
        }}
        onSave={({ score, bonusScore, scoreReason }) => {
          if (!scoringItem) return;
          updateCriterion(scoringItem.id, {
            officialScore: score,
            officialBonusScore: bonusScore,
            scoreReason,
          });
          toast.success('Đã lưu điểm chấm của Chuyên viên.');
        }}
      />

      <SupplementaryDialog
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ reason, score, file }) => {
          const now = new Date();
          const itemId = `CRIT_ADD_${now.getTime()}`;
          updateCriterion(itemId, {
            id: itemId,
            code: `TC_ADD_${displayGroup.items.length + 1}`,
            title: '[Tiêu chí bổ sung] Tiêu chí phát sinh trong quá trình thẩm định',
            evidenceFiles: file ? [{ id: `FILE_${now.getTime()}`, fileName: file.name, fileSize: formatFileSize(file.size), uploadedAt: new Intl.DateTimeFormat('vi-VN').format(now), fileId: `FILE_${now.getTime()}` }] : [],
            proposedScore: 0,
            proposedBonusScore: 0,
            maxProposedScore: 0,
            maxProposedBonusScore: 0,
            explanation: reason,
            officialScore: score,
            officialBonusScore: 0,
            scoreReason: reason,
            isAddedBySpecialist: true,
          });
          toast.success('Đã thêm tiêu chí bổ sung.');
        }}
      />
      <RevisionDialog
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        localityName={district.localityName}
        onSubmit={(reason) => {
          toast.info('Yêu cầu chỉnh sửa đã được ghi nhận cục bộ.', { description: reason });
        }}
      />
      <ForwardSubmissionDialog
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        localityName={district.localityName}
        groupName={selectedGroup.groupName}
        onConfirm={confirmForward}
      />
    </div>
  );
}
