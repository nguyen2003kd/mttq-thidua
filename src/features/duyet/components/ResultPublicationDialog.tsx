import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FileUpload } from '@/components/core';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { periodsApi } from '@/features/admin/api/periodsApi';
import { resultPublicationApi } from '../api/resultPublicationApi';

interface ResultPublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UnsubmittedCriteriaGroup {
  wardCode: string;
  wardName: string;
  criteriaGroupName: string;
}

interface UnsubmittedLocality {
  wardCode: string;
  wardName: string;
  criteriaGroupNames: string[];
}

function groupUnsubmittedByLocality(groups: UnsubmittedCriteriaGroup[]): UnsubmittedLocality[] {
  const byWardCode = new Map<string, UnsubmittedLocality>();
  for (const group of groups) {
    const locality = byWardCode.get(group.wardCode) ?? {
      wardCode: group.wardCode,
      wardName: group.wardName,
      criteriaGroupNames: [],
    };
    locality.criteriaGroupNames.push(group.criteriaGroupName);
    byWardCode.set(group.wardCode, locality);
  }

  return Array.from(byWardCode.values())
    .map((locality) => ({ ...locality, criteriaGroupNames: locality.criteriaGroupNames.sort((a, b) => a.localeCompare(b, 'vi')) }))
    .sort((a, b) => a.wardName.localeCompare(b.wardName, 'vi'));
}

