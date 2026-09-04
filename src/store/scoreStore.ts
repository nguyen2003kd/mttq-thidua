import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CriteriaTable, CriteriaItem, Locality, Evidence, AuditEntry, ScoreEntry } from '@/types/domain';
import type { Role, ScoreState } from '@/types/rbac';

export interface ScoreRecord {
  state: ScoreState;
  entries: ScoreEntry[];
  totalScore: number;
  submittedAt: string | null;
  publishedAt: string | null;
}

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

function makeAudit(
  action: 'SCORE' | 'EDIT' | 'APPROVE' | 'REJECT' | 'PUBLISH',
  actorName: string,
  actorRole: Role,
  fieldName: string,
  oldValue: string | null,
  newValue: string,
  reason?: string | null,
): AuditEntry {
  return {
    id: uid(),
    timestamp: now(),
    actorName,
    actorRole,
    action,
    fieldName,
    oldValue,
    newValue,
    reason: reason ?? null,
  };
}

function evidenceCountFor(criteriaId: string, localityId: string, evidenceList: Evidence[]) {
  return evidenceList.filter((e) => e.criteriaId === criteriaId && e.localityId === localityId).length;
}

export interface ScoreStore {
  criteriaTables: CriteriaTable[];
  localities: Locality[];
  evidence: Evidence[];
  audits: AuditEntry[];
  deadline: string;
  scores: Record<string, Record<string, ScoreRecord>>; // tableId -> localityId -> record
  assignments: Record<string, string[]>; // tableId -> localityIds

  setDeadline: (date: string) => void;

  createCriteriaTable: (payload: {
    name: string;
    totalScore: number;
    openDate: string;
    closeDate: string;
    criteria: { name: string; maxScore: number }[];
  }) => string;
  updateCriteriaTable: (table: CriteriaTable) => void;
  deleteCriteriaTable: (id: string) => void;
  assignLocality: (tableId: string, localityId: string, assigned: boolean) => void;

  scoreCriterion: (
    tableId: string,
    localityId: string,
    criteriaId: string,
    value: number,
    scoredBy: string,
  ) => void;
  submit: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
  approve: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
  reject: (tableId: string, localityId: string, reason: string, actorName: string, actorRole: Role) => void;
  publish: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;

  uploadEvidence: (payload: { criteriaId: string; localityId: string; fileName: string; fileUrl: string }) => void;
  deleteEvidence: (id: string) => void;

  getScore: (tableId: string, localityId: string) => ScoreRecord;
  getScoreForLocality: (localityId: string) => { table: CriteriaTable; record: ScoreRecord } | null;
  getAuditsForLocality: (localityId: string) => AuditEntry[];
  getRanking: () => { locality: Locality; totalScore: number }[];
}

const defaultDeadline = `${new Date().getFullYear() + 1}-12-31`;

const initialTables: CriteriaTable[] = [
  {
    id: 'tc1',
    name: 'Bảng tiêu chí thi đua khen thưởng 2026',
    totalScore: 100,
    status: 'ACTIVE',
    assignedLocalityCount: 2,
    openDate: '2026-01-01',
    closeDate: '2026-12-31',
    criteria: [
      { id: 'c1', name: 'Tổ chức thực hiện nhiệm vụ chính trị', maxScore: 40, order: 1 },
      { id: 'c2', name: 'Kết quả hoạt động công tác Mặt trận', maxScore: 30, order: 2 },
      { id: 'c3', name: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', maxScore: 30, order: 3 },
    ],
  },
];

const initialLocalities: Locality[] = [
  { id: 'dp1', name: 'Hà Nội', district: 'Quận Hoàn Kiếm', ward: 'Phường Hàng Bài' },
  { id: 'dp2', name: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé' },
];

const initialScores: Record<string, Record<string, ScoreRecord>> = {
  tc1: {
    dp1: {
      state: 'DRAFT',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 30, state: 'DRAFT', scoredBy: 'Chuyên viên A', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 20, state: 'DRAFT', scoredBy: 'Chuyên viên A', scoredAt: now(), evidenceCount: 0 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 25, state: 'DRAFT', scoredBy: 'Chuyên viên A', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 75,
      submittedAt: null,
      publishedAt: null,
    },
    dp2: {
      state: 'CHO_DUYET_BAN',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 35, state: 'CHO_DUYET_BAN', scoredBy: 'Chuyên viên B', scoredAt: now(), evidenceCount: 2 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 25, state: 'CHO_DUYET_BAN', scoredBy: 'Chuyên viên B', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 20, state: 'CHO_DUYET_BAN', scoredBy: 'Chuyên viên B', scoredAt: now(), evidenceCount: 0 },
      ],
      totalScore: 80,
      submittedAt: now(),
      publishedAt: null,
    },
  },
};

