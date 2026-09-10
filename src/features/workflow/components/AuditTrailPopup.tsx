import { AuditTimelineDialog } from '@/components/core';
import type { AuditEntry } from '@/types/domain';

interface AuditTrailPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  entries: AuditEntry[];
}
export function AuditTrailPopup({ open, onOpenChange, title, entries }: AuditTrailPopupProps) {
  return (
    <AuditTimelineDialog
      open={open}
      onOpenChange={onOpenChange}
      localityName={title}
      entries={entries}
    />
  );
}
