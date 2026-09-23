import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/mutator/query-client';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { LocalityLayout } from '@/components/layout/LocalityLayout';
import { RequireAuth } from '@/routes/guards/RequireAuth';
import { RequireRole } from '@/routes/guards/RequireRole';
import { ROUTES } from '@/constants/routes';
import type { Role } from '@/types/rbac';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { startProactiveTokenRefresh } from '@/api/mutator/auth-interceptors';
import { ActionProgressOverlay, GlobalApiLoading, PageLoading } from '@/components/core';

// Lazy load pages
import { lazy, Suspense, useEffect } from 'react';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const ChangePasswordPage = lazy(() => import('@/features/auth/ChangePasswordPage'));
const CriteriaListPage = lazy(() => import('@/features/admin/pages/CriteriaListPage'));
const CriteriaDetailPage = lazy(() => import('@/features/admin/pages/CriteriaDetailPage'));
const CriteriaFormPage = lazy(() => import('@/features/admin/pages/CriteriaFormPage'));
const DeadlineConfigPage = lazy(() => import('@/features/admin/pages/DeadlineConfigPage'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const LocalityListPage = lazy(() => import('@/features/admin/pages/LocalityListPage'));
const UserManagementPage = lazy(() => import('@/features/admin/pages/UserManagementPage'));
const ScoreByCriteriaPage = lazy(() => import('@/features/cham-diem/pages/ScoreByCriteriaPage'));
const ScoreByLocalityPage = lazy(() => import('@/features/cham-diem/pages/ScoreByLocalityPage'));
const BanLeaderApprovalPage = lazy(() => import('@/features/duyet/pages/BanLeaderApprovalPage'));
const BanLeaderCriteriaGroupsPage = lazy(() => import('@/features/duyet/pages/BanLeaderCriteriaGroupsPage'));
const BanLeaderReviewDetailPage = lazy(() => import('@/features/duyet/pages/BanLeaderReviewDetailPage'));
const BanLeaderHistoryPage = lazy(() => import('@/features/duyet/pages/BanLeaderHistoryPage'));
const CouncilApprovalPage = lazy(() => import('@/features/duyet/pages/CouncilApprovalPage'));
const CouncilCriteriaGroupsPage = lazy(() => import('@/features/duyet/pages/CouncilCriteriaGroupsPage'));
const CouncilHistoryPage = lazy(() => import('@/features/duyet/pages/CouncilHistoryPage'));
const ResultPublicationPage = lazy(() => import('@/features/duyet/pages/ResultPublicationPage'));
const CommitteeApprovalPage = lazy(() => import('@/features/duyet/pages/CommitteeApprovalPage'));
const CommitteeCriteriaGroupsPage = lazy(() => import('@/features/duyet/pages/CommitteeCriteriaGroupsPage'));
const ReadOnlyApprovalDetailPage = lazy(() => import('@/features/duyet/pages/ReadOnlyApprovalDetailPage'));
const CommitteeHistoryPage = lazy(() => import('@/features/duyet/pages/CommitteeHistoryPage'));
const MinhChungPage = lazy(() => import('@/features/dia-phuong/pages/MinhChungPage'));
const TrangThaiPage = lazy(() => import('@/features/dia-phuong/pages/TrangThaiPage'));
const KetQuaPage = lazy(() => import('@/features/dia-phuong/pages/KetQuaPage'));
const AuditLogPage = lazy(() => import('@/features/audit/AuditLogPage'));
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'));
const SpecialistReviewPage = lazy(() => import('@/features/cham-diem/pages/SpecialistReviewPage'));
const SpecialistScoreSummaryPage = lazy(() => import('@/features/cham-diem/pages/SpecialistScoreSummaryPage'));
const SpecialistHistoryPage = lazy(() => import('@/features/cham-diem/pages/SpecialistHistoryPage'));
const CriteriaChildrenPage = lazy(() => import('@/features/admin/pages/CriteriaChildrenPage'));
const LocalityCriteriaPage = lazy(() => import('@/features/dia-phuong/pages/LocalityCriteriaPage'));
const LocalityResultsPage = lazy(() => import('@/features/dia-phuong/pages/LocalityResultsPage'));

const INTERNAL_ROLES: Role[] = ['SPECIALIST', 'LEADER', 'COUNCIL', 'COMMITTEE'];

function ScoreRedirect() {
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const target = criteriaTables.find((t) => t.status === 'ACTIVE') ?? criteriaTables[0];
  if (!target) return <Navigate to={ROUTES.SPECIALIST_REVIEW} replace />;
  return <Navigate to={`/thi-dua/cham-diem/theo-tieu-chi/${target.id}`} replace />;
}

/** Trang chủ điều hướng thẳng tới công việc của vai trò, không dùng Dashboard tổng quan. */
function RoleHomeRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  switch (user.role) {
    case 'LOCAL': return <Navigate to={ROUTES.LOCALITY_CRITERIA} replace />;
    case 'SPECIALIST': return <Navigate to={ROUTES.SPECIALIST_REVIEW} replace />;
    case 'LEADER': return <Navigate to={`/thi-dua/duyet/lanh-dao-ban/${user.banId ?? 'ban1'}`} replace />;
    case 'COUNCIL': return <Navigate to={ROUTES.DUYET_COUNCIL} replace />;
    case 'COMMITTEE': return <Navigate to={ROUTES.DUYET_STANDING} replace />;
    case 'ADMIN': return <Navigate to={ROUTES.ADMIN_CRITERIA_LIST} replace />;
    default: return <Navigate to={ROUTES.LOGIN} replace />;
  }
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

/** Keeps an active session fresh before the access JWT expires. */
function ProactiveAuthRefresh() {
  useEffect(() => startProactiveTokenRefresh(), []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalApiLoading />
      <ActionProgressOverlay />
      <BrowserRouter>
        <AuthEvents />
        <ProactiveAuthRefresh />
        <Toaster position="bottom-right" duration={4000} richColors closeButton />
        <Suspense fallback={<PageLoading label="Đang tải trang…" className="min-h-dvh" />}>
          <Routes>
            {/* Login */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />

            {/* Đổi mật khẩu — mọi role đã đăng nhập */}
            <Route
              path={ROUTES.CHANGE_PASSWORD}
              element={
                <RequireAuth>
                  <AppLayout>
                    <ChangePasswordPage />
                  </AppLayout>
                </RequireAuth>
              }
 />

            {/* Route chuẩn FSD — Cấp Chuyên viên */}
            <Route
              path="/chuyen-vien"
              element={
                <RequireAuth>
                  <RequireRole roles={['SPECIALIST']}>
                    <AppLayout><Outlet /></AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to={ROUTES.SPECIALIST_REVIEW} replace />} />
              <Route path="tieu-chi" element={<CriteriaListPage />} />
              <Route path="tieu-chi/:id/con" element={<CriteriaChildrenPage />} />
              <Route path="duyet" element={<SpecialistReviewPage />} />
              <Route path="duyet/:diaPhuongId" element={<SpecialistReviewPage />} />
              <Route path="duyet/:diaPhuongId/:nhomTieuChiId" element={<SpecialistReviewPage />} />
              <Route path="tong-hop-cham-diem" element={<SpecialistScoreSummaryPage />} />
              <Route path="lich-su" element={<SpecialistHistoryPage />} />
            </Route>

            {/* Route chuẩn FSD — Cấp Địa phương */}
            <Route
              path="/dia-phuong"
              element={
                <RequireAuth>
                  <RequireRole roles={['LOCAL']}>
                    <LocalityLayout><Outlet /></LocalityLayout>
                  </RequireRole>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to={ROUTES.LOCALITY_CRITERIA} replace />} />
              <Route path="tieu-chi" element={<LocalityCriteriaPage />} />
              <Route path="tieu-chi/:id" element={<LocalityCriteriaPage />} />
              <Route path="ket-qua" element={<KetQuaPage />} />
              <Route path="ket-qua/:id" element={<LocalityResultsPage />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/thi-dua/admin"
              element={
                <RequireAuth>
                  <RequireRole roles={['SPECIALIST', 'ADMIN']}>
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to={ROUTES.ADMIN_CRITERIA_LIST} replace />} />
              <Route path="bang-tieu-chi" element={<CriteriaListPage />} />
              <Route path="bang-tieu-chi/:id/chi-tiet" element={<CriteriaDetailPage />} />
              <Route path="bang-tieu-chi/:id" element={<CriteriaFormPage />} />
              <Route path="cau-hinh-thoi-han" element={<DeadlineConfigPage />} />
              <Route path="tai-khoan" element={<UserManagementPage />} />
              <Route path="dia-phuong" element={<LocalityListPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
            </Route>

            {/* Địa phương routes */}
            <Route
              path="/thi-dua/dia-phuong"
              element={
                <RequireAuth>
                  <RequireRole roles={['LOCAL']}>
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
                  <RequireRole roles={['LEADER']}>
                    <AppLayout>
                      <BanLeaderApprovalPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/lanh-dao-ban/:banId/:localityId"
              element={
                <RequireAuth>
                  <RequireRole roles={['LEADER']}>
                    <AppLayout>
                      <BanLeaderCriteriaGroupsPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/lanh-dao-ban/:banId/chi-tiet/:tableId/:localityId"
              element={
                <RequireAuth>
                  <RequireRole roles={['LEADER']}>
                    <AppLayout>
                      <BanLeaderReviewDetailPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/lanh-dao-ban/:banId/lich-su"
              element={
                <RequireAuth>
                  <RequireRole roles={['LEADER']}>
                    <AppLayout>
                      <BanLeaderHistoryPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/hoi-dong-tdkt"
              element={
                <RequireAuth>
                  <RequireRole roles={['COUNCIL']}>
                    <AppLayout>
                      <CouncilApprovalPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/hoi-dong-tdkt/:localityId"
              element={
                <RequireAuth>
                  <RequireRole roles={['COUNCIL']}>
                    <AppLayout>
                      <CouncilCriteriaGroupsPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/hoi-dong-tdkt/:localityId/:groupId"
              element={<RequireAuth><RequireRole roles={['COUNCIL']}><AppLayout><ReadOnlyApprovalDetailPage reviewer="council" /></AppLayout></RequireRole></RequireAuth>}
            />
            <Route
              path="/hoi-dong/lich-su"
              element={
                <RequireAuth>
                  <RequireRole roles={['COUNCIL']}>
                    <AppLayout>
                      <CouncilHistoryPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/ban-thuong-truc"
              element={
                <RequireAuth>
                  <RequireRole roles={['COMMITTEE']}>
                    <AppLayout>
                      <CommitteeApprovalPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/thi-dua/duyet/ban-thuong-truc/cong-bo"
              element={<RequireAuth><RequireRole roles={['COMMITTEE']}><AppLayout><ResultPublicationPage /></AppLayout></RequireRole></RequireAuth>}
            />
            <Route
              path="/thi-dua/duyet/ban-thuong-truc/duyet"
              element={<RequireAuth><RequireRole roles={['COMMITTEE']}><AppLayout><CommitteeApprovalPage /></AppLayout></RequireRole></RequireAuth>}
            />
            <Route
              path="/thi-dua/duyet/ban-thuong-truc/:localityId"
              element={<RequireAuth><RequireRole roles={['COMMITTEE']}><AppLayout><CommitteeCriteriaGroupsPage /></AppLayout></RequireRole></RequireAuth>}
            />
            <Route
              path="/thi-dua/duyet/ban-thuong-truc/:localityId/:groupId"
              element={<RequireAuth><RequireRole roles={['COMMITTEE']}><AppLayout><ReadOnlyApprovalDetailPage reviewer="committee" /></AppLayout></RequireRole></RequireAuth>}
            />
            <Route
              path="/uy-ban/lich-su"
              element={
                <RequireAuth>
                  <RequireRole roles={['COMMITTEE']}>
                    <AppLayout>
                      <CommitteeHistoryPage />
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
                  <RequireRole roles={[...INTERNAL_ROLES, 'LOCAL', 'ADMIN']}>
                    <AppLayout>
                      <AuditLogPage />
                    </AppLayout>
                  </RequireRole>
                </RequireAuth>
              }
            />

            {/* URL Dashboard cũ được giữ để không làm hỏng bookmark, nhưng không còn hiển thị màn hình này. */}
            <Route path="/thi-dua/dashboard-tong-quan" element={<RoleHomeRedirect />} />

            {/* Default redirect */}
            <Route path="/" element={<RoleHomeRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
