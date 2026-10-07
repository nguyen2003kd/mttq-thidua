import { useState } from 'react';
import { Eye, FileText, LockKeyhole, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, TableColumnVisibility } from '@/components/core';
import { SortableTableHead } from '@/components/core/SortableTableHead';
import { TableSortSelect, type TableSortOption } from '@/components/core/TableSortSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sortTableRows, toggleTableSort, type TableSortState } from '@/lib/tableSorting';
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
  const [sort, setSort] = useState<TableSortState>(null);
  const sortedRows = sortTableRows(rows, sort, {
    proposed: (row) => row.entry?.isSupplementary ? null : row.entry?.proposedScore ?? null,
    bonus: (row) => row.entry?.isSupplementary ? null : row.entry?.proposedBonusScore ?? 0,
    maximum: (row) => row.criterion?.maxScore ?? row.entry?.supplementaryMaxScore ?? null,
    current: (row) => row.entry?.value ?? null,
  });
  const sortOptions: TableSortOption[] = [
    { value: 'proposed-desc', label: 'Điểm đề xuất cao nhất', sort: { column: 'proposed', direction: 'desc' } },
    { value: 'bonus-desc', label: 'Điểm thưởng cao nhất', sort: { column: 'bonus', direction: 'desc' } },
    { value: 'maximum-desc', label: 'Điểm tối đa cao nhất', sort: { column: 'maximum', direction: 'desc' } },
    ...(mode !== 'locality' ? [{ value: 'current-desc', label: 'Điểm hiện tại cao nhất', sort: { column: 'current', direction: 'desc' as const } }] : []),
  ];
  const columnOptions = [
    { id: 'criterion', label: 'Nội dung tiêu chí' },
    { id: 'evidence', label: 'Minh chứng' },
    { id: 'proposed', label: 'Điểm đề xuất' },
    { id: 'bonus', label: 'Điểm thưởng' },
    { id: 'maximum', label: 'Điểm tối đa' },
    ...(mode !== 'locality' ? [{ id: 'current', label: 'Điểm hiện tại' }] : []),
    { id: 'explanation', label: 'Diễn giải / phản hồi' },
    ...(mode !== 'result' ? [{ id: 'actions', label: 'Thao tác' }] : []),
  ];

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap justify-end gap-2 border-b p-2">
        <TableSortSelect sort={sort} options={sortOptions} onChange={setSort} />
        <TableColumnVisibility storageKey={`criterion-grid-${mode}`} columns={columnOptions} />
      </div>
      <div className="overflow-x-auto">
        <Table data-column-visibility-table={`criterion-grid-${mode}`}>
          <TableHeader>
            <TableRow className="bg-muted/45">
              <TableHead className="min-w-[260px]">Nội dung tiêu chí</TableHead>
              <TableHead className="min-w-[160px]">Minh chứng</TableHead>
              <SortableTableHead column="proposed" label="Điểm đề xuất" ariaLabel="Điểm đề xuất" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'proposed', 'desc'))} align="center" className="text-center" buttonClassName="text-foreground hover:text-primary" />
              <SortableTableHead column="bonus" label="Điểm thưởng" ariaLabel="Điểm thưởng" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'bonus', 'desc'))} align="center" className="text-center" buttonClassName="text-foreground hover:text-primary" />
              <SortableTableHead column="maximum" label="Điểm tối đa" ariaLabel="Điểm tối đa" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'maximum', 'desc'))} align="center" className="text-center" buttonClassName="text-muted-foreground hover:text-foreground" />
              {mode !== 'locality' && <SortableTableHead column="current" label="Điểm hiện tại" ariaLabel="Điểm hiện tại" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'current', 'desc'))} align="center" className="text-center" buttonClassName="text-foreground hover:text-primary" />}
              <TableHead className="min-w-[220px]">Diễn giải / phản hồi</TableHead>
              {mode !== 'result' && <TableHead className="text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map(({ criterion, entry }) => {
              const criteriaId = criterion?.id ?? entry?.criteriaId ?? '';
              const files = evidence.filter(
                (item) => item.localityId === localityId && item.criteriaId === criteriaId,
              );
              const criterionDisabled = criterion?.status === 'Deleted' || entry?.criteriaStatus === 'Deleted';
              const locked = Boolean(criterionDisabled || entry?.locked || lockedCriteriaIds.includes(criteriaId));
              const placeholderEntry: ScoreEntry = entry ?? {
                id: `empty-${criteriaId}`,
                criteriaId,
                criteriaName: criterion?.name ?? '',
                criteriaStatus: criterion?.status,
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
                          {criterionDisabled ? <Badge variant="secondary">Vô hiệu</Badge> : locked && <Badge variant="outline">Đã khóa</Badge>}
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
                          className="text-info-foreground hover:bg-info/10 hover:text-info-foreground dark:text-info"
                          title="Xem minh chứng"
                          onClick={() => onEvidence?.(placeholderEntry, criterion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onEdit && (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground dark:text-warning"
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
