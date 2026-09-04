import type { ScoreState, LocalityStatus } from '@/types/rbac';

type Transition = {
  from: ScoreState;
  to: ScoreState;
  action: 'submit' | 'approve' | 'reject' | 'publish';
};

const TRANSITIONS: Transition[] = [
  { from: 'DRAFT', to: 'CHO_DUYET_BAN', action: 'submit' },
  { from: 'CHO_DUYET_BAN', to: 'CHO_DUYET_HOI_DONG', action: 'approve' },
  { from: 'CHO_DUYET_BAN', to: 'DRAFT', action: 'reject' },
  { from: 'CHO_DUYET_HOI_DONG', to: 'CHO_DUYET_BTT', action: 'approve' },
  { from: 'CHO_DUYET_HOI_DONG', to: 'CHO_DUYET_BAN', action: 'reject' },
  { from: 'CHO_DUYET_BTT', to: 'DA_CONG_BO', action: 'publish' },
];

export function canTransition(from: ScoreState, action: Transition['action']): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.action === action);
}

export function getNextState(from: ScoreState, action: Transition['action']): ScoreState | null {
  const transition = TRANSITIONS.find((t) => t.from === from && t.action === action);
  return transition ? transition.to : null;
}

export function isFinalState(state: ScoreState): boolean {
  return state === 'DA_CONG_BO';
}

export function isEditable(state: ScoreState): boolean {
  return state !== 'DA_CONG_BO';
}

const LOCALITY_STATUS_MAP: Record<ScoreState | 'SUBMITTED', LocalityStatus> = {
  SUBMITTED: 'submitted',
  DRAFT: 'processing',
  CHO_DUYET_BAN: 'processing',
  CHO_DUYET_HOI_DONG: 'processing',
  CHO_DUYET_BTT: 'processing',
  DA_CONG_BO: 'published',
};

export function toLocalityStatus(state: ScoreState | 'SUBMITTED'): LocalityStatus {
  return LOCALITY_STATUS_MAP[state];
}
