import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileCheck, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { ScoreInput } from '@/features/cham-diem/components/ScoreInput';
import type { CriteriaTable, Locality } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore';
import type { Role, AuthUser } from '@/types/rbac';

export default function ScoreByCriteriaPage() {
  const { id } = useParams<{ id?: string }>();
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const scores = useScoreStore((s) => s.scores);
  const emptyRecord = useScoreStore((s) => s.emptyRecord);
  const scoreCriterion = useScoreStore((s) => s.scoreCriterion);
  const submit = useScoreStore((s) => s.submit);

  const table = useMemo(() => criteriaTables.find((t) => t.id === id), [criteriaTables, id]);

  if (!id) {
    return (
      <div className="space-y-6">
        <PageHeader title={LABELS.SCORE_GRID_TITLE} description="Chọn bảng tiêu chí để bắt đầu chấm điểm." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {criteriaTables.map((t) => (
            <Card key={t.id} className="hover:border-primary/50 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{t.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Tổng điểm: {t.totalScore}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link to={ROUTES.CHAM_DIEM_BY_CRITERIA.replace(':id', t.id)} />}
                  nativeButton={false}
                >
                  Chấm điểm
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <EmptyState
        title="Không tìm thấy bảng tiêu chí"
        description="Bảng tiêu chí không tồn tại hoặc đã bị xóa."
        icon={<AlertCircle className="h-8 w-8" />}
      />
    );
  }

  const assignedIds = assignments[table.id] ?? [];
  const assignedLocalities = localities.filter((l) => assignedIds.includes(l.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${LABELS.SCORE_GRID_TITLE}: ${table.name}`}
        description={`Nhập điểm cho từng địa phương theo tiêu chí (tối đa ${table.totalScore} điểm).`}
        actions={
          <Button
            variant="outline"
            render={<Link to={ROUTES.DASHBOARD_OVERVIEW} />}
            nativeButton={false}
          >
            <ArrowLeft className="h-4 w-4 ml-2" /> Quay lại
          </Button>
        }
      />

      {assignedLocalities.length === 0 ? (
        <EmptyState
          title="Chưa gán địa phương"
          description="Bảng tiêu chí này chưa được gán địa phương nào."
          icon={<FileCheck className="h-8 w-8" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Địa phương</TableHead>
                  {table.criteria.map((c) => (
                    <TableHead key={c.id} className="text-center min-w-[120px]">
                      <div className="text-xs font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">tối đa {c.maxScore}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Tổng</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedLocalities.map((loc) => (
                  <ScoreRow
                    key={loc.id}
                    table={table}
                    locality={loc}
                    record={scores[table.id]?.[loc.id] ?? emptyRecord}
                    user={user}
                    scoreCriterion={scoreCriterion}
                    submit={submit}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreRow({
  table,
  locality,
  record,
  user,
  scoreCriterion,
  submit,
}: {
  table: CriteriaTable;
  locality: Locality;
  record: ScoreRecord;
  user: AuthUser | null;
  scoreCriterion: (tableId: string, localityId: string, criteriaId: string, value: number, scoredBy: string, actorRole: Role) => void;
  submit: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
}) {
  const editable = record.state === 'DRAFT';

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div>{locality.name}</div>
        <div className="text-xs text-muted-foreground">{locality.region}</div>
      </TableCell>
      {table.criteria.map((c) => {
        const entry = record.entries.find((e) => e.criteriaId === c.id);
        const value = entry?.value ?? '';
        return (
          <TableCell key={c.id} className="text-center">
            <ScoreInput
              value={value}
              max={c.maxScore}
              disabled={!editable}
              onChange={(v) => {
                if (!user) return;
                scoreCriterion(table.id, locality.id, c.id, v, user.name, user.role);
              }}
            />
          </TableCell>
        );
      })}
      <TableCell className="text-center font-semibold tabular-nums">{record.totalScore}</TableCell>
      <TableCell className="text-center">
        <Badge variant={record.state === 'DA_CONG_BO' ? 'success' : record.state !== 'DRAFT' ? 'info' : 'secondary'}>
          {record.state}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {record.state === 'DRAFT' && record.totalScore > 0 && (
          <Button
            size="sm"
            action="submit"
            state="DRAFT"
            onClick={() => {
              if (!user) return;
              submit(table.id, locality.id, user.name, user.role);
              toast.success('Đã nộp bảng điểm cho địa phương');
            }}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Nộp
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
