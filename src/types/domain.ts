import type {
  Role,
  ScoreState,
  LocalityStatus,
  ActionType,
  CriteriaTableStatus,
  AuthUser,
  Scope,
} from './rbac';

export interface CriteriaItem {
  id: string;
  name: string;
  maxScore: number;
  order: number;
}

export interface CriteriaTable {
  id: string;
  name: string;
  totalScore: number;
  status: CriteriaTableStatus;
  criteria: CriteriaItem[];
  assignedLocalityCount: number;
  openDate: string;
  closeDate: string;
}

export interface ScoreEntry {
  id: string;
  criteriaId: string;
  criteriaName: string;
  value: number;
  state: ScoreState;
  scoredBy: string;
  scoredAt: string;
  evidenceCount: number;
}

export interface LocalityScoreResponse {
  localityId: string;
  localityName: string;
  scores: ScoreEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: ActionType;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  reason: string | null;
}

export interface Evidence {
  id: string;
  criteriaId: string;
  localityId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Locality {
  id: string;
  code: string;
  name: string;
  fullName: string;
  unitType: 'thanh_pho' | 'tinh' | 'phuong' | 'xa';
  region: string;
}

export interface ReminderConfig {
  daysBefore: number;
  enabled: boolean;
}

export interface LocalityStatusResponse {
  status: LocalityStatus;
  submittedAt: string | null;
  publishedAt: string | null;
}

export type { Role, ScoreState, LocalityStatus, ActionType, CriteriaTableStatus, AuthUser, Scope };
