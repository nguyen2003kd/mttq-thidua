import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { LocalityLayout } from '@/components/layout/LocalityLayout';
import { RequireAuth } from '@/routes/guards/RequireAuth';
import { RequireRole } from '@/routes/guards/RequireRole';
import { ROUTES } from '@/constants/routes';
import type { Role } from '@/types/rbac';
import { useScoreStore } from '@/store/scoreStore';

// Lazy load pages
import { lazy, Suspense, useEffect } from 'react';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const CriteriaListPage = lazy(() => import('@/features/admin/pages/CriteriaListPage'));
const CriteriaFormPage = lazy(() => import('@/features/admin/pages/CriteriaFormPage'));
const AssignLocalityPage = lazy(() => import('@/features/admin/pages/AssignLocalityPage'));
const DeadlineConfigPage = lazy(() => import('@/features/admin/pages/DeadlineConfigPage'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const LocalityListPage = lazy(() => import('@/features/admin/pages/LocalityListPage'));
const ScoreByCriteriaPage = lazy(() => import('@/features/cham-diem/pages/ScoreByCriteriaPage'));
const ScoreByLocalityPage = lazy(() => import('@/features/cham-diem/pages/ScoreByLocalityPage'));
const BanLeaderApprovalPage = lazy(() => import('@/features/duyet/pages/BanLeaderApprovalPage'));
const CouncilApprovalPage = lazy(() => import('@/features/duyet/pages/CouncilApprovalPage'));
const StandingCommitteePage = lazy(() => import('@/features/duyet/pages/StandingCommitteePage'));
const MinhChungPage = lazy(() => import('@/features/dia-phuong/pages/MinhChungPage'));
const TrangThaiPage = lazy(() => import('@/features/dia-phuong/pages/TrangThaiPage'));
const KetQuaPage = lazy(() => import('@/features/dia-phuong/pages/KetQuaPage'));
const OverviewDashboardPage = lazy(() => import('@/features/dashboard/pages/OverviewDashboardPage'));
const AuditLogPage = lazy(() => import('@/features/audit/AuditLogPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const INTERNAL_ROLES: Role[] = ['ADMIN', 'SPECIALIST', 'BAN_LEADER', 'COUNCIL_CHAIR', 'COUNCIL_VICE', 'STANDING_COMMITTEE'];

function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ScoreRedirect() {
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const target = criteriaTables.find((t) => t.status === 'ACTIVE') ?? criteriaTables[0];
  if (!target) return <Navigate to={ROUTES.DASHBOARD_OVERVIEW} replace />;
  return <Navigate to={`/thi-dua/cham-diem/theo-tieu-chi/${target.id}`} replace />;
}

/** Lắng nghe sự kiện `auth:logout` (từ interceptor 401) và điều hướng về /login. */
function AuthEvents() {
  const navigate = useNavigate();
  useEffect(() => {
    const onLogout = () => {
      queryClient.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthEvents />
        <Toaster position="bottom-right" richColors closeButton />
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Login */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />

            {/* Admin routes */}
            <Route
              path="/thi-dua/admin"
              element={
                <RequireAuth>
                  <RequireRole roles={['ADMIN']}>
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to={ROUTES.ADMIN_CRITERIA_LIST} replace />} />
              <Route path="bang-tieu-chi" element={<CriteriaListPage />} />
              <Route path="bang-tieu-chi/:id" element={<CriteriaFormPage />} />
              <Route path="bang-tieu-chi/:id/gan-dia-phuong" element={<AssignLocalityPage />} />
              <Route path="cau-hinh-thoi-han" element={<DeadlineConfigPage />} />
              <Route path="dia-phuong" element={<LocalityListPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
            </Route>

            {/* Địa phương routes */}
            <Route
              path="/thi-dua/dia-phuong"
              element={
                <RequireAuth>
                  <RequireRole roles={['LOCALITY']}>
                    <LocalityLayout>
                      <Outlet />
                    </LocalityLayout>
                  </RequireRole>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to={ROUTES.LOCALITY_TRANG_THAI} replace />} />
              <Route path="minh-chung" element={<MinhChungPage />} />
              <Route path="trang-thai" element={<TrangThaiPage />} />
              <Route path="ket-qua/:nam" element={<KetQuaPage />} />
            </Route>

            {/* Chấm điểm routes */}
            <Route
              path="/thi-dua/cham-diem"
              element={
                <RequireAuth>
                  <RequireRole roles={['SPECIALIST']}>
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            >
                <Route index element={<ScoreRedirect />} />
              <Route path="theo-tieu-chi/:id" element={<ScoreByCriteriaPage />} />
              <Route path="theo-dia-phuong/:id" element={<ScoreByLocalityPage />} />
            </Route>

            {/* Duyệt routes */}
            <Route
              path="/thi-dua/duyet/lanh-dao-ban/:banId"
              element={
                <RequireAuth>
                  <RequireRole roles={['BAN_LEADER']}>
                    <AppLayout>
                      <BanLeaderApprovalPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/hoi-dong-tdkt"
              element={
                <RequireAuth>
                  <RequireRole roles={['COUNCIL_CHAIR', 'COUNCIL_VICE']}>
                    <AppLayout>
                      <CouncilApprovalPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/ban-thuong-truc"
              element={
                <RequireAuth>
                  <RequireRole roles={['STANDING_COMMITTEE']}>
                    <AppLayout>
                      <StandingCommitteePage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />

            {/* Audit log */}
            <Route
              path="/thi-dua/lich-su-thay-doi/:diaPhuongId?"
              element={
                <RequireAuth>
                  <RequireRole roles={INTERNAL_ROLES}>
                    <AppLayout>
                      <AuditLogPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />

            {/* Dashboard tổng quan */}
            <Route
              path="/thi-dua/dashboard-tong-quan"
              element={
                <RequireAuth>
                  <RequireRole roles={INTERNAL_ROLES}>
                    <AppLayout>
                      <OverviewDashboardPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD_OVERVIEW} replace />} />
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD_OVERVIEW} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
