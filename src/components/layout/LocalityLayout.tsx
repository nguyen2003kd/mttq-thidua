import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, FileText, Upload, Award, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { ROLE_LABELS } from '@/constants/enums';
import { NavItem } from '@/components/core';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const RESULT_YEAR = new Date().getFullYear() + 1;

const LOCALITY_NAV = [
  { to: ROUTES.LOCALITY_TRANG_THAI, label: LABELS.LOCALITY_STATUS_TITLE, icon: FileText },
  { to: ROUTES.LOCALITY_MINH_CHUNG, label: LABELS.LOCALITY_EVIDENCE_UPLOAD, icon: Upload },
  { to: `/thi-dua/dia-phuong/ket-qua/${RESULT_YEAR}`, label: LABELS.LOCALITY_RESULT_TITLE, icon: Award },
];

export function LocalityLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{LABELS.APP_NAME}</span>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="ml-auto flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 py-1.5 text-sm transition-all hover:bg-muted/50 hover:border-border"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:flex flex-col leading-tight text-left">
                      <span className="text-xs font-medium truncate max-w-[140px]">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform data-[popup-open]:rotate-180" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" sideOffset={6} className="w-56 p-1.5">
                <div className="px-2 py-2.5">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[user.role]}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="mt-1 rounded-lg px-2 py-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <nav className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {LOCALITY_NAV.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} theme="top" />
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
