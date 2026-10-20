import { useState } from 'react';
import { Eye, FileText, LockKeyhole, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, TableColumnVisibility } from '@/components/core';
import { SortableTableHead } from '@/components/core/SortableTableHead';
import { TableSortSelect, type TableSortOption } from '@/components/core/TableSortSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sortTableRows, toggleTableSort, type TableSortState } from '@/lib/tableSorting';
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
  const [sort, setSort] = useState<TableSortState>(null);
  const sortedRows = sortTableRows(rows, sort, {
    proposed: (row) => row.entry?.isSupplementary ? null : row.entry?.proposedScore ?? null,
    bonus: (row) => row.entry?.isSupplementary ? null : row.entry?.proposedBonusScore ?? 0,
    maximum: (row) => row.criterion?.maxScore ?? row.entry?.supplementaryMaxScore ?? null,
    maximumBonus: (row) => row.criterion?.bonusScore ?? 0,
    official: (row) => row.entry?.value ?? null,
  });
  const sortOptions: TableSortOption[] = [
    { value: 'proposed-desc', label: 'Điểm đề xuất cao nhất', sort: { column: 'proposed', direction: 'desc' } },
    { value: 'bonus-desc', label: 'Điểm thưởng đề xuất cao nhất', sort: { column: 'bonus', direction: 'desc' } },
    { value: 'maximum-desc', label: 'Điểm tối đa cao nhất', sort: { column: 'maximum', direction: 'desc' } },
    { value: 'maximumBonus-desc', label: 'Điểm thưởng tối đa cao nhất', sort: { column: 'maximumBonus', direction: 'desc' } },
    ...(mode !== 'locality' ? [{ value: 'official-desc', label: 'Điểm chính thức cao nhất', sort: { column: 'official', direction: 'desc' as const } }] : []),
  ];
  const columnOptions = [
    { id: 'criterion', label: 'Nội dung tiêu chí' },
    { id: 'evidence', label: 'Minh chứng' },
    { id: 'proposed', label: 'Điểm đề xuất' },
    { id: 'bonus', label: 'Điểm thưởng đề xuất' },
    { id: 'maximum', label: 'Điểm tối đa' },
    { id: 'maximum-bonus', label: 'Điểm thưởng tối đa' },
    { id: 'explanation', label: 'Nội dung diễn giải' },
    ...(mode !== 'locality' ? [{ id: 'official', label: 'Điểm chính thức' }] : []),
    ...(mode === 'specialist' ? [{ id: 'reason', label: 'Lý do' }] : []),
    ...(mode !== 'result' ? [{ id: 'actions', label: 'Thao tác' }] : []),
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap justify-end gap-2 border-b p-2">
        <TableSortSelect sort={sort} options={sortOptions} onChange={setSort} />
        <TableColumnVisibility storageKey={`score-group-input-${mode}`} columns={columnOptions} />
      </div>
      <div className="overflow-x-auto">
        <Table data-column-visibility-table={`score-group-input-${mode}`}>
          <TableHeader>
            <TableRow className="bg-muted/70">
              <TableHead className="min-w-[230px]">Nội dung tiêu chí</TableHead>
              <TableHead className="min-w-[120px]">Minh chứng</TableHead>
              <SortableTableHead column="proposed" label="Điểm đề xuất" ariaLabel="Điểm đề xuất" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'proposed', 'desc'))} align="right" className="text-right" buttonClassName="text-foreground hover:text-primary" />
              <SortableTableHead column="bonus" label="Điểm thưởng đề xuất" ariaLabel="Điểm thưởng đề xuất" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'bonus', 'desc'))} align="right" className="text-right" buttonClassName="text-foreground hover:text-primary" />
              <SortableTableHead column="maximum" label="Điểm tối đa ◎" ariaLabel="Điểm tối đa" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'maximum', 'desc'))} align="right" className="text-right" buttonClassName="text-muted-foreground hover:text-foreground" />
              <SortableTableHead column="maximumBonus" label="Điểm thưởng tối đa ◎" ariaLabel="Điểm thưởng tối đa" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'maximumBonus', 'desc'))} align="right" className="text-right" buttonClassName="text-muted-foreground hover:text-foreground" />
              <TableHead className="min-w-[220px]">Nội dung diễn giải</TableHead>
              {mode !== 'locality' && <SortableTableHead column="official" label="Điểm chính thức" ariaLabel="Điểm chính thức" sort={sort} onSort={() => setSort((current) => toggleTableSort(current, 'official', 'desc'))} align="right" className="text-right" buttonClassName="text-foreground hover:text-primary" />}
              {mode === 'specialist' && <TableHead className="min-w-[180px]">Lý do</TableHead>}
              {mode !== 'result' && <TableHead className="text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map(({ criterion, entry }) => {
              const criteriaId = criterion?.id ?? entry?.criteriaId ?? '';
              const files = evidence.filter((item) => item.localityId === localityId && item.criteriaId === criteriaId);
              const criterionDisabled = criterion?.status === 'Deleted' || entry?.criteriaStatus === 'Deleted';
              const locked = Boolean(criterionDisabled || entry?.locked || lockedCriteriaIds.includes(criteriaId));
              const placeholder: ScoreEntry = entry ?? { id: `empty-${criteriaId}`, criteriaId, criteriaName: criterion?.name ?? '', criteriaStatus: criterion?.status, value: 0, state: record.state, scoredBy: '', scoredAt: '', evidenceCount: files.length };
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
                          {criterionDisabled ? <Badge variant="secondary">Vô hiệu</Badge> : locked && <Badge variant="outline">Đã khóa ◎</Badge>}
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
                        <Button size="icon-xs" variant="ghost" className="text-info-foreground hover:bg-info/10 hover:text-info-foreground dark:text-info" title="Xem minh chứng" onClick={(event) => { event.stopPropagation(); onEvidence?.(placeholder, criterion); }}><Eye className="size-4" /></Button>
                        {onEdit && <Button size="icon-xs" variant="ghost" className="text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground dark:text-warning" title={locked ? 'Tiêu chí đã khóa' : 'Sửa điểm'} disabled={locked || record.state === 'DA_CONG_BO'} onClick={(event) => { event.stopPropagation(); onEdit(placeholder, criterion); }}><Pencil className="size-4" /></Button>}
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
