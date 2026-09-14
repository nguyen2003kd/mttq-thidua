import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  summary?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, summary, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 pb-6 border-b', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/40">/</span>}
              {bc.href ? (
                <a href={bc.href} className="hover:text-foreground transition-colors">{bc.label}</a>
              ) : (
                <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className={cn('flex items-start justify-between gap-4', summary && 'flex-col xl:flex-row xl:items-center')}>
        <div className={cn('space-y-1', summary && 'flex w-full min-w-0 flex-col gap-4 space-y-0 sm:flex-row sm:items-center xl:w-auto')}>
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
          </div>
          {summary && <div className="shrink-0">{summary}</div>}
        </div>
        {actions && <div className={cn('flex items-center gap-2 shrink-0', summary && 'flex-wrap')}>{actions}</div>}
      </div>
    </div>
  );
}
