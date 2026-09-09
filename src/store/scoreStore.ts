import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CriteriaTable,
  CriteriaTableAttachment,
  CriteriaItem,
  Locality,
  Evidence,
  AuditEntry,
  ScoreEntry,
  ScoreRecord,
} from '@/types/domain';
import type { Role } from '@/types/rbac';
import { uid, nowIso as now } from '@/lib/id';
import { applyTransition, isRecordComplete, type WorkflowAction } from '@/lib/state-machine';
import { vnWards } from '@/data/vn-wards';

export type { ScoreRecord } from '@/types/domain';

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

type TransitionState = {
  criteriaTables: CriteriaTable[];
  scores: Record<string, Record<string, ScoreRecord>>;
  audits: AuditEntry[];
  emptyRecord: ScoreRecord;
};

/**
 * Chạy một bước chuyển trạng thái qua state-machine. Trả patch cho store,
 * hoặc `null` nếu bước không hợp lệ (store no-op).
 */
function runTransition(
  state: TransitionState,
  tableId: string,
  localityId: string,
  action: WorkflowAction,
  actor: { name: string; role: Role },
  reason?: string | null,
): Pick<TransitionState, 'scores' | 'audits'> | null {
  const table = state.criteriaTables.find((t) => t.id === tableId);
  if (!table) return null;
  const record = state.scores[tableId]?.[localityId] ?? state.emptyRecord;

  const res = applyTransition({
    from: record.state,
    action,
    actor,
    localityId,
    reason,
    scoringComplete: action === 'submit' ? isRecordComplete(table, record) : undefined,
  });
  if (!res.ok) return null;

  const updated: ScoreRecord = {
    ...record,
    state: res.nextState,
    submittedAt: action === 'submit' ? now() : record.submittedAt,
    publishedAt: res.nextState === 'DA_CONG_BO' ? now() : record.publishedAt,
  };

  return {
    scores: { ...state.scores, [tableId]: { ...state.scores[tableId], [localityId]: updated } },
    audits: [...state.audits, { ...res.audit, id: uid(), timestamp: now() }],
  };
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
    content?: string;
    openDate: string;
    closeDate: string;
    note?: string;
    criteria: { name: string; maxScore: number; bonusScore?: number; deadline?: string; note?: string }[];
  }) => string;
  updateCriteriaTable: (table: CriteriaTable) => void;
  deleteCriteriaTable: (id: string) => void;
  assignLocality: (tableId: string, localityId: string, assigned: boolean) => void;
  setLocalityAssignments: (
    tableId: string,
    localityIds: string[],
    attachments?: CriteriaTableAttachment[],
  ) => void;

  createLocality: (payload: { code: string; name: string; fullName: string; unitType: Locality['unitType']; region: string }) => void;
  updateLocality: (locality: Locality) => void;
  deleteLocality: (id: string) => void;

  scoreCriterion: (
    tableId: string,
    localityId: string,
    criteriaId: string,
    value: number,
    scoredBy: string,
    actorRole: Role,
  ) => void;
  submit: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
  approve: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
  reject: (tableId: string, localityId: string, reason: string, actorName: string, actorRole: Role) => void;
  publish: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;

  uploadEvidence: (payload: { criteriaId: string; localityId: string; fileName: string; fileUrl: string }) => void;
  deleteEvidence: (id: string) => void;

  getScore: (tableId: string, localityId: string) => ScoreRecord;
  getActiveTableForLocality: (localityId: string) => CriteriaTable | null;
  getScoreForLocality: (
    localityId: string,
    tableId?: string,
  ) => { table: CriteriaTable; record: ScoreRecord } | null;
  getAuditsForLocality: (localityId: string) => AuditEntry[];
  getRanking: (tableId?: string) => { locality: Locality; totalScore: number }[];

  // Hằng số mặc định dùng khi chưa có record
  emptyRecord: ScoreRecord;
}

const defaultDeadline = `${new Date().getFullYear() + 1}-12-31`;