const initialEvidence: Evidence[] = [
  { id: uid(), criteriaId: 'c1', localityId: 'dp1', fileName: 'bao-cao-2026.pdf', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c3', localityId: 'dp1', fileName: 'danh-sach-can-bo.xlsx', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c1', localityId: 'dp2', fileName: 'ke-hoach.pdf', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c2', localityId: 'dp2', fileName: 'minh-chung-hoat-dong.jpg', fileUrl: '#', uploadedAt: now() },
];

const initialAudits: AuditEntry[] = [
  makeAudit('SCORE', 'Chuyên viên A', 'SPECIALIST', 'c1 - dp1', null, '30', 'Chấm lần đầu'),
  makeAudit('SCORE', 'Chuyên viên A', 'SPECIALIST', 'c3 - dp1', null, '25', 'Chấm lần đầu'),
  makeAudit('SCORE', 'Chuyên viên B', 'SPECIALIST', 'c2 - dp2', null, '25', 'Hoàn thành bảng'),
  makeAudit('SCORE', 'Địa phương', 'LOCALITY', 'state - dp2', null, 'Nộp bảng điểm'),
];

export const useScoreStore = create<ScoreStore>()(
  persist(
    (set, get) => ({
      criteriaTables: initialTables,
      localities: initialLocalities,
      evidence: initialEvidence,
      audits: initialAudits,
      deadline: defaultDeadline,
      scores: initialScores,
      assignments: { tc1: ['dp1', 'dp2'] },

      setDeadline: (date) => set({ deadline: date }),

      createCriteriaTable: ({ name, totalScore, openDate, closeDate, criteria }) => {
        const id = uid();
        const criteriaItems: CriteriaItem[] = criteria.map((c, idx) => ({
          id: uid(),
          name: c.name,
          maxScore: c.maxScore,
          order: idx + 1,
        }));
        const table: CriteriaTable = {
          id,
          name,
          totalScore,
          status: 'ACTIVE',
          assignedLocalityCount: 0,
          openDate,
          closeDate,
          criteria: criteriaItems,
        };
        set((state) => ({
          criteriaTables: [...state.criteriaTables, table],
          assignments: { ...state.assignments, [id]: [] },
        }));
        return id;
      },

      updateCriteriaTable: (table) =>
        set((state) => ({
          criteriaTables: state.criteriaTables.map((t) => (t.id === table.id ? table : t)),
        })),

      deleteCriteriaTable: (id) =>
        set((state) => ({
          criteriaTables: state.criteriaTables.filter((t) => t.id !== id),
          scores: Object.fromEntries(Object.entries(state.scores).filter(([k]) => k !== id)),
          assignments: Object.fromEntries(Object.entries(state.assignments).filter(([k]) => k !== id)),
        })),

      assignLocality: (tableId, localityId, assigned) =>
        set((state) => {
          const current = new Set(state.assignments[tableId] ?? []);
          if (assigned) current.add(localityId);
          else current.delete(localityId);
          const list = Array.from(current);
          return {
            assignments: { ...state.assignments, [tableId]: list },
            criteriaTables: state.criteriaTables.map((t) =>
              t.id === tableId ? { ...t, assignedLocalityCount: list.length } : t,
            ),
          };
        }),

      scoreCriterion: (tableId, localityId, criteriaId, value, scoredBy) => {
        set((state) => {
          const table = state.criteriaTables.find((t) => t.id === tableId);
          if (!table) return state;
          const criteria = table.criteria.find((c) => c.id === criteriaId);
          if (!criteria) return state;
          const clamped = Math.max(0, Math.min(value, criteria.maxScore));

          const tableScores = { ...state.scores[tableId] };
          const record: ScoreRecord = tableScores[localityId]
            ? { ...tableScores[localityId] }
            : { state: 'DRAFT', entries: [], totalScore: 0, submittedAt: null, publishedAt: null };

          if (record.state === 'DA_CONG_BO') return state;

          const oldEntry = record.entries.find((e) => e.criteriaId === criteriaId);
          const newEntry: ScoreEntry = {
            id: oldEntry?.id ?? uid(),
            criteriaId,
            criteriaName: criteria.name,
            value: clamped,
            state: record.state,
            scoredBy,
            scoredAt: now(),
            evidenceCount: evidenceCountFor(criteriaId, localityId, state.evidence),
          };
          const entries = record.entries.filter((e) => e.criteriaId !== criteriaId);
          entries.push(newEntry);
          const totalScore = entries.reduce((sum, e) => sum + e.value, 0);
          const updatedRecord = { ...record, entries, totalScore };

          const action: 'SCORE' | 'EDIT' = oldEntry ? 'EDIT' : 'SCORE';
          const audit = makeAudit(
            action,
            scoredBy,
            'SPECIALIST',
            `${criteria.name} - ${localityId}`,
            oldEntry ? String(oldEntry.value) : null,
            String(clamped),
          );

          return {
            scores: { ...state.scores, [tableId]: { ...tableScores, [localityId]: updatedRecord } },
            audits: [...state.audits, audit],
          };
        });
      },

      submit: (tableId, localityId, actorName, actorRole) => {
        set((state) => {
          const record = get().getScore(tableId, localityId);
          if (record.state !== 'DRAFT' || record.totalScore === 0) return state;
          const updated = { ...record, state: 'CHO_DUYET_BAN' as ScoreState, submittedAt: now() };
          const audit = makeAudit(
            'SCORE',
            actorName,
            actorRole,
            `state - ${localityId}`,
            record.state,
            'CHO_DUYET_BAN',
          );
          return {
            scores: {
              ...state.scores,
              [tableId]: { ...state.scores[tableId], [localityId]: updated },
            },
            audits: [...state.audits, audit],
          };
        });
      },

      approve: (tableId, localityId, actorName, actorRole) => {
        set((state) => {
          const record = get().getScore(tableId, localityId);
          let next: ScoreState | null = null;
          if (record.state === 'CHO_DUYET_BAN') next = 'CHO_DUYET_HOI_DONG';
          else if (record.state === 'CHO_DUYET_HOI_DONG') next = 'CHO_DUYET_BTT';
          else if (record.state === 'CHO_DUYET_BTT') next = 'DA_CONG_BO';
          if (!next) return state;
          const updated = { ...record, state: next, publishedAt: next === 'DA_CONG_BO' ? now() : record.publishedAt };
          const audit = makeAudit(
            'APPROVE',
            actorName,
            actorRole,
            `state - ${localityId}`,
            record.state,
            next,
          );
          return {
            scores: {
              ...state.scores,
              [tableId]: { ...state.scores[tableId], [localityId]: updated },
            },
            audits: [...state.audits, audit],
          };
        });
      },

      reject: (tableId, localityId, reason, actorName, actorRole) => {
        set((state) => {
          const record = get().getScore(tableId, localityId);
          let next: ScoreState | null = null;
          if (record.state === 'CHO_DUYET_BAN') next = 'DRAFT';
          else if (record.state === 'CHO_DUYET_HOI_DONG') next = 'CHO_DUYET_BAN';
          else if (record.state === 'CHO_DUYET_BTT') next = 'CHO_DUYET_HOI_DONG';
          if (!next) return state;
          const updated = { ...record, state: next };
          const audit = makeAudit(
            'REJECT',
            actorName,
            actorRole,
            `state - ${localityId}`,
            record.state,
            next,
            reason,
          );
          return {
            scores: {
              ...state.scores,
              [tableId]: { ...state.scores[tableId], [localityId]: updated },
            },
            audits: [...state.audits, audit],
          };
        });
      },

      publish: (tableId, localityId, actorName, actorRole) => {
        set((state) => {
          const record = get().getScore(tableId, localityId);
          if (record.state !== 'CHO_DUYET_BTT') return state;
          const updated = { ...record, state: 'DA_CONG_BO' as ScoreState, publishedAt: now() };
          const audit = makeAudit(
            'PUBLISH',
            actorName,
            actorRole,
            `state - ${localityId}`,
            record.state,
            'DA_CONG_BO',
          );
          return {
            scores: {
              ...state.scores,
              [tableId]: { ...state.scores[tableId], [localityId]: updated },
            },
            audits: [...state.audits, audit],
          };
        });
      },

      uploadEvidence: ({ criteriaId, localityId, fileName, fileUrl }) => {
        set((state) => {
          const ev: Evidence = {
            id: uid(),
            criteriaId,
            localityId,
            fileName,
            fileUrl,
            uploadedAt: now(),
          };
          const evidence = [...state.evidence, ev];
          // update evidence counts in score entries
          const scores = { ...state.scores };
          Object.keys(scores).forEach((tableId) => {
            const table = state.criteriaTables.find((t) => t.id === tableId);
            if (!table || !table.criteria.some((c) => c.id === criteriaId)) return;
            const tableScores = { ...scores[tableId] };
            if (tableScores[localityId]) {
              const record = { ...tableScores[localityId] };
              record.entries = record.entries.map((e) =>
                e.criteriaId === criteriaId ? { ...e, evidenceCount: e.evidenceCount + 1 } : e,
              );
              tableScores[localityId] = record;
            }
            scores[tableId] = tableScores;
          });
          return { evidence, scores };
        });
      },

      deleteEvidence: (id) => {
        set((state) => {
          const ev = state.evidence.find((e) => e.id === id);
          if (!ev) return state;
          const evidence = state.evidence.filter((e) => e.id !== id);
          const scores = { ...state.scores };
          Object.keys(scores).forEach((tableId) => {
            const table = state.criteriaTables.find((t) => t.id === tableId);
            if (!table || !table.criteria.some((c) => c.id === ev.criteriaId)) return;
            const tableScores = { ...scores[tableId] };
            if (tableScores[ev.localityId]) {
              const record = { ...tableScores[ev.localityId] };
              record.entries = record.entries.map((e) =>
                e.criteriaId === ev.criteriaId ? { ...e, evidenceCount: Math.max(0, e.evidenceCount - 1) } : e,
              );
              tableScores[ev.localityId] = record;
            }
            scores[tableId] = tableScores;
          });
          return { evidence, scores };
        });
      },

      getScore: (tableId, localityId) => {
        const state = get();
        return (
          state.scores[tableId]?.[localityId] ?? {
            state: 'DRAFT',
            entries: [],
            totalScore: 0,
            submittedAt: null,
            publishedAt: null,
          }
        );
      },

      getScoreForLocality: (localityId) => {
        const state = get();
        const table = state.criteriaTables[0];
        if (!table) return null;
        const record = state.getScore(table.id, localityId);
        return { table, record };
      },

      getAuditsForLocality: (localityId) => {
        return get().audits.filter((a) => a.fieldName.includes(` - ${localityId}`));
      },

      getRanking: () => {
        const state = get();
        const table = state.criteriaTables[0];
        if (!table) return [];
        return state.localities
          .map((loc) => ({
            locality: loc,
            totalScore: state.getScore(table.id, loc.id).totalScore,
          }))
          .sort((a, b) => b.totalScore - a.totalScore);
      },
    }),
    { name: 'thidua-score' },
  ),
);
