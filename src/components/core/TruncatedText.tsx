import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type TruncatedTextProps<T extends ElementType = 'span'> = {
  as?: T;
  value: string | null | undefined;
  tooltipClassName?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** Văn bản một dòng, có thể xem đầy đủ qua hover hoặc focus. */
export function TruncatedText<T extends ElementType = 'span'>({
  as,
  value,
  className,
  tooltipClassName,
  ...props
}: TruncatedTextProps<T>) {
  const Component = as ?? 'span';
  const content = value?.trim() || '—';

  return (
    <Tooltip>
      <TooltipTrigger render={<Component className={cn('block min-w-0 truncate', className)} {...props} />}>
        {content}
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-sm whitespace-normal break-words', tooltipClassName)}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