const initialTables: CriteriaTable[] = [
  {
    id: 'tc1',
    name: 'Bảng tiêu chí thi đua khen thưởng 2026',
    totalScore: 100,
    content: 'Đánh giá mức độ hoàn thành nhiệm vụ và chất lượng hoạt động thi đua, khen thưởng năm 2026.',
    status: 'ACTIVE',
    assignedLocalityCount: 2,
    openDate: '2026-01-01',
    closeDate: '2026-12-31',
    note: 'Áp dụng cho phong trào thi đua năm 2026.',
    updatedAt: '2026-01-01T08:00:00.000Z',
    updatedBy: 'Quản trị viên',
    criteria: [
      { id: 'c1', name: 'Tổ chức thực hiện nhiệm vụ chính trị', maxScore: 40, order: 1 },
      { id: 'c2', name: 'Kết quả hoạt động công tác Mặt trận', maxScore: 30, order: 2 },
      { id: 'c3', name: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', maxScore: 30, order: 3 },
    ],
  },
];

const dongNaiWards = vnWards.filter((w) => w.parentCode === '75');

const initialLocalities: Locality[] = dongNaiWards.map((w) => ({
  id: `loc-${w.code}`,
  code: w.code,
  name: w.name,
  fullName: w.name,
  unitType: w.name.startsWith('Phường') ? 'phuong' : 'xa',
  region: 'Đông Nam Bộ',
}));

const initialScores: Record<string, Record<string, ScoreRecord>> = {
  tc1: {
    'loc-25195': {
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
    'loc-26068': {
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
  { id: uid(), criteriaId: 'c1', localityId: 'loc-25195', fileName: 'bao-cao-2026.pdf', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c3', localityId: 'loc-25195', fileName: 'danh-sach-can-bo.xlsx', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c1', localityId: 'loc-26068', fileName: 'ke-hoach.pdf', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c2', localityId: 'loc-26068', fileName: 'minh-chung-hoat-dong.jpg', fileUrl: '#', uploadedAt: now() },
];

const initialAudits: AuditEntry[] = [
  makeAudit('SCORE', 'Chuyên viên A', 'SPECIALIST', 'c1 - loc-25195', null, '30', 'Chấm lần đầu'),
  makeAudit('SCORE', 'Chuyên viên A', 'SPECIALIST', 'c3 - loc-25195', null, '25', 'Chấm lần đầu'),
  makeAudit('SCORE', 'Chuyên viên B', 'SPECIALIST', 'c2 - loc-26068', null, '25', 'Hoàn thành bảng'),
  makeAudit('SCORE', 'Địa phương', 'LOCALITY', 'state - loc-26068', null, 'Nộp bảng điểm'),
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
      assignments: { tc1: ['loc-25195', 'loc-26068'] },

      setDeadline: (date) => set({ deadline: date }),

      createLocality: ({ code, name, fullName, unitType, region }) =>
        set((state) => {
          if (state.localities.some((l) => l.code === code)) return state;
          const locality: Locality = { id: uid(), code, name, fullName, unitType, region };
          return { localities: [...state.localities, locality] };
        }),

      updateLocality: (locality) =>
        set((state) => ({
          localities: state.localities.map((l) => (l.id === locality.id ? locality : l)),
        })),

      deleteLocality: (id) =>
        set((state) => ({
          localities: state.localities.filter((l) => l.id !== id),
          assignments: Object.fromEntries(
            Object.entries(state.assignments).map(([k, v]) => [k, v.filter((lid) => lid !== id)]),
          ),
        })),

      createCriteriaTable: ({ name, totalScore, content, openDate, closeDate, note, criteria }) => {
        const id = uid();
        const criteriaItems: CriteriaItem[] = criteria.map((c, idx) => ({
          id: uid(),
          name: c.name,
          maxScore: c.maxScore,
          bonusScore: c.bonusScore,
          deadline: c.deadline,
          note: c.note,
          order: idx + 1,
        }));
        const table: CriteriaTable = {
          id,
          name,
          totalScore,
          content: content?.trim() || undefined,
          status: 'ACTIVE',
          assignedLocalityCount: 0,
          openDate,
          closeDate,
          note: note?.trim() || undefined,
          updatedAt: now(),
          updatedBy: 'Quản trị viên',
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
          criteriaTables: state.criteriaTables.map((t) =>
            t.id === table.id ? { ...table, updatedAt: now(), updatedBy: 'Quản trị viên' } : t,
          ),
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

      setLocalityAssignments: (tableId, localityIds, attachments) =>
        set((state) => {
          const availableIds = new Set(state.localities.map((locality) => locality.id));
          const list = Array.from(new Set(localityIds)).filter((localityId) => availableIds.has(localityId));

          return {
            assignments: { ...state.assignments, [tableId]: list },
            criteriaTables: state.criteriaTables.map((table) =>
              table.id === tableId
                ? {
                    ...table,
                    assignedLocalityCount: list.length,
                    assignmentAttachments: attachments ?? table.assignmentAttachments,
                  }
                : table,
            ),
          };
        }),

      scoreCriterion: (tableId, localityId, criteriaId, value, scoredBy, actorRole) => {
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
            actorRole,
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

      submit: (tableId, localityId, actorName, actorRole) =>
        set((s) => runTransition(s, tableId, localityId, 'submit', { name: actorName, role: actorRole }) ?? s),

      approve: (tableId, localityId, actorName, actorRole) =>
        set((s) => runTransition(s, tableId, localityId, 'approve', { name: actorName, role: actorRole }) ?? s),

      reject: (tableId, localityId, reason, actorName, actorRole) =>
        set(
          (s) =>
            runTransition(s, tableId, localityId, 'reject', { name: actorName, role: actorRole }, reason) ?? s,
        ),

      publish: (tableId, localityId, actorName, actorRole) =>
        set((s) => runTransition(s, tableId, localityId, 'publish', { name: actorName, role: actorRole }) ?? s),

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

      getActiveTableForLocality: (localityId) => {
        const state = get();
        const assignedTableIds = Object.entries(state.assignments)
          .filter(([, ids]) => ids.includes(localityId))
          .map(([tid]) => tid);
        const tables = state.criteriaTables.filter((t) => assignedTableIds.includes(t.id));
        return tables.find((t) => t.status === 'ACTIVE') ?? tables[0] ?? null;
      },

      getScoreForLocality: (localityId, tableId) => {
        const state = get();
        const table = tableId
          ? (state.criteriaTables.find((t) => t.id === tableId) ?? null)
          : state.getActiveTableForLocality(localityId);
        if (!table) return null;
        return { table, record: state.getScore(table.id, localityId) };
      },

      getAuditsForLocality: (localityId) => {
        const suffix = ` - ${localityId}`;
        return get().audits.filter((a) => a.fieldName.endsWith(suffix));
      },

      getRanking: (tableId) => {
        const state = get();
        const table = tableId
          ? state.criteriaTables.find((t) => t.id === tableId)
          : (state.criteriaTables.find((t) => t.status === 'ACTIVE') ?? state.criteriaTables[0]);
        if (!table) return [];
        const assigned = new Set(state.assignments[table.id] ?? []);
        return state.localities
          .filter((loc) => assigned.has(loc.id))
          .map((loc) => ({
            locality: loc,
            totalScore: state.getScore(table.id, loc.id).totalScore,
          }))
          .sort((a, b) => b.totalScore - a.totalScore);
      },

      emptyRecord: {
        state: 'DRAFT',
        entries: [],
        totalScore: 0,
        submittedAt: null,
        publishedAt: null,
      },
    }),
    {
      name: 'thidua-score',
      partialize: (s) => ({
        criteriaTables: s.criteriaTables,
        localities: s.localities,
        evidence: s.evidence,
        audits: s.audits,
        deadline: s.deadline,
        scores: s.scores,
        assignments: s.assignments,
      }),
    },
  ),
);
