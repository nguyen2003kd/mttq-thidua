import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FileUpload } from '@/components/core';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { resultPublicationApi } from '../api/resultPublicationApi';

interface ResultPublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResultPublicationDialog({ open, onOpenChange }: ResultPublicationDialogProps) {
  const queryClient = useQueryClient();
  const [publicationNote, setPublicationNote] = useState('');
  const [publicationFile, setPublicationFile] = useState<File[]>([]);
  const [publicationError, setPublicationError] = useState<string | null>(null);

  const previewQuery = useQuery({
    queryKey: ['result-publication-preview'],
    queryFn: resultPublicationApi.getPreview,
    enabled: open,
  });

  const close = () => {
    onOpenChange(false);
    setPublicationError(null);
  };

  const publishMutation = useMutation({
    mutationFn: async ({ note, file }: { note: string; file: File | null }) => {
      return resultPublicationApi.publish(note, file);
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['result-publication-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['result-publication-preview'] }),
        queryClient.invalidateQueries({ queryKey: ['committee-submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['local-result-publication'] }),
      ]);
      onOpenChange(false);
      setPublicationNote('');
      setPublicationFile([]);
      toast.success(`Đã công bố kết quả và gửi thông báo đến ${result.notifiedUserCount} người dùng địa phương.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể công bố kết quả. Vui lòng kiểm tra lại trạng thái dữ liệu.');
    },
  });

  const submitPublication = () => {
    const note = publicationNote.trim();
    if (!note) {
      setPublicationError('Vui lòng nhập nội dung nhận xét chung trước khi gửi.');
      return;
    }
    if (publicationFile.length > 1) {
      setPublicationError('Chỉ được đính kèm tối đa 1 file.');
      return;
    }
    setPublicationError(null);
    publishMutation.mutate({ note, file: publicationFile[0] ?? null });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border bg-muted/25 px-6 py-5 pr-12">
          <DialogTitle>Xác nhận công bố kết quả</DialogTitle>
          <DialogDescription>
            Chỉ có thể công bố khi tất cả hồ sơ của tất cả địa phương đã được hội đồng chấm. Công bố có thể thực hiện lại sau khi dữ liệu thay đổi.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {previewQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Đang chuẩn bị dữ liệu xem trước…</div>
          ) : previewQuery.data ? (
            <div className="space-y-4">
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
                <Label>File đính kèm <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label>
                <FileUpload
                  value={publicationFile}
                  onChange={setPublicationFile}
                  multiple={false}
                  maxFiles={1}
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
          <Button variant="outline" onClick={close} disabled={publishMutation.isPending}>Hủy</Button>
          <Button
            className="bg-accent text-foreground hover:bg-accent/90"
            disabled={!previewQuery.data?.canPublish || publishMutation.isPending}
            onClick={submitPublication}
          >
            <Send className="mr-1.5 size-4" />{publishMutation.isPending ? 'Đang lưu và gửi…' : 'Lưu và gửi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
