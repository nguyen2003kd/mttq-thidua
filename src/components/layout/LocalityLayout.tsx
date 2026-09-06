import type { ReactNode } from 'react';
import { Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { NavItem } from '@/components/core';

const RESULT_YEAR = new Date().getFullYear() + 1;

const LOCALITY_NAV = [
  { to: ROUTES.LOCALITY_TRANG_THAI, label: LABELS.LOCALITY_STATUS_TITLE },
  { to: ROUTES.LOCALITY_MINH_CHUNG, label: LABELS.LOCALITY_EVIDENCE_UPLOAD },
  { to: `/thi-dua/dia-phuong/ket-qua/${RESULT_YEAR}`, label: LABELS.LOCALITY_RESULT_TITLE },
];

export function LocalityLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{LABELS.APP_NAME}</span>
          {user && (
            <span className="ml-auto text-xs text-muted-foreground">{user.name}</span>
          )}
        </div>
      </header>

      <nav className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {LOCALITY_NAV.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={Trophy} theme="top" />
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
