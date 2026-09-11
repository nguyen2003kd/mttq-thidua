import { useMemo, type ReactNode, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  LayoutDashboard,
  Table,
  ClipboardCheck,
  FileCheck,
  History,
  LogOut,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { useUIStore } from '@/store/uiStore';
import { ROLE_LABELS } from '@/constants/enums';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { NavItem, Button } from '@/components/core';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NavItemDef {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const navigate = useNavigate();

  const stickyTitle = useUIStore((s) => s.stickyTitle);
  const stickyDescription = useUIStore((s) => s.stickyDescription);

  const navItems = useMemo<NavItemDef[]>(() => {
    const items: NavItemDef[] = [];
    if (user?.role !== 'LOCAL') {
      items.push({ to: ROUTES.DASHBOARD_OVERVIEW, label: LABELS.DASHBOARD_TITLE, icon: LayoutDashboard });
    }

    if (user?.role === 'LOCAL') {
      items.push({ to: ROUTES.LOCALITY_CRITERIA, label: 'Tiêu chí được giao', icon: Table });
      items.push({ to: ROUTES.LOCALITY_RESULTS, label: LABELS.LOCALITY_RESULT_TITLE, icon: Trophy });
    }

    if (user?.role === 'SPECIALIST' && criteriaTables[0]) {
      items.push({ to: ROUTES.SPECIALIST_CRITERIA, label: 'Quản lý tiêu chí', icon: Table });
      items.push({ to: ROUTES.SPECIALIST_REVIEW, label: 'Chấm và thẩm định', icon: ClipboardCheck });
      items.push({ to: ROUTES.SPECIALIST_HISTORY, label: 'Lịch sử chấm', icon: History });
    }

    if (user?.role === 'LEADER') {
      items.push({
        to: `/thi-dua/duyet/lanh-dao-ban/${user.banId ?? 'ban1'}`,
        label: 'Duyệt — Lãnh đạo Ban',
        icon: FileCheck,
      });
    }

    if (user?.role === 'COUNCIL') {
      items.push({ to: ROUTES.DUYET_COUNCIL, label: 'Duyệt — Hội đồng TĐKT', icon: FileCheck });
    }

    if (user?.role === 'COMMITTEE') {
      items.push({ to: ROUTES.DUYET_STANDING, label: 'Duyệt — Ủy ban', icon: FileCheck });
    }

    if (user?.role && user.role !== 'LOCAL') {
      items.push({ to: ROUTES.AUDIT_LOG.replace('/:diaPhuongId', ''), label: LABELS.AUDIT_TIMELINE_TITLE, icon: History });
    }
    return items;
  }, [user, criteriaTables]);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex h-dvh bg-background">
      {sidebarOpen && (
        <aside className="w-64 shrink-0 flex flex-col relative overflow-hidden text-white border-r border-white/10">
          {/* Background image + faint black overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/sidebar.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[#1F1B1A]/30" aria-hidden="true" />

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

        </aside>
      )}

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between px-6 gap-4 border-b border-primary bg-primary text-primary-foreground">
          <div className="flex items-center gap-4">
            {stickyTitle && (
              <div className="flex flex-col justify-center">
                <h1 className="text-[13px] font-semibold tracking-tight leading-relaxed">{stickyTitle}</h1>
                {stickyDescription && (
                  <p className="text-[10px] text-white/75 leading-relaxed">{stickyDescription}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="relative rounded-full text-white hover:bg-white/10 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-primary" />
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white transition-all hover:bg-white/15"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden sm:flex flex-col leading-tight text-left">
                        <span className="text-xs font-medium truncate max-w-[120px]">{user.name}</span>
                        <span className="text-[10px] text-white/75 truncate max-w-[120px]">{ROLE_LABELS[user.role]}</span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-white/75 transition-transform data-[popup-open]:rotate-180" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end" sideOffset={6} className="w-60 p-1.5">
                  <div className="px-2 py-2.5">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout} className="mt-1 rounded-lg px-2 py-2">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
