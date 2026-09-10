import { Eye, FileText, LockKeyhole, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CriteriaItem, Evidence, ScoreEntry, ScoreRecord } from '@/types/domain';

interface ScoreGroupInputProps {
  criteria: CriteriaItem[];
  record: ScoreRecord;
  evidence: Evidence[];
  localityId: string;
  mode: 'locality' | 'specialist' | 'result';
  lockedCriteriaIds?: string[];
  selectedCriteriaId?: string | null;
  onSelect?: (entry: ScoreEntry, criterion?: CriteriaItem) => void;
  onEdit?: (entry: ScoreEntry, criterion?: CriteriaItem) => void;
  onEvidence?: (entry: ScoreEntry, criterion?: CriteriaItem) => void;
}

export function ScoreGroupInput({
  criteria, record, evidence, localityId, mode, lockedCriteriaIds = [], selectedCriteriaId, onSelect, onEdit, onEvidence,
}: ScoreGroupInputProps) {
  const rows = [
    ...criteria.map((criterion) => ({ criterion, entry: record.entries.find((item) => item.criteriaId === criterion.id) })),
    ...record.entries
      .filter((entry) => entry.isSupplementary || !criteria.some((criterion) => criterion.id === entry.criteriaId))
      .map((entry) => ({ criterion: undefined, entry })),
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70">
              <TableHead className="min-w-[230px]">Nội dung tiêu chí</TableHead>
              <TableHead className="min-w-[120px]">Bằng chứng</TableHead>
              <TableHead className="text-right">Điểm đề xuất</TableHead>
              <TableHead className="text-right">Điểm thưởng đề xuất</TableHead>
              <TableHead className="text-right text-muted-foreground">Điểm tối đa ◎</TableHead>
              <TableHead className="text-right text-muted-foreground">Điểm thưởng tối đa ◎</TableHead>
              <TableHead className="min-w-[220px]">Nội dung diễn giải</TableHead>
              {mode !== 'locality' && <TableHead className="text-right">Điểm chính thức</TableHead>}
              {mode === 'specialist' && <TableHead className="min-w-[180px]">Lý do</TableHead>}
              {mode !== 'result' && <TableHead className="text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ criterion, entry }) => {
              const criteriaId = criterion?.id ?? entry?.criteriaId ?? '';
              const files = evidence.filter((item) => item.localityId === localityId && item.criteriaId === criteriaId);
              const locked = Boolean(entry?.locked || lockedCriteriaIds.includes(criteriaId));
              const placeholder: ScoreEntry = entry ?? { id: `empty-${criteriaId}`, criteriaId, criteriaName: criterion?.name ?? '', value: 0, state: record.state, scoredBy: '', scoredAt: '', evidenceCount: files.length };
              const specialistScore = entry?.stageScores?.SPECIALIST;

              return (
                <TableRow
                  key={criteriaId}
                  onClick={() => onSelect?.(placeholder, criterion)}
                  data-state={selectedCriteriaId === criteriaId ? 'selected' : undefined}
                  className={cn(onSelect && 'cursor-pointer', locked && 'bg-muted/60 text-muted-foreground', selectedCriteriaId === criteriaId && 'bg-primary/[0.05]')}
                >
                  <TableCell className="align-top">
                    <div className="flex items-start gap-2">
                      {locked && <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-label="Đã khóa" />}
                      <div>
                        <p className="font-medium leading-5">{criterion?.name ?? entry?.criteriaName}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entry?.isSupplementary && <Badge variant="secondary">Tiêu chí bổ sung</Badge>}
                          {locked && <Badge variant="outline">Đã khóa ◎</Badge>}
                          {entry?.revisionRequest && <Badge className="bg-warning/15 text-warning-foreground">Yêu cầu chỉnh sửa</Badge>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {files.length ? (
                      <button type="button" onClick={(event) => { event.stopPropagation(); onEvidence?.(placeholder, criterion); }} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><FileText className="size-4" /> {files.length} tệp</button>
                    ) : <span className="text-muted-foreground">Chưa có</span>}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">{entry?.isSupplementary ? '—' : (entry?.proposedScore ?? '—')}</TableCell>
                  <TableCell className="text-right align-top tabular-nums">{entry?.isSupplementary ? '—' : (entry?.proposedBonusScore ?? 0)}</TableCell>
                  <TableCell className="text-right align-top tabular-nums text-muted-foreground">{criterion?.maxScore ?? entry?.supplementaryMaxScore ?? '—'}</TableCell>
                  <TableCell className="text-right align-top tabular-nums text-muted-foreground">{criterion?.bonusScore ?? 0}</TableCell>
                  <TableCell className="align-top">
                    <p className="text-sm">{entry?.explanation || 'Chưa nhập diễn giải'}</p>
                    {entry?.revisionRequest && <p className="mt-2 rounded border border-warning/40 bg-warning/10 p-2 text-xs"><strong>Phản hồi:</strong> {entry.revisionRequest}</p>}
                  </TableCell>
                  {mode !== 'locality' && <TableCell className="text-right align-top font-semibold tabular-nums">{entry ? entry.value : '—'}</TableCell>}
                  {mode === 'specialist' && <TableCell className="align-top text-sm text-muted-foreground">{specialistScore?.reason || '—'}</TableCell>}
                  {mode !== 'result' && (
                    <TableCell className="text-right align-top">
                      <div className="flex justify-end gap-1">
                        <Button size="icon-xs" variant="ghost" title="Xem bằng chứng" onClick={(event) => { event.stopPropagation(); onEvidence?.(placeholder, criterion); }}><Eye className="size-4" /></Button>
                        {onEdit && <Button size="icon-xs" variant="ghost" title={locked ? 'Tiêu chí đã khóa' : 'Sửa điểm'} disabled={locked || record.state === 'DA_CONG_BO'} onClick={(event) => { event.stopPropagation(); onEdit(placeholder, criterion); }}><Pencil className="size-4" /></Button>}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
