/* eslint-disable react-refresh/only-export-components */
import { useCan } from '@/hooks/useAuth';
import type { Action } from '@/lib/rbac';
import type { ScoreState, Scope } from '@/types/rbac';
import { Button as BaseButton, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'variant' | 'size'>,
    VariantProps<typeof buttonVariants> {
  action?: Action;
  state?: ScoreState;
  scope?: Scope;
  fallback?: ReactNode;
  /** Lý do hiện khi nút đang bị khóa. */
  disabledReason?: ReactNode;
}

export function Button({ action, state, scope, fallback, disabledReason, ...props }: ButtonProps) {
  const can = useCan();

  if (action && !can(action, { state, scope })) {
    return fallback ? <>{fallback}</> : null;
  }

  const button = <BaseButton {...props} />;
  const reason = disabledReason
    ?? (typeof props.title === 'string' ? props.title : 'Thao tác hiện chưa khả dụng.');

  // Giữ wrapper ổn định cả khi nút đổi từ disabled sang enabled. Native disabled
  // button không nhận hover/focus, nên span là trigger để vẫn đọc được lý do.
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-not-allowed" />}>
        {button}
      </TooltipTrigger>
      {props.disabled && <TooltipContent className="max-w-sm whitespace-normal break-words">{reason}</TooltipContent>}
    </Tooltip>
  );
}

export { buttonVariants };
