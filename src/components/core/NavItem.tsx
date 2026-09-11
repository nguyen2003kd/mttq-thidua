import type { ComponentType, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/rbac';

interface NavItemProps {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  theme?: 'sidebar' | 'top';
  roles?: Role[];
  children?: ReactNode;
}

const baseItem =
  'group flex items-center gap-3 rounded-lg text-sm font-medium transition-colors';

export function NavItem({ to, label, icon: Icon, theme = 'sidebar', roles }: NavItemProps) {
  const user = useAuthStore((s) => s.user);

  if (roles && user && !roles.includes(user.role)) {
    return null;
  }

  if (theme === 'top') {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            baseItem,
            'h-10 px-3 border-b-2 rounded-none',
            isActive
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )
        }
      >
        {label}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          baseItem,
          'h-10 px-4 rounded-lg',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-white/75 hover:bg-white/10 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-current' : 'text-white/60')} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}
