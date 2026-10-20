import { CalendarRange } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FilterOption } from './FilterSelect';

export interface PeriodSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Nhãn hiển thị trong trigger */
  label?: string;
  /** Nhãn cho lựa chọn "tất cả" (value rỗng) */
  allLabel?: string;
  className?: string;
}

/** Ô chọn kỳ thi đua dùng chung: icon lịch + nhãn + giá trị căn phải.
 *  Đã chọn → viền/nền chuyển tông primary nhẹ để báo đang lọc theo kỳ. */
export function PeriodSelect({ value, onChange, options, label = 'Kỳ thi đua', allLabel = 'Tất cả kỳ thi đua', className }: PeriodSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v ?? '')}
      itemToStringLabel={(v) => options.find((option) => option.value === v)?.label ?? allLabel}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          'h-10 w-auto min-w-56 cursor-pointer gap-2 rounded-lg border px-3 transition-colors',
          value
            ? 'border-primary/35 bg-primary/[0.04] hover:border-primary/55'
            : 'border-border bg-card hover:border-primary/40',
          className,
        )}
      >
        <CalendarRange className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
        <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <SelectValue placeholder={allLabel} className="min-w-0 justify-end truncate text-right font-medium text-foreground" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="" className="text-[13px]">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[13px]">{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
