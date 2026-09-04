import { Input } from '@/components/ui/input';

export function ScoreInput({
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
