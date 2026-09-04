import { useMemo, type ReactNode, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Trophy,
  LayoutDashboard,
  Table,
  LayoutGrid,
  FileCheck,
  History,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { useUIStore } from '@/store/uiStore';
import { ROLE_LABELS } from '@/constants/enums';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { NavItem, Button } from '@/components/core';

interface NavItemDef {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const navigate = useNavigate();

  const navItems = useMemo<NavItemDef[]>(() => {
    const items: NavItemDef[] = [];
    items.push({ to: ROUTES.DASHBOARD_OVERVIEW, label: LABELS.DASHBOARD_TITLE, icon: LayoutDashboard });

    if (user?.role === 'ADMIN') {
      items.push({ to: ROUTES.ADMIN_CRITERIA_LIST, label: LABELS.CRITERIA_TABLE, icon: Table });
    }

    if (user?.role === 'SPECIALIST' && criteriaTables[0]) {
      items.push({
        to: `/thi-dua/cham-diem/theo-tieu-chi/${criteriaTables[0].id}`,
        label: LABELS.SCORE_GRID_TITLE,
        icon: LayoutGrid,
      });
    }

    if (user?.role === 'BAN_LEADER') {
      items.push({
        to: `/thi-dua/duyet/lanh-dao-ban/${user.banId ?? 'ban1'}`,
        label: 'Duyệt — Lãnh đạo Ban',
        icon: FileCheck,
      });
    }

    if (user?.role === 'COUNCIL_CHAIR' || user?.role === 'COUNCIL_VICE') {
      items.push({ to: ROUTES.DUYET_COUNCIL, label: 'Duyệt — Hội đồng TĐKT', icon: FileCheck });
    }

    if (user?.role === 'STANDING_COMMITTEE') {
      items.push({ to: ROUTES.DUYET_STANDING, label: 'Duyệt — Ban thường trực', icon: FileCheck });
    }

    items.push({ to: ROUTES.AUDIT_LOG.replace('/:diaPhuongId', ''), label: LABELS.AUDIT_TIMELINE_TITLE, icon: History });
    return items;
  }, [user, criteriaTables]);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <aside className="w-64 flex flex-col relative overflow-hidden text-white border-r border-white/10">
          {/* Background image + faint black overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/sidebar.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/25" aria-hidden="true" />

          {/* Brand block */}
          <div className="relative z-10 h-14 px-4 border-b border-white/20 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" />
            <span className="font-semibold text-sm tracking-tight">Mặt Trận Tổ Quốc</span>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                theme="sidebar"
              />
            ))}
          </nav>

          {/* User card */}
          {user && (
            <div className="relative z-10 m-3 mb-4 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-white/60 truncate">{ROLE_LABELS[user.role]}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleLogout}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </aside>
      )}

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-4 gap-4">
          <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{LABELS.APP_NAME}</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
