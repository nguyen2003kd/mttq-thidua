import { describe, it, expect, beforeEach } from 'vitest';
import { useScoreStore } from './scoreStore';
import type { ScoreRecord } from '@/types/domain';

const S = () => useScoreStore.getState();
const TC = 'tc1';
const LOC = 'loc-25195';
const actor = { name: 'CV Test', role: 'SPECIALIST' as const };

const rec = (over: Partial<ScoreRecord> = {}): ScoreRecord => ({
  state: 'DRAFT',
  entries: [],
  totalScore: 0,
  submittedAt: null,
  publishedAt: null,
  ...over,
});

beforeEach(() => {
  // reset scores/audits về trạng thái sạch cho tc1
  useScoreStore.setState({ scores: { [TC]: {} }, audits: [] });
});

describe('getActiveTableForLocality (B6)', () => {
  it('trả bảng ACTIVE mà địa phương được gán', () => {
    const table = S().getActiveTableForLocality(LOC);
    expect(table?.id).toBe(TC);
    expect(table?.status).toBe('ACTIVE');
  });
  it('địa phương không được gán → null', () => {
    expect(S().getActiveTableForLocality('loc-khong-ton-tai')).toBeNull();
  });
});

describe('submit — B5: tổng điểm 0 vẫn nộp được khi đủ tiêu chí', () => {
  it('chấm cả 3 tiêu chí = 0 → submit thành công', () => {
    const table = S().criteriaTables.find((t) => t.id === TC)!;
    table.criteria.forEach((c) => S().scoreCriterion(TC, LOC, c.id, 0, actor.name, actor.role));

    S().submit(TC, LOC, actor.name, actor.role);

    const r = S().getScore(TC, LOC);
    expect(r.totalScore).toBe(0);
    expect(r.state).toBe('CHO_DUYET_BAN');
    expect(r.submittedAt).not.toBeNull();
  });

  it('mới chấm 2/3 tiêu chí → submit no-op (vẫn DRAFT)', () => {
    const table = S().criteriaTables.find((t) => t.id === TC)!;
    S().scoreCriterion(TC, LOC, table.criteria[0].id, 5, actor.name, actor.role);
    S().scoreCriterion(TC, LOC, table.criteria[1].id, 5, actor.name, actor.role);

    S().submit(TC, LOC, actor.name, actor.role);

    expect(S().getScore(TC, LOC).state).toBe('DRAFT');
  });
});

describe('luồng duyệt 4 tầng qua applyTransition', () => {
  it('submit → approve → approve → publish → DA_CONG_BO', () => {
    const table = S().criteriaTables.find((t) => t.id === TC)!;
    table.criteria.forEach((c) => S().scoreCriterion(TC, LOC, c.id, 10, actor.name, actor.role));

    S().submit(TC, LOC, 'CV', 'SPECIALIST');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_BAN');

    S().approve(TC, LOC, 'Lãnh đạo Ban', 'BAN_LEADER');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_HOI_DONG');

    S().approve(TC, LOC, 'Chủ tịch HĐ', 'COUNCIL_CHAIR');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_BTT');

    S().publish(TC, LOC, 'BTT', 'STANDING_COMMITTEE');
    const r = S().getScore(TC, LOC);
    expect(r.state).toBe('DA_CONG_BO');
    expect(r.publishedAt).not.toBeNull();

    // 3 SCORE (chấm) + submit(SCORE) + APPROVE + APPROVE + PUBLISH
    const stateAudits = S().audits.filter((a) => a.fieldName === `state - ${LOC}`);
    expect(stateAudits.map((a) => a.action)).toEqual(['SCORE', 'APPROVE', 'APPROVE', 'PUBLISH']);
  });
});

describe('reject (B4)', () => {
  it('reject từ CHO_DUYET_BTT → CHO_DUYET_HOI_DONG', () => {
    useScoreStore.setState({ scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_BTT' }) } } });
    S().reject(TC, LOC, 'Cần rà soát lại', 'BTT', 'STANDING_COMMITTEE');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_HOI_DONG');
  });

  it('reject không lý do → no-op', () => {
    useScoreStore.setState({ scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_BAN' }) } } });
    S().reject(TC, LOC, '', 'Ban', 'BAN_LEADER');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_BAN');
  });

  it('reject từ CHO_DUYET_BAN → DRAFT, giữ lý do trong audit', () => {
    useScoreStore.setState({
      scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_BAN', submittedAt: '2026-01-01' }) } },
      audits: [],
    });
    S().reject(TC, LOC, 'Thiếu minh chứng', 'Ban', 'BAN_LEADER');
    expect(S().getScore(TC, LOC).state).toBe('DRAFT');
    expect(S().audits.at(-1)?.reason).toBe('Thiếu minh chứng');
  });
});

describe('getRanking (B6)', () => {
  it('chỉ xếp hạng địa phương được gán bảng', () => {
    const ranking = S().getRanking(TC);
    const ids = ranking.map((r) => r.locality.id);
    expect(ids).toContain('loc-25195');
    expect(ids).toContain('loc-26068');
    expect(ids.every((id) => S().assignments[TC].includes(id))).toBe(true);
  });
});