export function ResultPublicationDialog({ open, onOpenChange }: ResultPublicationDialogProps) {
  const queryClient = useQueryClient();
  const [periodId, setPeriodId] = useState('');
  const [publicationNote, setPublicationNote] = useState('');
  const [publicationFile, setPublicationFile] = useState<File[]>([]);
  const [publicationError, setPublicationError] = useState<string | null>(null);

  const periodsQuery = useQuery({
    queryKey: ['publication-periods'],
    queryFn: periodsApi.listAll,
    enabled: open,
  });
  const periods = periodsQuery.data ?? [];
  const selectablePeriods = periods.filter((period) => period.status !== 'Draft');
  const defaultPeriodId = selectablePeriods.find((period) => period.status === 'Active')?.id ?? selectablePeriods[0]?.id ?? '';
  const selectedPeriod = selectablePeriods.find((period) => period.id === periodId);

  useEffect(() => {
    if (open && !selectablePeriods.some((period) => period.id === periodId))
      setPeriodId(defaultPeriodId);
  }, [defaultPeriodId, open, periodId, selectablePeriods]);

  const previewQuery = useQuery({
    queryKey: ['result-publication-preview', periodId],
    queryFn: () => resultPublicationApi.getPreview(periodId),
    enabled: open && Boolean(periodId),
  });
  const criteriaGroupsQuery = useQuery({
    queryKey: ['result-publication-criteria-groups', periodId],
    queryFn: () => resultPublicationApi.getCriteriaGroups(periodId),
    enabled: open && Boolean(periodId),
  });
  const unsubmittedGroups = criteriaGroupsQuery.data?.flatMap((group) =>
    group.localities
      .filter((locality) => locality.status === 'NotSubmitted')
      .map((locality) => ({
        criteriaGroupName: group.name,
        wardCode: locality.wardCode,
        wardName: locality.wardName,
      })),
  ) ?? [];
  const unsubmittedByLocality = groupUnsubmittedByLocality(unsubmittedGroups);
  const unpublishedByLocality = groupUnsubmittedByLocality(
    previewQuery.data?.unpublishedLocalityGroups.map((item) => ({
      wardCode: item.wardCode,
      wardName: item.wardName,
      criteriaGroupName: item.criteriaGroupName,
    })) ?? [],
  );

  const close = () => {
    onOpenChange(false);
    setPublicationError(null);
  };

  const publishMutation = useMutation({
    mutationFn: async ({ periodId: targetPeriodId, note, file }: { periodId: string; note: string; file: File | null }) => {
      return resultPublicationApi.publish(targetPeriodId, note, file);
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['result-publication-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['result-publication-criteria-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['result-publication-preview'] }),
        queryClient.invalidateQueries({ queryKey: ['committee-submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['local-result-publication'] }),
      ]);
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border bg-muted/25 px-6 py-5 pr-12">
          <DialogTitle>Xác nhận công bố kết quả</DialogTitle>
          <DialogDescription>
            Kết quả sẽ chỉ được công bố cho kỳ thi đua đã chọn, khi tất cả địa phương hoàn tất các nhóm tiêu chí trong kỳ đó.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {periodsQuery.isLoading ? (
              <div className="py-3 text-sm text-muted-foreground">Đang tải danh sách kỳ thi đua…</div>
            ) : selectablePeriods.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="publication-period">Kỳ thi đua <span className="text-destructive">★</span></Label>
                <Select
                  value={periodId}
                  onValueChange={(value) => { setPeriodId(value ?? ''); setPublicationError(null); }}
                  itemToStringLabel={(id) => selectablePeriods.find((period) => period.id === id)?.name ?? 'Kỳ thi đua'}
                  disabled={publishMutation.isPending}
                >
                  <SelectTrigger id="publication-period"><SelectValue placeholder="Chọn kỳ thi đua" /></SelectTrigger>
                  <SelectContent>
                    {selectablePeriods.map((period) => <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">Chưa có kỳ thi đua đang hoạt động hoặc đã kết thúc để công bố.</p>
            )}

            {periodId && (previewQuery.isLoading ? (
              <div className="py-3 text-sm text-muted-foreground">Đang chuẩn bị dữ liệu xem trước…</div>
            ) : previewQuery.isError ? (
              <p className="text-sm text-destructive">Không tải được điều kiện công bố cho kỳ thi đua này.</p>
            ) : previewQuery.data ? (
              <>
                <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>{previewQuery.data.message}</p>
                </div>

                {criteriaGroupsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Đang kiểm tra địa phương chưa nộp…</p>
                ) : criteriaGroupsQuery.isError ? (
                  <p className="text-sm text-destructive">Không tải được danh sách địa phương và nhóm tiêu chí chưa nộp.</p>
                ) : unsubmittedByLocality.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Địa phương chưa nộp ({unsubmittedByLocality.length} địa phương, {unsubmittedGroups.length} nhóm tiêu chí)</p>
                    <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
                      {unsubmittedByLocality.map((locality) => (
                        <li key={locality.wardCode} className="px-3 py-2 text-sm">
                          <p className="font-semibold">{locality.wardName || 'Địa phương chưa xác định tên'}</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                            {locality.criteriaGroupNames.map((groupName, index) => (
                              <li key={`${locality.wardCode}-${index}`}>{groupName}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {unpublishedByLocality.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Nhóm tiêu chí chưa đủ điều kiện công bố ({unpublishedByLocality.length} địa phương, {previewQuery.data.unpublishedLocalityGroups.length} nhóm tiêu chí)</p>
                    <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
                      {unpublishedByLocality.map((locality) => (
                        <li key={locality.wardCode} className="px-3 py-2 text-sm">
                          <p className="font-semibold">{locality.wardName || 'Địa phương chưa xác định tên'}</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                            {locality.criteriaGroupNames.map((groupName, index) => (
                              <li key={`${locality.wardCode}-${index}`}>{groupName}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="publication-note">Nội dung nhận xét chung <span className="text-destructive">★</span></Label>
                  <Textarea
                    id="publication-note"
                    value={publicationNote}
                    onChange={(event) => {
                      setPublicationNote(event.target.value);
                      if (publicationError) setPublicationError(null);
                    }}
                    placeholder={`Nhập nhận xét chung về phong trào thi đua kỳ ${selectedPeriod?.name ?? ''}…`}
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
              </>
            ) : null)}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-[8px] border-t border-border px-6 py-4">
          <Button variant="outline" onClick={close} disabled={publishMutation.isPending}>Hủy</Button>
          <Button
           
            disabled={!periodId || !previewQuery.data?.canPublish || publishMutation.isPending}
            onClick={submitPublication}
          >
            <Send className="mr-1.5 size-4" />{publishMutation.isPending ? 'Đang lưu và gửi…' : 'Lưu và gửi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
