import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { ArrowLeft, Send, FileCheck, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function ScoreInput({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number | '';
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Input
      type="number"
      min={0}
      max={max}
      value={value}
      onChange={(e) => {
        const raw = e.target.value === '' ? '' : Number(e.target.value);
        if (raw === '') {
          onChange(0);
          return;
        }
        onChange(Math.max(0, Math.min(Number(raw), max)));
      }}
      disabled={disabled}
      className="w-20 text-center"
    />
  );
}

export default function ScoreByLocalityPage() {
  const { id } = useParams<{ id?: string }>();
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const getScore = useScoreStore((s) => s.getScore);
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
                  <p className="text-sm text-muted-foreground mb-4">{l.district}</p>
                  {assigned ? (
                    <Link
                      to={ROUTES.CHAM_DIEM_BY_LOCALITY.replace(':id', l.id)}
                      className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                    >
                      Chấm điểm
                    </Link>
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

  const record = getScore(table.id, locality.id);
  const editable = record.state === 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chấm điểm: ${locality.name}`}
        description={`Bảng ${table.name} — tối đa ${table.totalScore} điểm.`}
        actions={
          <Link to={ROUTES.DASHBOARD_OVERVIEW} className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Link>
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
                          scoreCriterion(table.id, locality.id, c.id, v, user.name);
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
            <Send className="h-4 w-4 mr-2" /> Nộp
          </Button>
        )}
      </div>
    </div>
  );
}
