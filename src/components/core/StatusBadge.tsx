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
  CHO_DUYET_BAN: 'info',
  CHO_DUYET_HOI_DONG: 'info',
  CHO_DUYET_BTT: 'warning',
  DA_CONG_BO: 'success',
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
  return <Badge variant={scoreStateVariant[state]}>{SCORE_STATE_LABELS[state]}</Badge>;
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
