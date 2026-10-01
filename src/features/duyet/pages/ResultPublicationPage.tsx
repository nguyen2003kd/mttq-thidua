import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, History, Send, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, EmptyState, FileUpload, FilterSelect, PageHeader, PageLoading } from '@/components/core';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { periodsApi } from '@/features/admin/api/periodsApi';
import { resultPublicationApi, type ResultPublicationCriteriaGroup } from '../api/resultPublicationApi';

function GroupRow({ group }: { group: ResultPublicationCriteriaGroup }) {
  const inProgress = group.localitiesInProgress ?? Math.max(
    0,
    group.totalLocalities - group.localitiesCompleted - group.localitiesRequiresRevision - group.localitiesNotSubmitted,
  );

  return (
    <tr className="border-b align-top last:border-0 hover:bg-muted/20">
      <td className="px-4 py-3">
        <p className="font-semibold text-foreground">{group.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{group.criteriaCount} tiêu chí</p>
      </td>
      <td className="px-4 py-3 text-center font-semibold tabular-nums text-primary">{group.localitiesCompleted}</td>
      <td className="px-4 py-3 text-center font-semibold tabular-nums text-destructive">{group.localitiesRequiresRevision}</td>
      <td className="px-4 py-3 text-center font-semibold tabular-nums text-destructive">{group.localitiesNotSubmitted}</td>
      <td className="px-4 py-3 text-center font-semibold tabular-nums text-muted-foreground">{inProgress}</td>
    </tr>
  );
}

export default function ResultPublicationPage() {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { filters: { periodId }, setters: { periodId: setPeriodId } } = useQueryFilters({ periodId: '' });
  const [publicationNote, setPublicationNote] = useState('');
  const [publicationFile, setPublicationFile] = useState<File[]>([]);
  const [publicationError, setPublicationError] = useState<string | null>(null);

  const periodsQuery = useQuery({
    queryKey: ['publication-periods'],
    queryFn: periodsApi.listAll,
  });
  const selectablePeriods = (periodsQuery.data ?? []).filter((period) => period.status !== 'Draft');
  const defaultPeriodId = selectablePeriods.find((period) => period.status === 'Active')?.id ?? selectablePeriods[0]?.id ?? '';
  const selectedPeriod = selectablePeriods.find((period) => period.id === periodId);

  useEffect(() => {
    if (!selectablePeriods.some((period) => period.id === periodId))
      setPeriodId(defaultPeriodId);
  }, [defaultPeriodId, periodId, selectablePeriods, setPeriodId]);

  const overviewQuery = useQuery({
    queryKey: ['result-publication-overview', periodId],
    queryFn: () => resultPublicationApi.getOverview(periodId),
    enabled: Boolean(periodId),
    staleTime: 0,
  });
  const previewQuery = useQuery({
    queryKey: ['result-publication-preview', periodId],
    queryFn: () => resultPublicationApi.getPreview(periodId),
    enabled: previewOpen && Boolean(periodId),
    staleTime: 0,
  });

  const closePreview = () => {
    setPreviewOpen(false);
    setPublicationError(null);
  };

  const publishMutation = useMutation({
    mutationFn: async ({ periodId: targetPeriodId, note, file }: { periodId: string; note: string; file: File | null }) => {
      return resultPublicationApi.publish(targetPeriodId, note, file);
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['result-publication-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['result-publication-preview'] }),
        queryClient.invalidateQueries({ queryKey: ['committee-submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['local-result-publication'] }),
      ]);
      setPreviewOpen(false);
      setPublicationNote('');
      setPublicationFile([]);
      toast.success(`Đã công bố kết quả kỳ ${result.periodName} và gửi thông báo đến ${result.notifiedUserCount} người dùng địa phương.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể công bố kết quả. Vui lòng kiểm tra lại trạng thái dữ liệu.');
    },
  });

  const submitPublication = () => {
    const note = publicationNote.trim();
    if (!periodId) {
      setPublicationError('Vui lòng chọn kỳ thi đua cần công bố.');
      return;
    }
    if (!note) {
      setPublicationError('Vui lòng nhập nội dung nhận xét chung trước khi gửi.');
      return;
    }
    if (publicationFile.length > 1) {
      setPublicationError('Chỉ được đính kèm tối đa 1 file.');
      return;
    }
    setPublicationError(null);
    publishMutation.mutate({ periodId, note, file: publicationFile[0] ?? null });
  };

  if (periodsQuery.isLoading || (periodId && overviewQuery.isLoading)) return <PageLoading label="Đang tải tổng quan công bố kết quả…" />;
  if (!periodId) return <EmptyState title="Chưa có kỳ thi đua để công bố" description="Tạo hoặc kích hoạt một kỳ thi đua trước khi công bố kết quả." />;
  if (overviewQuery.isError || !overviewQuery.data) {
    return <EmptyState variant="error" title="Không tải được dữ liệu công bố" description="Vui lòng thử lại sau." />;
  }

  const overview = overviewQuery.data;
  const groups = overview.criteriaGroups ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Công bố kết quả thi đua"
        description={`Tổng quan trạng thái các nhóm tiêu chí trong kỳ ${selectedPeriod?.name ?? ''}.`}
        actions={
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
            <FilterSelect
              label="Kỳ thi đua"
              labelPosition="outside"
              value={periodId}
              onChange={setPeriodId}
              allLabel="Chọn kỳ thi đua"
              includeAllOption={false}
              disabled={selectablePeriods.length === 0}
              options={selectablePeriods.map((period) => ({ value: period.id, label: period.name }))}
            />
            <Button variant="outline" render={<Link to="/thi-dua/duyet/ban-thuong-truc/duyet" />} nativeButton={false}>
              <CheckCircle2 className="mr-1.5 size-4" />Duyệt theo địa phương
            </Button>
            <Button variant="outline" render={<Link to="/uy-ban/lich-su" />} nativeButton={false}>
              <History className="mr-1.5 size-4" />Lịch sử công bố
            </Button>
            <Button
             
              disabled={!periodId}
              onClick={() => setPreviewOpen(true)}
            >
              <Trophy className="mr-1.5 size-4" />Công bố kết quả
            </Button>
          </div>
        }
      />

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Tổng quan theo nhóm tiêu chí</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mỗi cột là số lượng địa phương trong tổng số địa phương của đợt, không cộng dồn theo số tiêu chí con.</p>
        </div>
        <div className="mt-5 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nhóm tiêu chí</th>
                <th className="px-4 py-3 text-center font-semibold">Đã duyệt</th>
                <th className="px-4 py-3 text-center font-semibold">Đang chỉnh sửa</th>
                <th className="px-4 py-3 text-center font-semibold">Chưa nộp</th>
                <th className="px-4 py-3 text-center font-semibold">Đang xử lý</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Chưa có nhóm tiêu chí được áp dụng.</td></tr>
              ) : groups.map((group) => <GroupRow key={group.criteriaGroupId} group={group} />)}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <div>
          <p className="font-semibold">Công bố kỳ thi đua {selectedPeriod?.name ?? ''}</p>
          <p className="mt-1 text-sm text-muted-foreground">Chỉ công bố khi các địa phương đã hoàn tất mọi nhóm tiêu chí trong kỳ đã chọn.</p>
        </div>
        <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!periodId}>
          <Send className="mr-1.5 size-4" />Xem trước công bố
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={(open) => (open ? setPreviewOpen(true) : closePreview())}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/25 px-6 py-5 pr-12">
            <DialogTitle>Xác nhận công bố kết quả</DialogTitle>
            <DialogDescription>
              Chỉ công bố kỳ {selectedPeriod?.name ?? ''} khi tất cả địa phương đã hoàn tất các nhóm tiêu chí trong kỳ đó.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {previewQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Đang chuẩn bị dữ liệu xem trước…</div>
            ) : previewQuery.data ? (
              <div className="space-y-4">
                <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>{previewQuery.data.message}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publication-note">Nội dung nhận xét chung <span className="text-destructive">★</span></Label>
                  <Textarea
                    id="publication-note"
                    value={publicationNote}
                    onChange={(event) => {
                      setPublicationNote(event.target.value);
                      if (publicationError) setPublicationError(null);
                    }}
                    placeholder="Nhập nhận xét chung về phong trào thi đua của các địa phương…"
                    rows={5}
                    disabled={publishMutation.isPending}
                    aria-invalid={Boolean(publicationError)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tệp đính kèm <span className="font-normal text-muted-foreground">(không bắt buộc, tối đa 1 tệp, mỗi tệp tối đa 20MB)</span></Label>
                  <FileUpload
                    value={publicationFile}
                    onChange={setPublicationFile}
                    multiple={false}
                    maxFiles={1}
                    maxSizeMb={20}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    disabled={publishMutation.isPending}
                    error={publicationError?.includes('file') ? publicationError : null}
                  />
                </div>

                {publicationError && !publicationError.includes('file') && <p className="text-sm font-medium text-destructive">{publicationError}</p>}
              </div>
            ) : null}
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-[8px] border-t border-border px-6 py-4">
            <Button variant="outline" onClick={closePreview} disabled={publishMutation.isPending}>Hủy</Button>
            <Button
             
              disabled={!periodId || !previewQuery.data?.canPublish || publishMutation.isPending}
              onClick={submitPublication}
            >
              <Send className="mr-1.5 size-4" />{publishMutation.isPending ? 'Đang lưu và gửi…' : 'Lưu và gửi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
