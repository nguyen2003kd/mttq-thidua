import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { PageLoading } from '@/components/core';

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const requiresCompletion = useAuthStore((s) => s.requires_profile_completion);
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Chưa biết trạng thái hồ sơ (session cũ) — chờ ProfileGate fetch xong.
  if (requiresCompletion === null && location.pathname !== ROUTES.PROFILE_COMPLETION) {
    return <PageLoading label="Đang kiểm tra hồ sơ…" className="min-h-dvh" />;
  }

  // Thiếu fullName/phone → bắt buộc hoàn thiện trước khi vào màn khác.
  if (requiresCompletion === true && location.pathname !== ROUTES.PROFILE_COMPLETION) {
    return <Navigate to={ROUTES.PROFILE_COMPLETION} replace />;
  }

  return <>{children}</>;
}
