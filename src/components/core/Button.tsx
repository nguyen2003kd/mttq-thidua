/* eslint-disable react-refresh/only-export-components */
import { useCan } from '@/hooks/useAuth';
import type { Action } from '@/lib/rbac';
import type { ScoreState, Scope } from '@/types/rbac';
import { Button as BaseButton, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'variant' | 'size'>,
    VariantProps<typeof buttonVariants> {
  action?: Action;
  state?: ScoreState;
  scope?: Scope;
  fallback?: ReactNode;
}

export function Button({ action, state, scope, fallback, ...props }: ButtonProps) {
  const can = useCan();

  if (action && !can(action, { state, scope })) {
    return fallback ? <>{fallback}</> : null;
  }

  return <BaseButton {...props} />;
}

export { buttonVariants };