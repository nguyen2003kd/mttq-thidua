import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { AuditTimeline, FilterSelect, PageHeader } from '@/components/core';
import { Input } from '@/components/ui/input';
import { LABELS } from '@/constants/labels';
import type { AuditEntry } from '@/types/domain';
import { parseAuditField, tableOfCriteria } from './auditFilter';

export default function AuditLogPage() {
  const { diaPhuongId } = useParams<{ diaPhuongId?: string }>();
  const navigate = useNavigate();
  const audits = useScoreStore((s) => s.audits);
  const localities = useScoreStore((s) => s.localities);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);

  const [tableId, setTableId] = useState('');
  const [criteriaId, setCriteriaId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const localityId = diaPhuongId ?? '';

  const setLocality = (id: string) => {
    navigate(id ? `/thi-dua/lich-su-thay-doi/${id}` : '/thi-dua/lich-su-thay-doi', { replace: true });
  };

  const tableOptions = useMemo(
    () => criteriaTables.map((t) => ({ value: t.id, label: t.name })),
    [criteriaTables],
  );
  const selectedTable = criteriaTables.find((t) => t.id === tableId);
  const criteriaOptions = useMemo(
    () => (selectedTable?.criteria ?? []).map((c) => ({ value: c.id, label: c.name })),
    [selectedTable],
  );

  const onTableChange = (id: string) => {
    setTableId(id);
    const table = criteriaTables.find((t) => t.id === id);
    if (!id || !table?.criteria.some((c) => c.id === criteriaId)) setCriteriaId('');
  };

  const parsed = useMemo(
    () => audits.map((entry) => ({ entry, ...parseAuditField(entry.fieldName) })),
    [audits],
  );

  const data = useMemo(() => parsed
    .filter(({ entry, criteriaId: cId, localityId: lId }) => {
      if (localityId && lId !== localityId) return false;
      if (tableId) {
        if (!cId || tableOfCriteria(cId, criteriaTables)?.id !== tableId) return false;
      }
      if (criteriaId && cId !== criteriaId) return false;
      const day = entry.timestamp.slice(0, 10);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    })
    .map(({ entry }) => entry), [parsed, localityId, tableId, criteriaId, dateFrom, dateTo, criteriaTables]);

  const context = (entry: AuditEntry) => {
    const { criteriaId: cId, localityId: lId } = parseAuditField(entry.fieldName);
    const criterion = cId ? criteriaTables.flatMap((t) => t.criteria).find((c) => c.id === cId) : undefined;
    const locality = localities.find((l) => l.id === lId);
    return [
      criterion ? `Tiêu chí "${criterion.name}"` : 'Hồ sơ',
      locality?.name,
    ].filter(Boolean).join(' · ') || undefined;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={LABELS.AUDIT_TIMELINE_TITLE}
        description={localityId
          ? `Lịch sử thay đổi của địa phương ${localities.find((l) => l.id === localityId)?.name ?? localityId}.`
          : 'Lịch sử thay đổi toàn hệ thống — lọc theo địa phương, nhóm tiêu chí hoặc tiêu chí.'}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
        <FilterSelect
          label="Địa phương"
          value={localityId}
          onChange={setLocality}
          allLabel="Tất cả địa phương"
          options={localities.map((l) => ({ value: l.id, label: l.name }))}
        />
        <FilterSelect
          label="Nhóm tiêu chí"
          value={tableId}
          onChange={onTableChange}
          allLabel="Tất cả nhóm"
          options={tableOptions}
        />
        <FilterSelect
          label="Tiêu chí"
          value={criteriaId}
          onChange={setCriteriaId}
          allLabel="Tất cả tiêu chí"
          options={criteriaOptions}
        />
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Từ ngày"
            className="!h-9 w-[140px] rounded-lg border px-2.5 text-[13px]"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Đến ngày"
            className="!h-9 w-[140px] rounded-lg border px-2.5 text-[13px]"
          />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{data.length} thay đổi</span>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <AuditTimeline entries={data} context={context} />
      </div>
    </div>
  );
}
