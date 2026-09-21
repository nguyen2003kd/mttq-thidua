import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CriteriaGroupApi } from '@/features/admin/api/criteriaGroupsApi';
import type { SubmissionApi } from '@/features/cham-diem/api/specialistApi';

interface CouncilSubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionApi | null;
  group?: CriteriaGroupApi;
}

const numberFormat = new Intl.NumberFormat('vi-VN');

function displayNumber(value: number) {
  return numberFormat.format(value);
}

export function CouncilSubmissionDetailDialog({ open, onOpenChange, submission, group }: CouncilSubmissionDetailDialogProps) {
  if (!submission) return null;

  const criteriaById = new Map((group?.criteria ?? []).map((criterion) => [criterion.id, criterion]));
  const proposedTotal = submission.results.reduce((total, result) => total + result.point + result.bonusPoint, 0);
  const actualTotal = submission.results.reduce((total, result) => total + (result.officialPoint ?? result.point) + (result.officialBonusPoint ?? result.bonusPoint), 0);
  const actualBonusTotal = submission.results.reduce((total, result) => total + (result.officialBonusPoint ?? result.bonusPoint), 0);
  const localityName = submission.localityFullName ?? submission.createdByUsername ?? 'Địa phương';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Chi tiết nhóm tiêu chí</DialogTitle>
          <p className="text-sm text-muted-foreground">{group?.name ?? submission.criteriaGroupName ?? submission.criteriaGroupId} · {localityName}</p>
        </DialogHeader>

        <div className="grid gap-3 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Tên nhóm tiêu chí</p><p className="mt-1 font-semibold">{group?.name ?? submission.criteriaGroupName ?? submission.criteriaGroupId}</p></div>
            <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Nội dung nhóm</p><p className="mt-1 line-clamp-3 text-sm">{group?.content || '—'}</p></div>
            <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Tổng điểm đề xuất</p><p className="mt-1 font-semibold tabular-nums">{displayNumber(proposedTotal)}</p></div>
            <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Tổng điểm thực tế</p><p className="mt-1 font-semibold tabular-nums">{displayNumber(actualTotal)}</p></div>
            <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Tổng điểm thưởng</p><p className="mt-1 font-semibold tabular-nums">{displayNumber(actualBonusTotal)}</p></div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[1160px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Tên tiêu chí con</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="text-right">Điểm đề xuất</TableHead>
                  <TableHead className="text-right">Điểm thực tế</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Bằng chứng</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submission.results.map((result) => {
                  const criterion = criteriaById.get(result.criteriaId);
                  return (
                    <TableRow key={result.id}>
                      <TableCell className="max-w-[210px] whitespace-normal font-medium">{criterion?.content ?? result.criteriaContent ?? result.criteriaId}</TableCell>
                      <TableCell className="max-w-[230px] whitespace-normal text-muted-foreground">{result.explanation || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{displayNumber(result.point + result.bonusPoint)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{displayNumber((result.officialPoint ?? result.point) + (result.officialBonusPoint ?? result.bonusPoint))}</TableCell>
                      <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">{result.officialReason || '—'}</TableCell>
                      <TableCell className="max-w-[210px] whitespace-normal">
                        {result.files.length ? <div className="space-y-1">{result.files.map((file) => file.url ? <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><FileText className="size-3.5 shrink-0" />{file.originalName}</a> : <span key={file.id} className="flex items-center gap-1 text-muted-foreground"><FileText className="size-3.5 shrink-0" />{file.originalName}</span>)}</div> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="max-w-[190px] whitespace-normal text-muted-foreground">{criterion?.note || '—'}</TableCell>
                    </TableRow>
                  );
                })}
                {!submission.results.length && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Chưa có tiêu chí con.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
