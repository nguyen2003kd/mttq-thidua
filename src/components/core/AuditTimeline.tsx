import { formatDateTime } from '@/lib/utils';
import { ACTION_LABELS } from '@/constants/enums';
import type { AuditEntry } from '@/types/domain';
import { cn } from '@/lib/utils';
import { Pencil, Check, X, FileText, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

const actionIcon: Record<string, ReactNode> = {
  SCORE: <FileText className="h-3.5 w-3.5" />,
  EDIT: <Pencil className="h-3.5 w-3.5" />,
  APPROVE: <Check className="h-3.5 w-3.5" />,
  REJECT: <X className="h-3.5 w-3.5" />,
  PUBLISH: <Trophy className="h-3.5 w-3.5" />,
};

const actionColor: Record<string, string> = {
  SCORE: 'bg-info/10 text-info',
  EDIT: 'bg-warning/10 text-warning',
  APPROVE: 'bg-success/10 text-success',
  REJECT: 'bg-destructive/10 text-destructive',
  PUBLISH: 'bg-primary/10 text-primary',
};

const actionSentence: Record<string, string> = {
  SCORE: 'đã chấm điểm',
  EDIT: 'đã sửa điểm',
  APPROVE: 'đã gửi duyệt',
  REJECT: 'đã yêu cầu bổ sung',
  PUBLISH: 'đã công bố kết quả',
};

export function AuditTimeline({ entries, context }: { entries: AuditEntry[]; context?: (entry: AuditEntry) => string | undefined }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Chưa có thay đổi nào được ghi nhận.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Line */}
          {index < entries.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
          )}

          {/* Icon */}
          <div className={cn(
            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            actionColor[entry.action] || 'bg-muted text-muted-foreground',
          )}>
            {actionIcon[entry.action] || <FileText className="h-3.5 w-3.5" />}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{entry.actorName} {actionSentence[entry.action] ?? ACTION_LABELS[entry.action].toLocaleLowerCase('vi')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(entry.timestamp)}
            </p>
            {context?.(entry) && (
              <p className="text-xs text-muted-foreground">· {context(entry)}</p>
            )}
            {entry.reason && (
              <p className="text-sm text-muted-foreground mt-1.5 italic">
                "{entry.reason}"
              </p>
            )}
            {entry.oldValue !== null && entry.newValue !== undefined && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-1 text-xs font-medium tabular-nums">
                <span className="text-muted-foreground line-through">{entry.oldValue}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground font-semibold">{entry.newValue}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
