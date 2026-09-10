import { Eye, FileText, LockKeyhole, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CriteriaItem, Evidence, ScoreEntry, ScoreRecord } from '@/types/domain';

interface CriterionGridProps {
  criteria: CriteriaItem[];
  record: ScoreRecord;
  evidence: Evidence[];
  localityId: string;
  mode?: 'locality' | 'review' | 'result';
  lockedCriteriaIds?: string[];
  onEdit?: (entry: ScoreEntry, criterion?: CriteriaItem) => void;
  onEvidence?: (entry: ScoreEntry, criterion?: CriteriaItem) => void;
}
export function CriterionGrid({
  criteria,
  record,
  evidence,
  localityId,
  mode = 'locality',
  lockedCriteriaIds = [],
  onEdit,
  onEvidence,
}: CriterionGridProps) {
  const regularRows = criteria.map((criterion) => ({
    criterion,
    entry: record.entries.find((item) => item.criteriaId === criterion.id),
  }));
  const supplementaryRows = record.entries
    .filter((entry) => entry.isSupplementary)
    .map((entry) => ({ criterion: undefined, entry }));
  const rows = [...regularRows, ...supplementaryRows];

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/45">
              <TableHead className="min-w-[260px]">Nội dung tiêu chí</TableHead>
              <TableHead className="min-w-[160px]">Bằng chứng</TableHead>
              <TableHead className="text-center">Điểm đề xuất</TableHead>
              <TableHead className="text-center">Điểm thưởng</TableHead>
              <TableHead className="text-center">Điểm tối đa</TableHead>
              {mode !== 'locality' && <TableHead className="text-center">Điểm hiện tại</TableHead>}
              <TableHead className="min-w-[220px]">Diễn giải / phản hồi</TableHead>
              {mode !== 'result' && <TableHead className="text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ criterion, entry }) => {
              const criteriaId = criterion?.id ?? entry?.criteriaId ?? '';
              const files = evidence.filter(
                (item) => item.localityId === localityId && item.criteriaId === criteriaId,
              );
              const locked = Boolean(entry?.locked || lockedCriteriaIds.includes(criteriaId));
              const placeholderEntry: ScoreEntry = entry ?? {
                id: `empty-${criteriaId}`,
                criteriaId,
                criteriaName: criterion?.name ?? '',
                value: 0,
                state: record.state,
                scoredBy: '',
                scoredAt: '',
                evidenceCount: files.length,
              };
              return (
                <TableRow key={criteriaId} className={locked ? 'bg-muted/35' : undefined}>
                  <TableCell className="align-top">
                    <div className="flex items-start gap-2">
                      {locked && <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div>
                        <p className="font-medium leading-5">{criterion?.name ?? entry?.criteriaName}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {entry?.isSupplementary && <Badge variant="secondary">Tiêu chí bổ sung</Badge>}
                          {locked && <Badge variant="outline">Đã khóa</Badge>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {files.length ? (
                      <button
                        type="button"
                        onClick={() => onEvidence?.(placeholderEntry, criterion)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" /> {files.length} tệp
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa có</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center align-top tabular-nums">
                    {entry?.isSupplementary ? '—' : (entry?.proposedScore ?? '—')}
                  </TableCell>
                  <TableCell className="text-center align-top tabular-nums">
                    {entry?.isSupplementary ? '—' : (entry?.proposedBonusScore ?? 0)}
                  </TableCell>
                  <TableCell className="text-center align-top tabular-nums">
                    {criterion?.maxScore ?? entry?.supplementaryMaxScore ?? '—'}
                    {criterion?.bonusScore ? (
                      <span className="block text-xs text-muted-foreground">+{criterion.bonusScore} thưởng</span>
                    ) : null}
                  </TableCell>
                  {mode !== 'locality' && (
                    <TableCell className="text-center align-top font-semibold tabular-nums">{entry?.value ?? '—'}</TableCell>
                  )}
                  <TableCell className="align-top">
                    <p className="text-sm text-muted-foreground">{entry?.explanation || 'Chưa nhập diễn giải'}</p>
                    {entry?.revisionRequest && (
                      <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 text-xs text-foreground">
                        <span className="font-semibold">Yêu cầu chỉnh sửa: </span>{entry.revisionRequest}
                      </div>
                    )}
                  </TableCell>
                  {mode !== 'result' && (
                    <TableCell className="text-right align-top">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          title="Xem bằng chứng"
                          onClick={() => onEvidence?.(placeholderEntry, criterion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onEdit && (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            title={locked ? 'Tiêu chí đã bị khóa' : 'Sửa bản ghi'}
                            disabled={locked || record.state === 'DA_CONG_BO'}
                            onClick={() => onEdit(placeholderEntry, criterion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
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
