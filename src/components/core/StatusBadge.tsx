import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import {
  SCORE_STATE_LABELS,
  LOCALITY_STATUS_LABELS,
  CRITERIA_STATUS_LABELS,
  ACTION_LABELS,
} from '@/constants/enums';
import type {
  ScoreState,
  LocalityStatus,
  CriteriaTableStatus,
  ActionType,
} from '@/types/rbac';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const scoreStateVariant: Record<ScoreState, BadgeVariant> = {
  DRAFT: 'secondary',
  CHO_CHUYEN_VIEN: 'warning',
  CHO_DUYET_BAN: 'warning',
  CHO_DUYET_HOI_DONG: 'warning',
  CHO_DUYET_BTT: 'warning',
  DA_CONG_BO: 'secondary',
};

const scoreStateClassName: Record<ScoreState, string> = {
  DRAFT: 'border-primary/20 bg-primary/5 text-muted-foreground',
  CHO_CHUYEN_VIEN: 'border-primary/25 bg-primary/10 text-primary',
  CHO_DUYET_BAN: 'border-primary/25 bg-primary/10 text-primary',
  CHO_DUYET_HOI_DONG: 'border-primary/25 bg-primary/10 text-primary',
  CHO_DUYET_BTT: 'border-primary/25 bg-primary/10 text-primary',
  DA_CONG_BO: 'border-primary bg-primary text-primary-foreground',
};

const scoreStateDot: Record<ScoreState, string> = {
  DRAFT: 'bg-primary/40',
  CHO_CHUYEN_VIEN: 'bg-accent',
  CHO_DUYET_BAN: 'bg-accent',
  CHO_DUYET_HOI_DONG: 'bg-accent',
  CHO_DUYET_BTT: 'bg-accent',
  DA_CONG_BO: 'bg-primary-foreground',
};

const localityStatusVariant: Record<LocalityStatus, BadgeVariant> = {
  submitted: 'info',
  processing: 'warning',
  published: 'success',
};

const criteriaStatusVariant: Record<CriteriaTableStatus, BadgeVariant> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'secondary',
  PUBLISHED: 'success',
};

const actionVariant: Record<ActionType, BadgeVariant> = {
  SCORE: 'info',
  EDIT: 'warning',
  APPROVE: 'success',
  REJECT: 'destructive',
  PUBLISH: 'success',
};

const SCORE_STATE_HINTS: Record<ScoreState, string> = {
  DRAFT: 'Bản nháp — chưa gửi duyệt, bạn vẫn có thể chỉnh sửa điểm và minh chứng.',
  CHO_CHUYEN_VIEN: 'Đã gửi — đang chờ Chuyên viên duyệt.',
  CHO_DUYET_BAN: 'Chuyên viên đã duyệt — đang chờ Lãnh đạo ban duyệt.',
  CHO_DUYET_HOI_DONG: 'Lãnh đạo ban đã duyệt — đang chờ Hội đồng thi đua duyệt.',
  CHO_DUYET_BTT: 'Hội đồng đã duyệt — đang chờ Ban Thường trực xử lý.',
  DA_CONG_BO: 'Đã công bố — hồ sơ đã khóa, không thể chỉnh sửa.',
};

export function ScoreStateBadge({ state, size = 'sm' }: { state: ScoreState; size?: 'sm' | 'lg' }) {
  return (
    <Badge
      variant={scoreStateVariant[state]}
      className={cn(size === 'lg' && 'h-9 gap-2 px-3 text-sm', scoreStateClassName[state])}
      title={SCORE_STATE_HINTS[state]}
    >
      <span className={cn('shrink-0 rounded-full', size === 'lg' ? 'h-2 w-2' : 'h-1.5 w-1.5', scoreStateDot[state])} />
      {SCORE_STATE_LABELS[state]}
    </Badge>
  );
}

export function LocalityStatusBadge({ status }: { status: LocalityStatus }) {
  return <Badge variant={localityStatusVariant[status]}>{LOCALITY_STATUS_LABELS[status]}</Badge>;
}

export function CriteriaStatusBadge({ status }: { status: CriteriaTableStatus }) {
  return <Badge variant={criteriaStatusVariant[status]}>{CRITERIA_STATUS_LABELS[status]}</Badge>;
}

export function ActionBadge({ action }: { action: ActionType }) {
  return <Badge variant={actionVariant[action]}>{ACTION_LABELS[action]}</Badge>;
}
