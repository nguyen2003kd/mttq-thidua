import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  /** Nhãn xám đứng trước giá trị, vd "Trạng thái" */
  label: string;
  /** Giá trị đang chọn; chuỗi rỗng = chưa lọc */
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Nhãn cho lựa chọn "tất cả" (value rỗng) */
  allLabel?: string;
  className?: string;
}

/**
 * Bộ lọc dạng dropdown dùng chung cho DataTable.
 * Nhãn luôn hiển thị; khi đã chọn thì viền + nền chuyển sang tông primary.
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'Tất cả',
  className,
}: FilterSelectProps) {
  const active = value !== '';
  const selected = options.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger
        className={cn(
          '!h-9 w-auto cursor-pointer gap-1.5 rounded-lg border px-2.5 text-[13px] font-normal transition-colors',
          active
            ? 'border-primary/50 bg-primary/[0.06]'
            : 'border-input bg-card hover:border-muted-foreground/55',
          className,
        )}
      >
        <span className={cn('text-muted-foreground', active && 'text-primary')}>{label}</span>
        <span className="font-medium text-foreground">{selected ? selected.label : allLabel}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="" className="text-[13px] !rounded-none hover:bg-destructive/10 focus:bg-destructive/10 focus:text-foreground">
          {allLabel}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[13px] !rounded-none hover:bg-destructive/10 focus:bg-destructive/10 focus:text-foreground">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
