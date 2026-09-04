import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { ArrowLeft, Send, FileCheck, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScoreInput } from '@/features/cham-diem/components/ScoreInput';

export default function ScoreByLocalityPage() {
  const { id } = useParams<{ id?: string }>();
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const scores = useScoreStore((s) => s.scores);
  const emptyRecord = useScoreStore((s) => s.emptyRecord);
  const scoreCriterion = useScoreStore((s) => s.scoreCriterion);
  const submit = useScoreStore((s) => s.submit);

  const table = useMemo(() => criteriaTables[0], [criteriaTables]);
  const locality = useMemo(() => localities.find((l) => l.id === id), [localities, id]);

  if (!id) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chấm điểm theo địa phương" description="Chọn địa phương để chấm điểm." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localities.map((l) => {
            const assigned = table ? assignments[table.id]?.includes(l.id) : false;
            return (
              <Card key={l.id} className={assigned ? '' : 'opacity-60'}>
                <CardHeader>
                  <CardTitle className="text-base">{l.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{l.region}</p>
                  {assigned ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      render={<Link to={ROUTES.CHAM_DIEM_BY_LOCALITY.replace(':id', l.id)} />}
                      nativeButton={false}
                    >
                      Chấm điểm
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Chưa được gán bảng tiêu chí.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (!locality || !table) {
    return (
      <EmptyState
        title="Không tìm thấy"
        description="Địa phương hoặc bảng tiêu chí không hợp lệ."
        icon={<AlertCircle className="h-8 w-8" />}
      />
    );
  }

  const assigned = assignments[table.id]?.includes(locality.id);
  if (!assigned) {
    return (
      <EmptyState
        title="Chưa gán bảng tiêu chí"
        description="Địa phương này chưa được gán bảng tiêu chí nào."
        icon={<FileCheck className="h-8 w-8" />}
      />
    );
  }

  const record = scores[table.id]?.[locality.id] ?? emptyRecord;
  const editable = record.state === 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chấm điểm: ${locality.name}`}
        description={`Bảng ${table.name} — tối đa ${table.totalScore} điểm.`}
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
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu chí</TableHead>
                <TableHead className="text-center">Điểm tối đa</TableHead>
                <TableHead className="text-center">Điểm đạt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.criteria.map((c) => {
                const entry = record.entries.find((e) => e.criteriaId === c.id);
                const value = entry?.value ?? '';
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-center">{c.maxScore}</TableCell>
                    <TableCell className="text-center">
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant={record.state === 'DA_CONG_BO' ? 'success' : record.state !== 'DRAFT' ? 'info' : 'secondary'}>
            {record.state}
          </Badge>
          <span className="text-sm font-semibold">Tổng điểm: {record.totalScore} / {table.totalScore}</span>
        </div>
        {editable && record.totalScore > 0 && (
          <Button
            action="submit"
            state="DRAFT"
            onClick={() => {
              if (!user) return;
              submit(table.id, locality.id, user.name, user.role);
              toast.success('Đã nộp bảng điểm');
            }}
          >
            <Send className="h-4 w-4 ml-2" /> Nộp
          </Button>
        )}
      </div>
    </div>
  );
}
