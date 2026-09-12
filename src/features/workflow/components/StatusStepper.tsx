import { Check, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoreState } from '@/types/rbac';

const STEPS = ['Địa phương', 'Chuyên viên', 'Lãnh đạo ban', 'Hội đồng', 'Ủy ban', 'Công bố'] as const;

const CURRENT_STEP: Record<ScoreState, number> = {
  DRAFT: 0,
  CHO_CHUYEN_VIEN: 1,
  CHO_DUYET_BAN: 2,
  CHO_DUYET_HOI_DONG: 3,
  CHO_DUYET_BTT: 4,
  DA_CONG_BO: 5,
};

interface StatusStepperProps {
  state: ScoreState;
  hasRevisionRequest?: boolean;
  revisionTarget?: 'SPECIALIST' | 'LOCAL';
}

export function StatusStepper({ state, hasRevisionRequest = false, revisionTarget = 'SPECIALIST' }: StatusStepperProps) {
  const current = CURRENT_STEP[state];

  return (
    <section className="rounded-lg border border-border bg-card px-4 py-4" aria-label="Tiến trình xét duyệt hồ sơ">
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ol className="flex min-w-[680px] items-start" role="list">
          {STEPS.map((label, index) => {
            const complete = index < current || state === 'DA_CONG_BO';
            const active = index === current && state !== 'DA_CONG_BO';
            return (
              <li key={label} className="relative flex flex-1 flex-col items-center text-center">
                {index > 0 && (
                  <span aria-hidden="true" className={cn('absolute right-1/2 top-4 h-0.5 w-full', index <= current ? 'bg-success' : 'bg-border')} />
                )}
                <span
                  className={cn(
                    'relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-card text-xs font-semibold',
                    complete && 'border-success bg-success text-white',
                    active && 'animate-pulse border-accent text-foreground shadow-[0_0_0_4px_rgba(232,185,35,0.16)]',
                    !complete && !active && 'border-border text-muted-foreground',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {complete ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className={cn('mt-2 text-xs font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {hasRevisionRequest && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning-foreground">
          <CornerDownLeft className="size-4 text-warning" aria-hidden="true" />
          {revisionTarget === 'LOCAL'
            ? 'Chuyên viên đã yêu cầu Địa phương chỉnh sửa hồ sơ'
            : 'Yêu cầu từ cấp trên được chuyển về Chuyên viên để xử lý'}
        </div>
      )}
    </section>
  );
}
