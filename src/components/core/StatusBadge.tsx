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
  CHO_DUYET_BTT: 'success',
  DA_CONG_BO: 'secondary',
};

const scoreStateClassName: Record<ScoreState, string> = {
  DRAFT: 'border-[#9CA3AF]/25 bg-[#9CA3AF]/10 text-[#626A76]',
  CHO_CHUYEN_VIEN: 'border-[#E8B923]/30 bg-[#E8B923]/15 text-[#6E570B]',
  CHO_DUYET_BAN: 'border-[#E8B923]/25 bg-[#E8B923]/15 text-[#6E570B]',
  CHO_DUYET_HOI_DONG: 'border-[#E8B923]/25 bg-[#E8B923]/15 text-[#6E570B]',
  CHO_DUYET_BTT: 'border-[#2E7D5B]/25 bg-[#2E7D5B]/15 text-[#2E7D5B]',
  DA_CONG_BO: 'border-[#2D2A26] bg-[#2D2A26] text-white',
};

const scoreStateDot: Record<ScoreState, string> = {
  DRAFT: 'bg-[#9CA3AF]',
  CHO_CHUYEN_VIEN: 'bg-[#E8B923]',
  CHO_DUYET_BAN: 'bg-[#E8B923]',
  CHO_DUYET_HOI_DONG: 'bg-[#E8B923]',
  CHO_DUYET_BTT: 'bg-[#2E7D5B]',
  DA_CONG_BO: 'bg-[#E8B923]',
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
  CHO_DUYET_BTT: 'Đã được duyệt ở các cấp.',
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
