import type { ScoreState, LocalityStatus, Role, ActionType } from '@/types/rbac';
import type { AuditEntry, CriteriaTable, ScoreRecord } from '@/types/domain';

export type WorkflowAction = 'submit' | 'approve' | 'reject' | 'publish';

interface TransitionDef {
  from: ScoreState;
  action: WorkflowAction;
  to: ScoreState;
}

/**
 * Bảng chuyển trạng thái bảng điểm — NGUỒN CHÂN LÝ DUY NHẤT cho luồng duyệt.
 * UI và mock server đều tra bảng này, không tự chế if-else.
 */
export const TRANSITIONS: readonly TransitionDef[] = [
  { from: 'DRAFT', action: 'submit', to: 'CHO_CHUYEN_VIEN' },

  { from: 'CHO_CHUYEN_VIEN', action: 'submit', to: 'CHO_DUYET_BAN' },
  { from: 'CHO_CHUYEN_VIEN', action: 'reject', to: 'DRAFT' },

  { from: 'CHO_DUYET_BAN', action: 'approve', to: 'CHO_DUYET_HOI_DONG' },
  // B0: mọi yêu cầu chỉnh sửa từ cấp trên đều quay về Chuyên viên.
  { from: 'CHO_DUYET_BAN', action: 'reject', to: 'CHO_CHUYEN_VIEN' },

  { from: 'CHO_DUYET_HOI_DONG', action: 'approve', to: 'CHO_DUYET_BTT' },
  { from: 'CHO_DUYET_HOI_DONG', action: 'reject', to: 'CHO_CHUYEN_VIEN' },

  { from: 'CHO_DUYET_BTT', action: 'publish', to: 'DA_CONG_BO' },
  { from: 'CHO_DUYET_BTT', action: 'reject', to: 'CHO_CHUYEN_VIEN' },
] as const;

export function canTransition(from: ScoreState, action: WorkflowAction): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.action === action);
}

export function getNextState(from: ScoreState, action: WorkflowAction): ScoreState | null {
  return TRANSITIONS.find((t) => t.from === from && t.action === action)?.to ?? null;
}

export function availableActions(from: ScoreState): WorkflowAction[] {
  return TRANSITIONS.filter((t) => t.from === from).map((t) => t.action);
}

export function isFinalState(state: ScoreState): boolean {
  return state === 'DA_CONG_BO';
}

export function isEditable(state: ScoreState): boolean {
  return state !== 'DA_CONG_BO';
}

/** Đã chấm đủ mọi tiêu chí con của bảng chưa (điểm 0 vẫn tính là đã chấm). */
export function isRecordComplete(
  table: Pick<CriteriaTable, 'criteria'>,
  record: Pick<ScoreRecord, 'entries'>,
): boolean {
  if (table.criteria.length === 0) return false;
  const scored = new Set(record.entries.map((e) => e.criteriaId));
  return table.criteria.every((c) => scored.has(c.id));
}

export interface TransitionActor {
  name: string;
  role: Role;
}

export type TransitionError =
  | 'INVALID_TRANSITION'
  | 'REASON_REQUIRED'
  | 'INCOMPLETE_SCORING'
  | 'FINAL_STATE';

export interface TransitionOk {
  ok: true;
  nextState: ScoreState;
  /** Audit chưa có id/timestamp — tầng gọi (store/server) gắn thêm. */
  audit: Omit<AuditEntry, 'id' | 'timestamp'>;
}
export interface TransitionErr {
  ok: false;
  error: TransitionError;
}
export type TransitionResult = TransitionOk | TransitionErr;

const ACTION_TO_AUDIT: Record<WorkflowAction, ActionType> = {
  submit: 'SCORE',
  approve: 'APPROVE',
  reject: 'REJECT',
  publish: 'PUBLISH',
};

/**
 * Kiểm tra + tính kết quả một bước chuyển trạng thái. Pure — không side effect.
 */
export function applyTransition(params: {
  from: ScoreState;
  action: WorkflowAction;
  actor: TransitionActor;
  localityId: string;
  reason?: string | null;
  /** Bắt buộc cho action 'submit': đã chấm đủ tiêu chí chưa. */
  scoringComplete?: boolean;
}): TransitionResult {
  const { from, action, actor, localityId, reason, scoringComplete } = params;

  if (isFinalState(from)) return { ok: false, error: 'FINAL_STATE' };
  if (action === 'reject' && !reason?.trim()) return { ok: false, error: 'REASON_REQUIRED' };
  if (action === 'submit' && scoringComplete === false) {
    return { ok: false, error: 'INCOMPLETE_SCORING' };
  }

  const to = getNextState(from, action);
  if (!to) return { ok: false, error: 'INVALID_TRANSITION' };

  return {
    ok: true,
    nextState: to,
    audit: {
      actorName: actor.name,
      actorRole: actor.role,
      action: ACTION_TO_AUDIT[action],
      fieldName: `state - ${localityId}`,
      oldValue: from,
      newValue: to,
      reason: reason ?? null,
    },
  };
}

/** Trạng thái hiển thị cho địa phương, suy ra từ record bảng điểm. */
export function toLocalityStatus(
  record: Pick<ScoreRecord, 'state' | 'submittedAt'>,
): LocalityStatus {
  if (record.state === 'DA_CONG_BO') return 'published';
  if (record.state !== 'DRAFT') return 'processing';
  return record.submittedAt ? 'submitted' : 'processing';
}
