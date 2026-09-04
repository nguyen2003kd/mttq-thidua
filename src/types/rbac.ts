export type Role =
  | 'ADMIN'
  | 'LOCALITY'
  | 'SPECIALIST'
  | 'BAN_LEADER'
  | 'COUNCIL_CHAIR'
  | 'COUNCIL_VICE'
  | 'STANDING_COMMITTEE';

export type ScoreState =
  | 'DRAFT'
  | 'CHO_DUYET_BAN'
  | 'CHO_DUYET_HOI_DONG'
  | 'CHO_DUYET_BTT'
  | 'DA_CONG_BO';

export type LocalityStatus = 'submitted' | 'processing' | 'published';

export type ActionType = 'SCORE' | 'EDIT' | 'APPROVE' | 'REJECT' | 'PUBLISH';

export type CriteriaTableStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED';

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
