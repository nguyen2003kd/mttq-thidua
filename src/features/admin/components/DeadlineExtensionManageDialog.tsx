import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/core';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useScoreStore } from '@/store/scoreStore';
import { criteriaGroupsApi, getCriteriaApiError } from '@/features/admin/api/criteriaGroupsApi';
import { toVietnamDateTimeInput, toVietnamOffsetDateTime } from '@/lib/vietnamDateTime';

interface DeadlineExtensionManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: { id: string; name: string; deadline?: string | null } | null;
}

const toLocalInputValue = toVietnamDateTimeInput;

function formatDeadline(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN');
}

/** Dialog quản lý gia hạn nộp của một nhóm tiêu chí cho từng địa phương — dành cho ADMIN. */
export function DeadlineExtensionManageDialog({ open, onOpenChange, group }: DeadlineExtensionManageDialogProps) {
  const queryClient = useQueryClient();
  const localities = useScoreStore((state) => state.localities);
  const [wardCode, setWardCode] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reason, setReason] = useState('');

  const groupId = group?.id;
  const extensionsKey = ['deadline-extensions', groupId];

  const extensionsQuery = useQuery({
    queryKey: extensionsKey,
    queryFn: () => criteriaGroupsApi.listDeadlineExtensions(groupId!),
    enabled: open && Boolean(groupId),
  });
  const extensions = useMemo(() => extensionsQuery.data ?? [], [extensionsQuery.data]);

  const sortedLocalities = useMemo(
    () => [...localities].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [localities]
  );

  useEffect(() => {
    if (!open) return;
    setWardCode('');
    setDeadline('');
    setReason('');
  }, [open, groupId]);

  // Chọn địa phương đã có gia hạn → điền sẵn để chỉnh sửa
  useEffect(() => {
    const existing = extensions.find((item) => item.wardCode === wardCode);
    if (existing) {
      setDeadline(toLocalInputValue(existing.extendedDeadline));
      setReason(existing.reason ?? '');
    }
  }, [wardCode, extensions]);

  const upsertMutation = useMutation({
    mutationFn: (payload: { wardCode: string; extendedDeadline: string; reason?: string }) =>
      criteriaGroupsApi.upsertDeadlineExtension(groupId!, payload),
    onSuccess: () => {
      toast.success('Đã lưu gia hạn nộp cho địa phương.');
      void queryClient.invalidateQueries({ queryKey: extensionsKey });
    },
    onError: (error) => toast.error(getCriteriaApiError(error)),
  });

  const revokeMutation = useMutation({
    mutationFn: (code: string) => criteriaGroupsApi.deleteDeadlineExtension(groupId!, code),
    onSuccess: (_data, code) => {
      toast.success('Đã thu hồi gia hạn nộp.');
      void queryClient.invalidateQueries({ queryKey: extensionsKey });
      if (code === wardCode) {
        setDeadline('');
        setReason('');
      }
    },
    onError: (error) => toast.error(getCriteriaApiError(error)),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!wardCode || !deadline) return;
    upsertMutation.mutate({
      wardCode,
      extendedDeadline: toVietnamOffsetDateTime(deadline)!,
      reason: reason.trim() || undefined,
    });
  };

  const pending = upsertMutation.isPending || revokeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" /> Gia hạn nộp cho địa phương
          </DialogTitle>
          <DialogDescription>
            {group?.name}
            {group?.deadline ? ` · Hạn gốc: ${formatDeadline(group.deadline)}` : ' · Chưa có hạn nộp'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="ext-ward">Địa phương <span className="text-destructive">★</span></Label>
            <Select value={wardCode} onValueChange={(value) => setWardCode(value ?? '')}>
              <SelectTrigger id="ext-ward">
                <SelectValue placeholder="Chọn địa phương" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {sortedLocalities.map((locality) => (
                  <SelectItem key={locality.code} value={locality.code}>{locality.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ext-date">Hạn nộp mới <span className="text-destructive">★</span></Label>
              <Input id="ext-date" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-reason">Lý do gia hạn</Label>
              <Textarea id="ext-reason" rows={1} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Địa phương gặp sự cố" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !wardCode || !deadline}>
              {upsertMutation.isPending ? 'Đang lưu…' : 'Lưu gia hạn'}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Đang gia hạn ({extensions.length})</p>
          {extensionsQuery.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Đang tải…</p>
          ) : extensions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Chưa có địa phương nào được gia hạn.</p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {extensions.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{item.localityName ?? item.wardCode}</p>
                    <p className="text-xs text-muted-foreground">
                      Đến {formatDeadline(item.extendedDeadline)}
                      {item.reason ? ` · ${item.reason}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    disabled={pending}
                    onClick={() => revokeMutation.mutate(item.wardCode)}
                  >
                    <Trash2 className="size-4" /> Thu hồi
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
