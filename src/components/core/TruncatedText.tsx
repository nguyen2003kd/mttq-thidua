import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from 'react';

type TruncatedTextProps<T extends ElementType = 'span'> = {
  as?: T;
  value: string | null | undefined;
  /** Số dòng tối đa trước khi rút gọn. Mặc định là một dòng. */
  maxLines?: number;
  tooltipClassName?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** Văn bản rút gọn, có thể xem đầy đủ qua hover hoặc focus. */
export function TruncatedText<T extends ElementType = 'span'>({
  as,
  value,
  maxLines,
  className,
  tooltipClassName,
  style,
  ...props
}: TruncatedTextProps<T>) {
  const Component = as ?? 'span';
  const content = value?.trim() || '—';
  const clampStyle: CSSProperties | undefined = maxLines
    ? {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: maxLines,
        overflow: 'hidden',
      }
    : undefined;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Component
            className={cn('block min-w-0 cursor-help', !maxLines && 'truncate', className)}
            style={{ ...style, ...clampStyle }}
            {...props}
          />
        }
      >
        {content}
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-sm whitespace-normal break-words', tooltipClassName)}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
