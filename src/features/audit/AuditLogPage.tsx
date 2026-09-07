import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, DataTable, ActionBadge } from '@/components/core';
import { formatDateTime } from '@/lib/utils';
import { LABELS } from '@/constants/labels';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditEntry } from '@/types/domain';

export default function AuditLogPage() {
  const { diaPhuongId } = useParams<{ diaPhuongId?: string }>();
  const audits = useScoreStore((s) => s.audits);

  const data = useMemo(() => {
    if (!diaPhuongId) return audits;
    return audits.filter((a) => a.fieldName.endsWith(` - ${diaPhuongId}`));
  }, [audits, diaPhuongId]);

  const columns = useMemo<ColumnDef<AuditEntry>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: LABELS.AUDIT_TIMESTAMP,
        cell: ({ row }) => formatDateTime(row.original.timestamp),
      },
      {
        accessorKey: 'actorName',
        header: LABELS.AUDIT_ACTOR,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.actorName}</p>
            <p className="text-xs text-muted-foreground">{row.original.actorRole}</p>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: LABELS.AUDIT_ACTION,
        cell: ({ row }) => <ActionBadge action={row.original.action} />,
      },
      { accessorKey: 'fieldName', header: 'Đối tượng' },
      {
        accessorKey: 'oldValue',
        header: LABELS.AUDIT_OLD_VALUE,
        cell: ({ row }) => row.original.oldValue ?? '—',
      },
      {
        accessorKey: 'newValue',
        header: LABELS.AUDIT_NEW_VALUE,
        cell: ({ row }) => <span className="font-medium">{row.original.newValue}</span>,
      },
      {
        accessorKey: 'reason',
        header: LABELS.REASON,
        cell: ({ row }) => row.original.reason ?? '—',
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={LABELS.AUDIT_TIMELINE_TITLE}
        description={diaPhuongId ? `Lịch sử thay đổi của địa phương ${diaPhuongId}` : 'Lịch sử thay đổi toàn hệ thống.'}
      />
      <DataTable
        data={data}
        columns={columns}
        searchable
        searchKey="fieldName"
        searchPlaceholder="Tìm theo đối tượng..."
        pageSize={10}
        className="overflow-auto"
      />
    </div>
  );
}
