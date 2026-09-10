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
  bonusScore?: number;
  deadline?: string;
  note?: string;
  order: number;
  /** Tiêu chí đã áp dụng bị sửa sẽ bị khóa ở báo cáo địa phương. */
  updatedAt?: string;
}

export type ScoringStage = 'LOCAL' | 'SPECIALIST' | 'LEADER' | 'COUNCIL' | 'COMMITTEE';

export interface StageScore {
  score: number;
  bonusScore: number;
  reason: string | null;
  actorName: string;
  updatedAt: string;
}

/** Thông tin tệp đính kèm khi áp dụng bảng tiêu chí cho địa phương. */
export interface CriteriaTableAttachment {
  id: string;
  fileName: string;
  fileSize: number;
}

export interface CriteriaTable {
  id: string;
  name: string;
  totalScore: number;
  /** Nội dung/mô tả của nhóm tiêu chí. */
  content?: string;
  status: CriteriaTableStatus;
  criteria: CriteriaItem[];
  assignedLocalityCount: number;
  assignmentAttachments?: CriteriaTableAttachment[];
  openDate: string;
  closeDate: string;
  note?: string;
  updatedAt?: string;
  updatedBy?: string;
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
  /** Điểm và diễn giải do địa phương tự đánh giá. */
  proposedScore?: number;
  proposedBonusScore?: number;
  explanation?: string;
  /** Phản hồi gần nhất từ cấp xét duyệt. */
  revisionRequest?: string | null;
  /** Dòng bị khóa do tiêu chí đã áp dụng được sửa/xóa. */
  locked?: boolean;
  isSupplementary?: boolean;
  supplementaryMaxScore?: number;
  stageScores?: Partial<Record<ScoringStage, StageScore>>;
}

export interface LocalityScoreResponse {
  localityId: string;
  localityName: string;
  scores: ScoreEntry[];
}

export interface ScoreRecord {
  state: ScoreState;
  entries: ScoreEntry[];
  totalScore: number;
  submittedAt: string | null;
  publishedAt: string | null;
  revisionRequestedAt?: string | null;
  decisionAttachments?: CriteriaTableAttachment[];
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
  fileSize?: number;
  description?: string;
  kind?: 'STANDARD' | 'BONUS' | 'SUPPLEMENTARY';
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
