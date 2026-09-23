export type Role =
  | 'LOCAL'
  | 'SPECIALIST'
  | 'LEADER'
  | 'COUNCIL'
  | 'COMMITTEE'
  | 'ADMIN';

export type ScoreState =
  | 'DRAFT'
  | 'CHO_CHUYEN_VIEN'
  | 'CHO_DUYET_BAN'
  | 'CHO_DUYET_HOI_DONG'
  | 'CHO_DUYET_BTT'
  | 'DA_CONG_BO';

export type LocalityStatus = 'submitted' | 'processing' | 'published';

export type ActionType = 'SCORE' | 'EDIT' | 'APPROVE' | 'REJECT' | 'PUBLISH';

export type CriteriaTableStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PUBLISHED';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  banId?: string;
  localityId?: string;
}

export interface Scope {
  banId?: string;
  localityId?: string;
}
