import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, DataTable } from '@/components/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { ACTION_LABELS } from '@/constants/enums';
import { LABELS } from '@/constants/labels';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditEntry } from '@/types/domain';

const actionVariant: Record<AuditEntry['action'], 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  SCORE: 'info',
  EDIT: 'warning',
  APPROVE: 'success',
  REJECT: 'destructive',
  PUBLISH: 'success',
};

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
        cell: ({ row }) => (
          <Badge variant={actionVariant[row.original.action]}>{ACTION_LABELS[row.original.action]}</Badge>
        ),
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
      <Card>
        <CardContent className="p-0 overflow-auto">
          <DataTable
            data={data}
            columns={columns}
            searchable
            searchKey="fieldName"
            searchPlaceholder="Tìm theo đối tượng..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
