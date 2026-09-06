import { describe, it, expect } from 'vitest';
import {
  TRANSITIONS,
  canTransition,
  getNextState,
  availableActions,
  isFinalState,
  isEditable,
  isRecordComplete,
  applyTransition,
  toLocalityStatus,
  type WorkflowAction,
} from './state-machine';
import { SCORE_STATES } from '@/constants/enums';
import type { ScoreState } from '@/types/rbac';
import type { CriteriaTable, ScoreRecord } from '@/types/domain';

const ACTIONS: WorkflowAction[] = ['submit', 'approve', 'reject', 'publish'];
const actor = { name: 'Người test', role: 'SPECIALIST' as const };

describe('TRANSITIONS — bảng chuyển hợp lệ', () => {
  it.each(TRANSITIONS)('$from --$action--> $to', ({ from, action, to }) => {
    expect(canTransition(from, action)).toBe(true);
    expect(getNextState(from, action)).toBe(to);
  });

  it('bổ sung nhánh reject từ CHO_DUYET_BTT (B4)', () => {
    expect(getNextState('CHO_DUYET_BTT', 'reject')).toBe('CHO_DUYET_HOI_DONG');
  });

  it('mọi cặp (state, action) ngoài bảng đều không hợp lệ', () => {
    for (const from of SCORE_STATES) {
      for (const action of ACTIONS) {
        const inTable = TRANSITIONS.some((t) => t.from === from && t.action === action);
        if (inTable) continue;
        expect(canTransition(from, action)).toBe(false);
        expect(getNextState(from, action)).toBeNull();
      }
    }
  });
});

describe('availableActions', () => {
  it('CHO_DUYET_BTT → publish + reject', () => {
    expect(availableActions('CHO_DUYET_BTT').sort()).toEqual(['publish', 'reject']);
  });
  it('DA_CONG_BO → không còn hành động', () => {
    expect(availableActions('DA_CONG_BO')).toEqual([]);
  });
});

describe('isFinalState / isEditable', () => {
  it.each(SCORE_STATES)('%s', (s: ScoreState) => {
    expect(isFinalState(s)).toBe(s === 'DA_CONG_BO');
    expect(isEditable(s)).toBe(s !== 'DA_CONG_BO');
  });
});

describe('isRecordComplete', () => {
  const table = {
    criteria: [
      { id: 'c1', name: 'a', maxScore: 10, order: 1 },
      { id: 'c2', name: 'b', maxScore: 10, order: 2 },
      { id: 'c3', name: 'c', maxScore: 10, order: 3 },
    ],
  } satisfies Pick<CriteriaTable, 'criteria'>;

  const entry = (criteriaId: string, value: number) => ({
    id: criteriaId,
    criteriaId,
    criteriaName: criteriaId,
    value,
    state: 'DRAFT' as ScoreState,
    scoredBy: 'x',
    scoredAt: '',
    evidenceCount: 0,
  });

  it('đủ 3 tiêu chí kể cả điểm 0 → true (B5)', () => {
    expect(
      isRecordComplete(table, { entries: [entry('c1', 0), entry('c2', 0), entry('c3', 0)] }),
    ).toBe(true);
  });
  it('thiếu 1 tiêu chí → false', () => {
    expect(isRecordComplete(table, { entries: [entry('c1', 5), entry('c2', 5)] })).toBe(false);
  });
  it('bảng không có tiêu chí → false', () => {
    expect(isRecordComplete({ criteria: [] }, { entries: [] })).toBe(false);
  });
});

describe('applyTransition', () => {
  it('DRAFT + submit + đủ tiêu chí → CHO_DUYET_BAN, audit SCORE', () => {
    const res = applyTransition({
      from: 'DRAFT',
      action: 'submit',
      actor,
      localityId: 'loc-1',
      scoringComplete: true,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.nextState).toBe('CHO_DUYET_BAN');
    expect(res.audit.action).toBe('SCORE');
    expect(res.audit.oldValue).toBe('DRAFT');
    expect(res.audit.newValue).toBe('CHO_DUYET_BAN');
    expect(res.audit.fieldName).toBe('state - loc-1');
    expect(res.audit).not.toHaveProperty('id');
    expect(res.audit).not.toHaveProperty('timestamp');
  });

  it('submit khi chưa đủ tiêu chí → INCOMPLETE_SCORING (B5)', () => {
    const res = applyTransition({
      from: 'DRAFT',
      action: 'submit',
      actor,
      localityId: 'loc-1',
      scoringComplete: false,
    });
    expect(res).toEqual({ ok: false, error: 'INCOMPLETE_SCORING' });
  });

  it('reject không lý do → REASON_REQUIRED', () => {
    const res = applyTransition({ from: 'CHO_DUYET_BAN', action: 'reject', actor, localityId: 'l' });
    expect(res).toEqual({ ok: false, error: 'REASON_REQUIRED' });
  });

  it('reject có lý do → giữ lý do trong audit', () => {
    const res = applyTransition({
      from: 'CHO_DUYET_BAN',
      action: 'reject',
      actor,
      localityId: 'l',
      reason: 'Thiếu minh chứng',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.nextState).toBe('DRAFT');
    expect(res.audit.reason).toBe('Thiếu minh chứng');
    expect(res.audit.action).toBe('REJECT');
  });

  it('reject từ CHO_DUYET_BTT → CHO_DUYET_HOI_DONG (B4)', () => {
    const res = applyTransition({
      from: 'CHO_DUYET_BTT',
      action: 'reject',
      actor,
      localityId: 'l',
      reason: 'x',
    });
    expect(res.ok && res.nextState).toBe('CHO_DUYET_HOI_DONG');
  });

  it('DA_CONG_BO + bất kỳ hành động → FINAL_STATE', () => {
    for (const action of ACTIONS) {
      expect(applyTransition({ from: 'DA_CONG_BO', action, actor, localityId: 'l', reason: 'x' })).toEqual(
        { ok: false, error: 'FINAL_STATE' },
      );
    }
  });

  it('DRAFT + approve → INVALID_TRANSITION', () => {
    expect(applyTransition({ from: 'DRAFT', action: 'approve', actor, localityId: 'l' })).toEqual({
      ok: false,
      error: 'INVALID_TRANSITION',
    });
  });
});

describe('toLocalityStatus (B9)', () => {
  const rec = (state: ScoreState, submittedAt: string | null): Pick<ScoreRecord, 'state' | 'submittedAt'> => ({
    state,
    submittedAt,
  });
  it('DA_CONG_BO → published', () => {
    expect(toLocalityStatus(rec('DA_CONG_BO', '2026-01-01'))).toBe('published');
  });
  it('CHO_DUYET_BAN → processing', () => {
    expect(toLocalityStatus(rec('CHO_DUYET_BAN', '2026-01-01'))).toBe('processing');
  });
  it('DRAFT chưa nộp → processing', () => {
    expect(toLocalityStatus(rec('DRAFT', null))).toBe('processing');
  });
  it('DRAFT đã từng nộp (bị trả lại) → submitted', () => {
    expect(toLocalityStatus(rec('DRAFT', '2026-01-01'))).toBe('submitted');
  });
});
