import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { ForwardSubmissionDialog, StatusStepper } from '@/features/workflow/components';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  fileUrl: string;
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
  status: 'CHUA_CHAM' | 'DA_CHAM';
  hasModificationRequest: boolean;
  modificationNote?: string;
  items: SpecialistCriteriaItem[];
}

interface DistrictDetail {
  districtId: string;
  districtName: string;
  completionRate: string;
  overallStatus: 'CHO_DUYET' | 'YEU_CAU_SUA' | 'DA_DUYET';
  groups: SpecialistCriteriaGroup[];
}

const MOCK_SPECIALIST_DATA: DistrictDetail = {
  districtId: 'DIST_001',
  districtName: 'Phường Tân Mai',
  completionRate: '5/9',
  overallStatus: 'CHO_DUYET',
  groups: [
    {
      id: 'GRP_01',
      code: 'NGC_01',
      groupName: 'Công tác an ninh trật tự & An toàn xã hội',
      description: 'Thực hiện các tiêu chí đảm bảo an ninh trật tự, phòng chống tội phạm trên địa bàn phường năm 2026.',
      totalProposedScore: 100,
      totalProposedBonusScore: 10,
      status: 'DA_CHAM',
      hasModificationRequest: false,
      items: [
        {
          id: 'CRIT_01_01',
          code: 'TC_01.01',
          title: 'Tổ chức tuyên truyền an toàn giao thông và phòng chống tội phạm hàng quý',
          evidenceFiles: [
            { id: 'F01', fileName: 'Bao_cao_tuyen_truyen_Q1_Q2.pdf', fileSize: '2.4 MB', uploadedAt: '10/05/2026', fileUrl: '#' },
          ],
          proposedScore: 30,
          proposedBonusScore: 5,
          maxProposedScore: 30,
          maxProposedBonusScore: 5,
          explanation: 'Đã tổ chức đủ 4 buổi tuyên truyền tại 5 khu phố với hơn 1.200 lượt người tham gia.',
          officialScore: 30,
          officialBonusScore: 5,
          scoreReason: '',
        },
        {
          id: 'CRIT_01_02',
          code: 'TC_01.02',
          title: 'Duy trì mô hình Tổ liên gia an toàn phòng cháy chữa cháy',
          evidenceFiles: [
            { id: 'F02', fileName: 'Nhat_ky_dien_tap_PCCC_2026.docx', fileSize: '1.1 MB', uploadedAt: '12/05/2026', fileUrl: '#' },
          ],
          proposedScore: 40,
          proposedBonusScore: 0,
          maxProposedScore: 40,
          maxProposedBonusScore: 0,
          explanation: 'Thành lập và duy trì 8 tổ liên gia PCCC, đã thực tập phương án chữa cháy 2 lần/năm.',
          officialScore: 35,
          officialBonusScore: 0,
          scoreReason: 'Thiếu sổ nhật ký kiểm tra phương tiện PCCC định kỳ tháng 4',
        },
        {
          id: 'CRIT_01_03',
          code: 'TC_01_ADD',
          title: '[Tiêu chí bổ sung] Thực hiện đợt cao điểm tấn công trấn áp tội phạm dịp Lễ',
          evidenceFiles: [
            { id: 'F03', fileName: 'Quyet_dinh_tang_cuong_luc_luong.pdf', fileSize: '3.0 MB', uploadedAt: '15/05/2026', fileUrl: '#' },
          ],
          proposedScore: 0,
          proposedBonusScore: 0,
          maxProposedScore: 0,
          maxProposedBonusScore: 0,
          explanation: 'Chuyên viên tạo bổ sung do kiểm tra thực tế địa phương đạt thành tích xuất sắc đột xuất.',
          officialScore: 10,
          officialBonusScore: 5,
          scoreReason: 'Bổ sung theo biên bản kiểm tra thực tế của Đoàn thẩm định Thành phố',
          isAddedBySpecialist: true,
        },
      ],
    },
    {
      id: 'GRP_02',
      code: 'NGC_02',
      groupName: 'Xây dựng đời sống văn hóa & Văn minh đô thị',
      description: 'Các chỉ tiêu về đăng ký Gia đình văn hóa, Khu phố văn hóa và giữ gìn trật tự đô thị.',
      totalProposedScore: 95,
      totalProposedBonusScore: 5,
      status: 'CHUA_CHAM',
      hasModificationRequest: true,
      modificationNote: 'Cần làm rõ minh chứng tỷ lệ Gia đình văn hóa đạt trên 95%',
      items: [
        {
          id: 'CRIT_02_01',
          code: 'TC_02.01',
          title: 'Tỷ lệ Gia đình văn hóa đạt từ 95% trở lên',
          evidenceFiles: [
            { id: 'F04', fileName: 'Danh_sach_Gia_dinh_van_hoa.xlsx', fileSize: '850 KB', uploadedAt: '08/05/2026', fileUrl: '#' },
          ],
          proposedScore: 50,
          proposedBonusScore: 5,
          maxProposedScore: 50,
          maxProposedBonusScore: 5,
          explanation: 'Tổng số hộ đăng ký: 3.500 hộ, số hộ đạt chuẩn: 3.380 hộ (đạt 96,5%).',
          officialScore: null,
          officialBonusScore: null,
          scoreReason: '',
        },
      ],
    },
    {
      id: 'GRP_03',
      code: 'NGC_03',
      groupName: 'Công tác cải cách hành chính & Chuyển đổi số',
      description: 'Chỉ số hài lòng của người dân, tỷ lệ dịch vụ công trực tuyến toàn trình.',
      totalProposedScore: 90,
      totalProposedBonusScore: 0,
      status: 'DA_CHAM',
      hasModificationRequest: false,
      items: [],
    },
  ],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const supplementarySchema = z.object({
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do bổ sung.'),
  score: z.number({ invalid_type_error: 'Vui lòng nhập điểm chấm.' }).min(0, 'Điểm chấm không được nhỏ hơn 0.'),
  file: z.instanceof(File).nullable().refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File đính kèm không được vượt quá 20MB.'),
});

type SupplementaryForm = z.infer<typeof supplementarySchema>;

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

function OverallStatusBadge({ status }: { status: DistrictDetail['overallStatus'] }) {
  if (status === 'DA_DUYET') return <Badge variant="success">Đã duyệt</Badge>;
  if (status === 'YEU_CAU_SUA') return <Badge variant="warning">Yêu cầu chỉnh sửa</Badge>;
  return <Badge className="border border-accent/40 bg-accent/20 text-foreground">Đang chờ duyệt</Badge>;
}

function GroupStatusBadge({ status }: { status: SpecialistCriteriaGroup['status'] }) {
  return status === 'DA_CHAM'
    ? <Badge variant="success"><CheckCircle2 className="size-3" />Đã chấm</Badge>
    : <Badge variant="secondary">Chưa chấm</Badge>;
}

function TableSectionHeader({ title, countLabel }: { title: string; countLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-muted/60 px-4 py-3 sm:px-5">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{countLabel}</span>
      </div>
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
          href={file.fileUrl}
          onClick={(event) => {
            event.preventDefault();
            toast.info(`Đang mở ${file.fileName}`);
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
        <p className="text-xs text-muted-foreground">Điểm</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">
          {item.proposedScore}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {item.maxProposedScore}</span>
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">Điểm thưởng</p>
        <p className="mt-1 font-semibold tabular-nums text-foreground">
          {item.proposedBonusScore}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {item.maxProposedBonusScore}</span>
        </p>
      </div>
    </div>
  );
}

function SpecialistScoreEditor({
  item,
  idPrefix,
  onChange,
}: {
  item: SpecialistCriteriaItem;
  idPrefix: string;
  onChange: (values: Partial<SpecialistCriteriaItem>) => void;
}) {
  const scoreChanged = item.officialScore !== null && (
    item.officialScore !== item.proposedScore || item.officialBonusScore !== item.proposedBonusScore
  );
  const reasonRequired = scoreChanged && !item.scoreReason.trim();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-${item.id}-score`} className="text-xs">Điểm</Label>
          <Input
            id={`${idPrefix}-${item.id}-score`}
            type="number"
            min={0}
            step="0.25"
            value={item.officialScore ?? ''}
            onChange={(event) => onChange({ officialScore: event.target.value === '' ? null : Number(event.target.value) })}
            className="text-right tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-${item.id}-bonus`} className="text-xs">Điểm thưởng</Label>
          <Input
            id={`${idPrefix}-${item.id}-bonus`}
            type="number"
            min={0}
            step="0.25"
            value={item.officialBonusScore ?? ''}
            onChange={(event) => onChange({ officialBonusScore: event.target.value === '' ? null : Number(event.target.value) })}
            className="text-right tabular-nums"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-${item.id}-reason`} className="text-xs">
          Lý do sửa điểm {scoreChanged && <span className="text-destructive">★</span>}
        </Label>
        <Textarea
          id={`${idPrefix}-${item.id}-reason`}
          rows={3}
          value={item.scoreReason}
          onChange={(event) => onChange({ scoreReason: event.target.value })}
          aria-invalid={reasonRequired}
          placeholder={scoreChanged ? 'Bắt buộc nhập khi sửa điểm' : 'Không bắt buộc nếu giữ nguyên điểm'}
          className="min-h-20 resize-y"
        />
        {reasonRequired && <p className="text-xs text-destructive">Vui lòng nhập lý do sửa điểm.</p>}
      </div>
    </div>
  );
}

export default function SpecialistReviewPage() {
  const { diaPhuongId, nhomTieuChiId } = useParams<{ diaPhuongId?: string; nhomTieuChiId?: string }>();
  const navigate = useNavigate();
  const [district, setDistrict] = useState<DistrictDetail>(() => MOCK_SPECIALIST_DATA);
  const [localitySearch, setLocalitySearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);

  const selectedGroup = district.groups.find((group) => group.id === nhomTieuChiId);

  const filteredGroups = useMemo(() => {
    const keyword = groupSearch.trim().toLocaleLowerCase('vi');
    if (!keyword) return district.groups;
    return district.groups.filter((group) =>
      `${group.code} ${group.groupName} ${group.description}`.toLocaleLowerCase('vi').includes(keyword),
    );
  }, [district.groups, groupSearch]);

  const updateGroup = (groupId: string, updater: (group: SpecialistCriteriaGroup) => SpecialistCriteriaGroup) => {
    setDistrict((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === groupId ? updater(group) : group),
    }));
  };

  const updateCriterion = (criterionId: string, values: Partial<SpecialistCriteriaItem>) => {
    if (!selectedGroup) return;
    updateGroup(selectedGroup.id, (group) => ({
      ...group,
      items: group.items.map((item) => item.id === criterionId ? { ...item, ...values } : item),
    }));
  };

  if (!diaPhuongId) {
    const keyword = localitySearch.trim().toLocaleLowerCase('vi');
    const isVisible = !keyword || `${district.districtId} ${district.districtName}`.toLocaleLowerCase('vi').includes(keyword);
    const newGroups = district.groups.filter((group) => group.status === 'CHUA_CHAM').length;
    const hasModificationRequest = district.groups.some((group) => group.hasModificationRequest);

    return (
      <div className="mx-auto w-full max-w-[1480px] space-y-6">
        <PageHeader title="Danh sách địa phương" description="COL.01.05 · Theo dõi tiến độ và trạng thái hồ sơ" />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <TableSectionHeader title="Hồ sơ địa phương" countLabel={isVisible ? '1 địa phương' : '0 địa phương'} />
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm địa phương"
                value={localitySearch}
                onChange={(event) => setLocalitySearch(event.target.value)}
                placeholder="Tìm kiếm tên hoặc mã địa phương"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{isVisible ? 1 : 0}</span> kết quả phù hợp
            </p>
          </div>

          <div className="hidden xl:block">
            <Table className="w-full min-w-[1120px] table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[7%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/55 hover:bg-muted/55">
                  <TableHead className="whitespace-normal px-4 py-3 leading-5">Tên địa phương</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Nhóm tiêu chí đã hoàn thành</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Trạng thái hồ sơ</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Tiêu chí mới được nộp</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Yêu cầu chỉnh sửa</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Cập nhật thông tin mới</TableHead>
                  <TableHead className="px-3 py-3 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isVisible && (
                  <TableRow className="group cursor-pointer" onClick={() => navigate(`/chuyen-vien/duyet/${district.districtId}`)}>
                    <TableCell className="whitespace-normal px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-4" /></span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-5 text-foreground">{district.districtName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{district.districtId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center"><span className="font-semibold tabular-nums">{district.completionRate}</span><span className="ml-1 text-xs text-muted-foreground">nhóm</span></TableCell>
                    <TableCell className="px-4 py-4 text-center"><OverallStatusBadge status={district.overallStatus} /></TableCell>
                    <TableCell className="px-4 py-4 text-center"><Badge variant="secondary">{newGroups} nhóm</Badge></TableCell>
                    <TableCell className="px-4 py-4 text-center">{hasModificationRequest ? <Badge variant="warning">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                    <TableCell className="px-4 py-4 text-center"><Badge variant="secondary">Có</Badge></TableCell>
                    <TableCell className="px-3 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); navigate(`/chuyen-vien/duyet/${district.districtId}`); }}>
                        <Eye className="size-4" /><span className="sr-only">Xem {district.districtName}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {!isVisible && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Không có địa phương phù hợp.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="xl:hidden">
            {isVisible ? (
              <article className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-5 text-foreground">{district.districtName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{district.districtId}</p>
                    </div>
                  </div>
                  <OverallStatusBadge status={district.overallStatus} />
                </div>
                <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Đã hoàn thành</dt><dd className="mt-1 font-semibold tabular-nums">{district.completionRate} nhóm</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Tiêu chí mới</dt><dd className="mt-1 font-semibold tabular-nums">{newGroups} nhóm</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Yêu cầu sửa</dt><dd className="mt-1 font-medium">{hasModificationRequest ? 'Có' : 'Không'}</dd></div>
                  <div className="bg-card p-3"><dt className="text-xs text-muted-foreground">Cập nhật mới</dt><dd className="mt-1 font-medium">Có</dd></div>
                </dl>
                <Button className="mt-4 w-full sm:w-auto" onClick={() => navigate(`/chuyen-vien/duyet/${district.districtId}`)}><Eye className="size-4" />Xem hồ sơ</Button>
              </article>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">Không có địa phương phù hợp.</p>
            )}
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">{isVisible ? 1 : 0} kết quả · 10 dòng/trang</div>
        </div>
      </div>
    );
  }

  if (diaPhuongId !== district.districtId) {
    return <EmptyState title="Không tìm thấy địa phương" description="Mã địa phương không tồn tại trong dữ liệu mẫu." />;
  }

  if (!nhomTieuChiId) {
    const completedGroups = district.groups.filter((group) => group.status === 'DA_CHAM').length;
    const revisionGroups = district.groups.filter((group) => group.hasModificationRequest).length;
    const [completedCount, totalCount] = district.completionRate.split('/').map(Number);
    const completionPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

    return (
      <div className="mx-auto w-full max-w-[1480px] space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link>
          <span>/</span>
          <span className="font-medium text-foreground">{district.districtName}</span>
        </div>
        <PageHeader
          title={`Nhóm tiêu chí của ${district.districtName}`}
          description="Xem tiến độ và thực hiện chấm điểm từng nhóm tiêu chí"
          actions={<Button variant="outline" render={<Link to="/chuyen-vien/duyet" />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại</Button>}
        />

        <section className="grid gap-5 rounded-lg border border-border border-l-[3px] border-l-primary bg-card p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-center" aria-label="Tổng quan địa phương">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="size-5" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{district.districtName}</h2>
                <OverallStatusBadge status={district.overallStatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Hồ sơ thi đua năm 2026 · {completedGroups} nhóm đã chấm</p>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nhóm tiêu chí đã hoàn thành</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{district.completionRate}</p>
              </div>
              {revisionGroups > 0 && <Badge variant="warning">{revisionGroups} nhóm cần chỉnh sửa</Badge>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tiến độ hoàn thành nhóm tiêu chí" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <TableSectionHeader title="Nhóm tiêu chí thi đua" countLabel={`${filteredGroups.length} nhóm tiêu chí`} />
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm nhóm tiêu chí"
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm kiếm tên hoặc mã nhóm tiêu chí"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span><strong className="font-semibold text-success">{completedGroups}</strong> đã chấm</span>
              <span className="h-3 w-px bg-border" />
              <span><strong className="font-semibold text-warning-foreground">{revisionGroups}</strong> cần chỉnh sửa</span>
            </div>
          </div>

          <div className="hidden xl:block">
            <Table className="w-full min-w-[1180px] table-fixed">
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[27%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/55 hover:bg-muted/55">
                  <TableHead className="whitespace-normal px-4 py-3 leading-5">Nhóm tiêu chí</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 leading-5">Nội dung</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-right leading-5">Điểm đề xuất</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-right leading-5">Điểm thưởng</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Trạng thái</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-center leading-5">Yêu cầu sửa</TableHead>
                  <TableHead className="whitespace-normal px-4 py-3 text-right leading-5">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id} className="group cursor-pointer" onClick={() => navigate(`/chuyen-vien/duyet/${district.districtId}/${group.id}`)}>
                    <TableCell className="whitespace-normal px-4 py-4 align-top"><p className="font-semibold leading-5 text-foreground">{group.groupName}</p><p className="mt-2 text-xs text-muted-foreground">{group.code}</p></TableCell>
                    <TableCell className="whitespace-normal px-4 py-4 align-top text-sm leading-5 text-muted-foreground">{group.description}</TableCell>
                    <TableCell className="px-4 py-4 text-right align-top font-semibold tabular-nums">{group.totalProposedScore}</TableCell>
                    <TableCell className="px-4 py-4 text-right align-top tabular-nums">{group.totalProposedBonusScore}</TableCell>
                    <TableCell className="px-4 py-4 text-center align-top"><GroupStatusBadge status={group.status} /></TableCell>
                    <TableCell className="px-4 py-4 text-center align-top">{group.hasModificationRequest ? <Badge variant="warning">Có</Badge> : <span className="text-muted-foreground">Không</span>}</TableCell>
                    <TableCell className="px-4 py-4 text-right align-top">
                      <Button variant={group.status === 'DA_CHAM' ? 'outline' : 'default'} size="sm" onClick={(event) => { event.stopPropagation(); navigate(`/chuyen-vien/duyet/${district.districtId}/${group.id}`); }}>
                        {group.status === 'DA_CHAM' ? <Eye className="size-4" /> : <Edit3 className="size-4" />}
                        {group.status === 'DA_CHAM' ? 'Xem' : 'Chấm điểm'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGroups.length === 0 && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Không có nhóm tiêu chí phù hợp.</TableCell></TableRow>}
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
                <Button className="mt-4 w-full sm:w-auto" variant={group.status === 'DA_CHAM' ? 'outline' : 'default'} onClick={() => navigate(`/chuyen-vien/duyet/${district.districtId}/${group.id}`)}>
                  {group.status === 'DA_CHAM' ? <Eye className="size-4" /> : <Edit3 className="size-4" />}
                  {group.status === 'DA_CHAM' ? 'Xem chi tiết' : 'Chấm điểm'}
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
    return <EmptyState title="Không tìm thấy nhóm tiêu chí" description="Mã nhóm tiêu chí không tồn tại trong dữ liệu mẫu." />;
  }

  const copyProposedScores = () => {
    updateGroup(selectedGroup.id, (group) => ({
      ...group,
      status: 'DA_CHAM',
      items: group.items.map((item) => ({
        ...item,
        officialScore: item.proposedScore,
        officialBonusScore: item.proposedBonusScore,
        scoreReason: item.isAddedBySpecialist ? item.scoreReason : '',
      })),
    }));
    toast.success('Đã sao chép toàn bộ điểm đề xuất sang điểm Chuyên viên chấm.');
  };

  const openForwardDialog = () => {
    if (selectedGroup.items.length === 0) {
      toast.error('Nhóm tiêu chí chưa có tiêu chí con để gửi duyệt.');
      return;
    }
    const missingScore = selectedGroup.items.some((item) => item.officialScore === null || item.officialBonusScore === null);
    if (missingScore) {
      toast.error('Vui lòng chấm đủ điểm và điểm thưởng cho tất cả tiêu chí.');
      return;
    }
    const missingReason = selectedGroup.items.some((item) => {
      const changed = item.officialScore !== item.proposedScore || item.officialBonusScore !== item.proposedBonusScore;
      return changed && !item.scoreReason.trim();
    });
    if (missingReason) {
      toast.error('Vui lòng nhập lý do cho các tiêu chí có điểm chấm khác điểm đề xuất.');
      return;
    }
    setForwardOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-5 pb-24">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link className="hover:text-primary" to="/chuyen-vien/duyet">Danh sách địa phương</Link>
        <span>/</span>
        <Link className="hover:text-primary" to={`/chuyen-vien/duyet/${district.districtId}`}>{district.districtName}</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{selectedGroup.groupName}</span>
      </div>
      <PageHeader
        title="Chi tiết chấm điểm kết quả tiêu chí"
        description={`${selectedGroup.code} · ${selectedGroup.groupName}`}
        actions={<Button variant="outline" render={<Link to={`/chuyen-vien/duyet/${district.districtId}`} />} nativeButton={false}><ArrowLeft className="size-4" />Quay lại nhóm tiêu chí</Button>}
      />

      <StatusStepper state="CHO_CHUYEN_VIEN" hasRevisionRequest={selectedGroup.hasModificationRequest} />

      {selectedGroup.modificationNote && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div><p className="font-medium">Yêu cầu chỉnh sửa</p><p className="mt-0.5 text-foreground">{selectedGroup.modificationNote}</p></div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <TableSectionHeader title="Chi tiết tiêu chí con" countLabel={`${selectedGroup.items.length} tiêu chí`} />

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
              <TableRow className="bg-muted/55 hover:bg-muted/55">
                <TableHead className="whitespace-normal px-4 py-3 leading-5">Tiêu chí con</TableHead>
                <TableHead className="whitespace-normal px-4 py-3 leading-5">Minh chứng</TableHead>
                <TableHead className="whitespace-normal px-4 py-3 leading-5">Địa phương đề xuất</TableHead>
                <TableHead className="whitespace-normal px-4 py-3 leading-5">Nội dung diễn giải</TableHead>
                <TableHead className="whitespace-normal px-4 py-3 leading-5">Chuyên viên chấm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedGroup.items.map((item) => (
                <TableRow key={item.id} className="align-top">
                  <TableCell className="whitespace-normal px-4 py-5">
                    <p className="font-semibold leading-5 text-foreground">{item.title}</p>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">{item.code}</p>
                    {item.isAddedBySpecialist && <Badge className="mt-3 bg-primary/10 text-primary">Tiêu chí bổ sung</Badge>}
                  </TableCell>
                  <TableCell className="whitespace-normal px-4 py-5"><EvidenceList files={item.evidenceFiles} /></TableCell>
                  <TableCell className="whitespace-normal px-4 py-5"><ProposedScoreSummary item={item} /></TableCell>
                  <TableCell className="whitespace-normal px-4 py-5 text-sm leading-6 text-muted-foreground">{item.explanation || '—'}</TableCell>
                  <TableCell className="whitespace-normal px-4 py-5">
                    <SpecialistScoreEditor item={item} idPrefix="desktop" onChange={(values) => updateCriterion(item.id, values)} />
                  </TableCell>
                </TableRow>
              ))}
              {selectedGroup.items.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nhóm này chưa có tiêu chí con.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border xl:hidden">
          {selectedGroup.items.map((item) => (
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
                    <h4 className="mb-3 text-xs font-semibold text-foreground">Chuyên viên chấm</h4>
                    <SpecialistScoreEditor item={item} idPrefix="responsive" onChange={(values) => updateCriterion(item.id, values)} />
                  </div>
                </div>
              </div>
            </article>
          ))}
          {selectedGroup.items.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Nhóm này chưa có tiêu chí con.</p>}
        </div>
      </div>

      <div className="border-t border-border bg-background py-3 md:sticky md:bottom-0 md:z-20 md:-mx-6 md:px-6">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <Button variant="outline" onClick={copyProposedScores} disabled={selectedGroup.items.length === 0}><Sparkles className="size-4" />Cho điểm theo đề xuất</Button>
            <Button variant="outline" onClick={() => setSupplementaryOpen(true)}><FilePlus2 className="size-4" />Thêm tiêu chí bổ sung</Button>
            <Button variant="outline" className="border-warning/60 text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground sm:col-span-2 lg:col-span-1" onClick={() => setRevisionOpen(true)}><AlertCircle className="size-4 text-warning" />Yêu cầu địa phương chỉnh sửa</Button>
          </div>
          <Button className="w-full lg:w-auto" onClick={openForwardDialog}><Send className="size-4" />Gửi Lãnh đạo ban</Button>
        </div>
      </div>

      <SupplementaryDialog
        open={supplementaryOpen}
        onOpenChange={setSupplementaryOpen}
        onSave={({ reason, score, file }) => {
          const now = new Date();
          const itemId = `CRIT_ADD_${now.getTime()}`;
          updateGroup(selectedGroup.id, (group) => ({
            ...group,
            items: [
              ...group.items,
              {
                id: itemId,
                code: `TC_ADD_${group.items.length + 1}`,
                title: '[Tiêu chí bổ sung] Tiêu chí phát sinh trong quá trình thẩm định',
                evidenceFiles: file ? [{ id: `FILE_${now.getTime()}`, fileName: file.name, fileSize: formatFileSize(file.size), uploadedAt: new Intl.DateTimeFormat('vi-VN').format(now), fileUrl: '#' }] : [],
                proposedScore: 0,
                proposedBonusScore: 0,
                maxProposedScore: 0,
                maxProposedBonusScore: 0,
                explanation: reason,
                officialScore: score,
                officialBonusScore: 0,
                scoreReason: reason,
                isAddedBySpecialist: true,
              },
            ],
          }));
          toast.success('Đã thêm tiêu chí bổ sung vào dữ liệu mẫu.');
        }}
      />
      <RevisionDialog
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        localityName={district.districtName}
        onSubmit={(reason) => {
          updateGroup(selectedGroup.id, (group) => ({ ...group, hasModificationRequest: true, modificationNote: reason }));
          setDistrict((current) => ({ ...current, overallStatus: 'YEU_CAU_SUA' }));
          toast.success('Đã ghi nhận yêu cầu chỉnh sửa trong dữ liệu mẫu.');
        }}
      />
      <ForwardSubmissionDialog
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        onConfirm={({ file, description }) => {
          updateGroup(selectedGroup.id, (group) => ({ ...group, status: 'DA_CHAM' }));
          toast.success('Đã chuyển hồ sơ lên Lãnh đạo ban.', { description: description || (file ? `Đính kèm ${file.name}` : undefined) });
        }}
      />
    </div>
  );
}
