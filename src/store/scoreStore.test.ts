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
    expect(r.state).toBe('CHO_CHUYEN_VIEN');
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

    S().submit(TC, LOC, 'Địa phương', 'LOCAL');
    expect(S().getScore(TC, LOC).state).toBe('CHO_CHUYEN_VIEN');

    S().submit(TC, LOC, 'CV', 'SPECIALIST');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_BAN');

    S().approve(TC, LOC, 'Lãnh đạo', 'LEADER');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_HOI_DONG');

    S().approve(TC, LOC, 'Hội đồng', 'COUNCIL');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_BTT');

    S().publish(TC, LOC, 'Ủy ban', 'COMMITTEE');
    const r = S().getScore(TC, LOC);
    expect(r.state).toBe('DA_CONG_BO');
    expect(r.publishedAt).not.toBeNull();

    // 3 SCORE (chấm) + 2 lần submit + APPROVE + APPROVE + PUBLISH
    const stateAudits = S().audits.filter((a) => a.fieldName === `state - ${LOC}`);
    expect(stateAudits.map((a) => a.action)).toEqual(['SCORE', 'SCORE', 'APPROVE', 'APPROVE', 'PUBLISH']);
  });
});

describe('reject (B0)', () => {
  it('reject từ CHO_DUYET_BTT → CHO_CHUYEN_VIEN', () => {
    useScoreStore.setState({ scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_BTT' }) } } });
    S().reject(TC, LOC, 'Cần rà soát lại', 'Ủy ban', 'COMMITTEE');
    expect(S().getScore(TC, LOC).state).toBe('CHO_CHUYEN_VIEN');
  });

  it('reject không lý do → no-op', () => {
    useScoreStore.setState({ scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_BAN' }) } } });
    S().reject(TC, LOC, '', 'Lãnh đạo', 'LEADER');
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_BAN');
  });

  it('reject từ CHO_DUYET_BAN → CHO_CHUYEN_VIEN, giữ lý do trong audit', () => {
    useScoreStore.setState({
      scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_BAN', submittedAt: '2026-01-01' }) } },
      audits: [],
    });
    S().reject(TC, LOC, 'Thiếu minh chứng', 'Lãnh đạo', 'LEADER');
    expect(S().getScore(TC, LOC).state).toBe('CHO_CHUYEN_VIEN');
    expect(S().getScore(TC, LOC).revisionRequestedAt).toBeTruthy();
    expect(S().audits.at(-1)?.reason).toBe('Thiếu minh chứng');
  });
});

describe('nhận xét Hội đồng (COL.01.09)', () => {
  it('lưu nhận xét vào lịch sử mà không thay đổi trạng thái hồ sơ', () => {
    useScoreStore.setState({ scores: { [TC]: { [LOC]: rec({ state: 'CHO_DUYET_HOI_DONG' }) } } });

    expect(S().addComment(TC, LOC, '  ', 'Chủ tịch Hội đồng', 'COUNCIL')).toBe(false);
    expect(S().addComment(TC, LOC, 'Cần tiếp tục phát huy công tác tuyên truyền.', 'Chủ tịch Hội đồng', 'COUNCIL')).toBe(true);
    expect(S().getScore(TC, LOC).state).toBe('CHO_DUYET_HOI_DONG');
    expect(S().audits.at(-1)).toMatchObject({
      actorRole: 'COUNCIL',
      fieldName: `Nhận xét Hội đồng - ${LOC}`,
      reason: 'Cần tiếp tục phát huy công tác tuyên truyền.',
    });
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

describe('áp dụng tiêu chí theo COL.01.01', () => {
  it('luôn áp dụng cho toàn bộ địa phương', () => {
    useScoreStore.setState({ assignments: { ...S().assignments, [TC]: [LOC] } });

    S().applyCriteriaToAllLocalities(TC, [{ id: 'file-1', fileName: 'huong-dan.pdf', fileSize: 1024 }]);

    expect(S().assignments[TC]).toEqual(S().localities.map((locality) => locality.id));
    expect(S().criteriaTables.find((table) => table.id === TC)?.assignedLocalityCount).toBe(S().localities.length);
    expect(S().criteriaTables.find((table) => table.id === TC)?.assignmentAttachments?.[0]?.fileName).toBe('huong-dan.pdf');
  });
});

describe('ràng buộc chấm điểm theo FSD', () => {
  it('bắt buộc lý do khi điểm chuyên viên lệch điểm địa phương', () => {
    useScoreStore.setState({
      scores: {
        [TC]: {
          [LOC]: rec({
            state: 'CHO_CHUYEN_VIEN',
            entries: [{
              id: 'e1',
              criteriaId: 'c1',
              criteriaName: 'Tiêu chí 1',
              value: 8,
              proposedScore: 8,
              proposedBonusScore: 0,
              state: 'CHO_CHUYEN_VIEN',
              scoredBy: 'Địa phương',
              scoredAt: '',
              evidenceCount: 1,
            }],
          }),
        },
      },
    });

    expect(S().reviewCriterion({ tableId: TC, localityId: LOC, criteriaId: 'c1', score: 7, stage: 'SPECIALIST', actorName: 'CV', actorRole: 'SPECIALIST' })).toBe(false);
    expect(S().getScore(TC, LOC).entries[0].value).toBe(8);
    expect(S().reviewCriterion({ tableId: TC, localityId: LOC, criteriaId: 'c1', score: 7, reason: 'Thiếu một minh chứng', stage: 'SPECIALIST', actorName: 'CV', actorRole: 'SPECIALIST' })).toBe(true);
    expect(S().getScore(TC, LOC).entries[0].value).toBe(7);
  });

  it('tiêu chí bổ sung bắt buộc nội dung, lý do và file', () => {
    useScoreStore.setState({ scores: { [TC]: { [LOC]: rec({ state: 'CHO_CHUYEN_VIEN' }) } } });
    const base = { tableId: TC, localityId: LOC, name: 'Tiêu chí sáng kiến', score: 2, reason: 'Có sáng kiến cấp tỉnh', actorName: 'CV', actorRole: 'SPECIALIST' as const, stage: 'SPECIALIST' as const };
    expect(S().addSupplementaryCriterion({ ...base, fileName: '' })).toBe(false);
    expect(S().addSupplementaryCriterion({ ...base, fileName: 'qua-lon.pdf', fileSize: 20 * 1024 * 1024 + 1 })).toBe(false);
    expect(S().addSupplementaryCriterion({ ...base, fileName: 'sang-kien.pdf', fileSize: 1000 })).toBe(true);
    expect(S().getScore(TC, LOC).entries[0].isSupplementary).toBe(true);
  });
});
