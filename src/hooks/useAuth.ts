import { useAuthStore } from '@/store/authStore';
import { can as canAction, type Action } from '@/lib/rbac';
import type { ScoreState, Scope } from '@/types/rbac';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return { user, token, isAuthenticated };
}

export function useCan() {
  const user = useAuthStore((s) => s.user);

  return (
    action: Action,
    context?: { state?: ScoreState; scope?: Scope },
  ) => canAction(user, action, context);
}
