import { Badge, badgeVariants } from '@/components/ui/badge';
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
  DRAFT: 'border-transparent bg-[#9CA3AF]/15 text-[#626A76]',
  CHO_CHUYEN_VIEN: 'border-transparent bg-[#E8B923]/20 text-[#6E570B]',
  CHO_DUYET_BAN: 'border-transparent bg-[#E8B923]/20 text-[#6E570B]',
  CHO_DUYET_HOI_DONG: 'border-transparent bg-[#E8B923]/20 text-[#6E570B]',
  CHO_DUYET_BTT: 'border-transparent bg-[#2E7D5B]/15 text-[#2E7D5B]',
  DA_CONG_BO: 'border-transparent bg-[#2D2A26] text-white',
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
};

const actionVariant: Record<ActionType, BadgeVariant> = {
  SCORE: 'info',
  EDIT: 'warning',
  APPROVE: 'success',
  REJECT: 'destructive',
  PUBLISH: 'success',
};

export function ScoreStateBadge({ state }: { state: ScoreState }) {
  return <Badge variant={scoreStateVariant[state]} className={scoreStateClassName[state]}>{SCORE_STATE_LABELS[state]}</Badge>;
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
