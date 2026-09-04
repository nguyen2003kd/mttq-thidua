import type { ReactNode } from 'react';
import { useCan } from '@/hooks/useAuth';
import type { Action } from '@/lib/rbac';
import type { ScoreState, Scope } from '@/types/rbac';

interface CanProps {
  action: Action;
  state?: ScoreState;
  scope?: Scope;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ action, state, scope, children, fallback = null }: CanProps) {
  const can = useCan();

  if (can(action, { state, scope })) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
