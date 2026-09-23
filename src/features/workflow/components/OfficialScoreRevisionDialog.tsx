import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/core';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SubmissionResultItem } from '@/features/cham-diem/api/specialistApi';
import { downloadFile, filesApi } from '@/features/files/api/filesApi';

interface OfficialScoreRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SubmissionResultItem | null;
  criterionLabel: string;
}

/** Xem điểm đã sửa và tệp đính kèm khi sửa điểm (category=score-update của chuyên viên, LeaderScoring của lãnh đạo). */
export function OfficialScoreRevisionDialog({ open, onOpenChange, result, criterionLabel }: OfficialScoreRevisionDialogProps) {
  const filesQuery = useQuery({
    queryKey: ['official-score-revision-files', result?.id],
    queryFn: async () => {
      const [scoreUpdate, leaderScoring] = await Promise.all([
        filesApi.list({ entityType: 'SubmissionResult', entityId: result!.id, category: 'score-update', page: 1, pageSize: 100 }),
        filesApi.list({ entityType: 'SubmissionResult', entityId: result!.id, category: 'LeaderScoring', page: 1, pageSize: 100 }),
      ]);
      return { items: [...scoreUpdate.items, ...leaderScoring.items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) };
    },
    enabled: open && Boolean(result?.id),
  });

  if (!result) return null;
  const files = filesQuery.data?.items ?? [];
  const score = (value: number | null, maximum: number) => <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value ?? '—'}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {maximum}</span></p>;

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Điểm đã sửa</DialogTitle><DialogDescription>Xem điểm, lý do và tệp đính kèm của lần điều chỉnh cho tiêu chí này.</DialogDescription></DialogHeader>
      <div className="space-y-5">
        <div className="rounded-md border border-border bg-muted/20 px-4 py-3"><p className="text-xs font-medium text-muted-foreground">Tiêu chí con</p><p className="mt-1 text-sm font-semibold leading-6 text-foreground">{criterionLabel}</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-border bg-background px-4 py-3"><p className="text-xs font-medium text-muted-foreground">Điểm chuyên viên chấm</p>{score(result.officialPoint, result.snapshotMaxPoint)}</div><div className="rounded-md border border-border bg-background px-4 py-3"><p className="text-xs font-medium text-muted-foreground">Điểm thưởng chuyên viên chấm</p>{score(result.officialBonusPoint, result.snapshotMaxBonusPoint)}</div></div>
        <div><p className="text-sm font-medium text-foreground">Lý do sửa điểm</p><p className="mt-2 whitespace-pre-wrap rounded-md border-l-2 border-primary bg-muted/20 px-3 py-2.5 text-sm leading-6 text-foreground">{result.officialReason}</p></div>
        <div><p className="text-sm font-medium text-foreground">Tệp đính kèm</p><p className="mt-1 text-xs text-muted-foreground">Chỉ hiển thị tệp đính kèm khi sửa điểm.</p>{filesQuery.isLoading ? <div className="mt-3 h-16 animate-pulse rounded-md bg-muted" /> : filesQuery.isError ? <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">Không tải được tệp đính kèm. Vui lòng thử lại.</p> : files.length === 0 ? <p className="mt-3 rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">Không có tệp đính kèm cho lần sửa điểm này.</p> : <div className="mt-3 divide-y rounded-md border border-border">{files.map((file) => <div key={file.id} className="flex items-center gap-3 px-3 py-2.5"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1 break-all text-sm font-medium text-foreground">{file.displayName || file.originalName}</span><Button type="button" variant="outline" size="sm" onClick={() => { void downloadFile(file.id, file.displayName || file.originalName); }}><Download className="size-4" />Tải về</Button></div>)}</div>}</div>
      </div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
