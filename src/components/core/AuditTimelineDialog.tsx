import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './Button';
import { AuditTimeline } from './AuditTimeline';
import type { AuditEntry } from '@/types/domain';

export interface AuditTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tên địa phương — ghép vào tiêu đề. */
  localityName?: string;
  entries: AuditEntry[];
}

export function AuditTimelineDialog({
  open,
  onOpenChange,
  localityName,
  entries,
}: AuditTimelineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Lịch sử thay đổi{localityName ? ` — ${localityName}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-auto">
          <AuditTimeline entries={entries} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
