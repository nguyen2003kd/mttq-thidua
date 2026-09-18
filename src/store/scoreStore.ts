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
  ScoringStage,
} from '@/types/domain';
import type { Role } from '@/types/rbac';
import { uid, nowIso as now } from '@/lib/id';
import { applyTransition, isRecordComplete, type WorkflowAction } from '@/lib/state-machine';
import { vnWards } from '@/data/vn-wards';

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

export type { ScoreRecord } from '@/types/domain';

/** Nhận xét Ban thường trực gửi chung đến tất cả địa phương. */
export interface GeneralCommitteeComment {
  id: string;
  content: string;
  attachment?: CriteriaTableAttachment;
  sentAt: string;
  actorName: string;
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
    entries: action === 'submit' && record.state === 'CHO_CHUYEN_VIEN'
      ? record.entries.map((entry) => ({ ...entry, revisionRequest: null }))
      : record.entries,
    submittedAt: action === 'submit' ? now() : record.submittedAt,
    publishedAt: res.nextState === 'DA_CONG_BO' ? now() : record.publishedAt,
    revisionRequestedAt: action === 'submit' && record.state === 'CHO_CHUYEN_VIEN'
      ? null
      : record.revisionRequestedAt,
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
  generalCommitteeComments: GeneralCommitteeComment[];
  deadline: string;
  scores: Record<string, Record<string, ScoreRecord>>; // tableId -> localityId -> record
  assignments: Record<string, string[]>; // tableId -> localityIds
  /** tableId -> localityId -> criteriaIds bị khóa sau khi tiêu chí đã áp dụng bị sửa. */
  lockedCriteria: Record<string, Record<string, string[]>>;

  setDeadline: (date: string) => void;

  createCriteriaTable: (payload: {
    name: string;
    totalScore: number;
    content?: string;
    openDate: string;
    closeDate: string;
    note?: string;
    updatedBy?: string;
    criteria: { name: string; maxScore: number; bonusScore?: number; deadline?: string; note?: string }[];
  }) => string;
  updateCriteriaTable: (table: CriteriaTable) => void;
  deleteCriteriaTable: (id: string) => void;
  setLocalityAssignments: (
    tableId: string,
    localityIds: string[],
    attachments?: CriteriaTableAttachment[],
  ) => void;
  applyCriteriaToAllLocalities: (tableId: string, attachments?: CriteriaTableAttachment[]) => void;

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
  saveSelfAssessment: (payload: {
    tableId: string;
    localityId: string;
    criteriaId: string;
    proposedScore: number;
    proposedBonusScore: number;
    explanation: string;
    actorName: string;
  }) => boolean;
  reviewCriterion: (payload: {
    tableId: string;
    localityId: string;
    criteriaId: string;
    score: number;
    bonusScore?: number;
    reason?: string;
    stage: Exclude<ScoringStage, 'LOCAL'>;
    actorName: string;
    actorRole: Role;
  }) => boolean;
  addSupplementaryCriterion: (payload: {
    tableId: string;
    localityId: string;
    name: string;
    score: number;
    reason: string;
    fileName: string;
    fileSize?: number;
    actorName: string;
    actorRole: Role;
    stage: Exclude<ScoringStage, 'LOCAL'>;
  }) => boolean;
  requestRevision: (
    tableId: string,
    localityId: string,
    criteriaId: string | null,
    reason: string,
    actorName: string,
    actorRole: Role,
  ) => boolean;
  /** Lưu nhận xét không làm thay đổi trạng thái hồ sơ. */
  addComment: (
    tableId: string,
    localityId: string,
    comment: string,
    actorName: string,
    actorRole: Role,
  ) => boolean;
  /** Lưu nhận xét chung và ghi nhận việc gửi đến toàn bộ địa phương. */
  sendGeneralCommitteeComment: (payload: {
    content: string;
    attachment?: CriteriaTableAttachment;
    actorName: string;
    actorRole: Role;
  }) => boolean;
  submit: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
  approve: (tableId: string, localityId: string, actorName: string, actorRole: Role) => void;
  reject: (tableId: string, localityId: string, reason: string, actorName: string, actorRole: Role) => void;
  publish: (
    tableId: string,
    localityId: string,
    actorName: string,
    actorRole: Role,
    decisionAttachments?: CriteriaTableAttachment[],
    /** Nhận xét công bố hiển thị lại trong lịch sử và kết quả địa phương. */
    publicationComment?: string,
  ) => void;

  uploadEvidence: (payload: {
    id?: string;
    criteriaId: string;
    localityId: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    description?: string;
    kind?: Evidence['kind'];
  }) => void;
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
      { id: 'c2', name: 'Kết quả hoạt động công tác Mặt trận', maxScore: 30, bonusScore: 3, order: 2 },
      { id: 'c3', name: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', maxScore: 30, bonusScore: 2, order: 3 },
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
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 30, proposedScore: 30, proposedBonusScore: 0, explanation: 'Hoàn thành kế hoạch công tác năm.', revisionRequest: 'Bổ sung quyết định ban hành kế hoạch và làm rõ tiến độ thực hiện.', state: 'DRAFT', scoredBy: 'Phường Bình Phước', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 20, proposedScore: 20, proposedBonusScore: 0, explanation: 'Các phong trào đạt chỉ tiêu giao.', revisionRequest: null, state: 'DRAFT', scoredBy: 'Phường Bình Phước', scoredAt: now(), evidenceCount: 0 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 25, proposedScore: 25, proposedBonusScore: 0, explanation: 'Cán bộ hoàn thành bồi dưỡng nghiệp vụ.', revisionRequest: null, state: 'DRAFT', scoredBy: 'Phường Bình Phước', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 75,
      submittedAt: '2026-08-28T02:30:00.000Z',
      publishedAt: null,
      revisionRequestedAt: '2026-09-02T03:15:00.000Z',
    },
    'loc-26068': {
      state: 'CHO_CHUYEN_VIEN',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 36, proposedScore: 36, proposedBonusScore: 0, explanation: 'Hoàn thành 9/10 nhiệm vụ trọng tâm.', state: 'CHO_CHUYEN_VIEN', scoredBy: 'Phường Phước Tân', scoredAt: now(), evidenceCount: 2 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 25, proposedScore: 25, proposedBonusScore: 0, explanation: 'Đạt đầy đủ chỉ tiêu.', state: 'CHO_CHUYEN_VIEN', scoredBy: 'Phường Phước Tân', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 20, proposedScore: 20, proposedBonusScore: 0, explanation: 'Đội ngũ đáp ứng yêu cầu.', state: 'CHO_CHUYEN_VIEN', scoredBy: 'Phường Phước Tân', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 81,
      submittedAt: now(),
      publishedAt: null,
    },
    'loc-25210': {
      state: 'CHO_DUYET_HOI_DONG',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 38, proposedScore: 38, proposedBonusScore: 0, explanation: 'Hoàn thành tốt nhiệm vụ.', state: 'CHO_DUYET_HOI_DONG', scoredBy: 'Lãnh đạo Ban', scoredAt: now(), evidenceCount: 2 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 27, proposedScore: 28, proposedBonusScore: 0, explanation: 'Phong trào có sức lan tỏa.', state: 'CHO_DUYET_HOI_DONG', scoredBy: 'Lãnh đạo Ban', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 26, proposedScore: 26, proposedBonusScore: 0, explanation: 'Đội ngũ ổn định.', state: 'CHO_DUYET_HOI_DONG', scoredBy: 'Lãnh đạo Ban', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 91,
      submittedAt: '2026-08-26T02:00:00.000Z',
      publishedAt: null,
    },
    'loc-25222': {
      state: 'CHO_DUYET_BAN',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 34, proposedScore: 35, proposedBonusScore: 0, explanation: 'Hoàn thành phần lớn nhiệm vụ.', state: 'CHO_DUYET_BAN', scoredBy: 'Chuyên viên Thi đua', scoredAt: now(), evidenceCount: 1, stageScores: { SPECIALIST: { score: 34, bonusScore: 0, reason: 'Một nhiệm vụ chưa đủ căn cứ xác nhận.', actorName: 'Chuyên viên Thi đua', updatedAt: now() } } },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 26, proposedScore: 26, proposedBonusScore: 0, explanation: 'Hoàn thành chỉ tiêu phong trào.', state: 'CHO_DUYET_BAN', scoredBy: 'Chuyên viên Thi đua', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 25, proposedScore: 25, proposedBonusScore: 0, explanation: 'Đội ngũ đáp ứng yêu cầu.', state: 'CHO_DUYET_BAN', scoredBy: 'Chuyên viên Thi đua', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 85,
      submittedAt: '2026-08-27T02:00:00.000Z',
      publishedAt: null,
    },
    'loc-25217': {
      state: 'CHO_DUYET_BTT',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 39, proposedScore: 39, proposedBonusScore: 0, explanation: 'Hoàn thành xuất sắc.', state: 'CHO_DUYET_BTT', scoredBy: 'Hội đồng TĐKT', scoredAt: now(), evidenceCount: 2 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 28, proposedScore: 28, proposedBonusScore: 0, explanation: 'Nhiều mô hình mới.', state: 'CHO_DUYET_BTT', scoredBy: 'Hội đồng TĐKT', scoredAt: now(), evidenceCount: 2 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 28, proposedScore: 28, proposedBonusScore: 0, explanation: '100% cán bộ hoàn thành bồi dưỡng.', state: 'CHO_DUYET_BTT', scoredBy: 'Hội đồng TĐKT', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 95,
      submittedAt: '2026-08-25T02:00:00.000Z',
      publishedAt: null,
    },
    'loc-25220': {
      state: 'DA_CONG_BO',
      entries: [
        { id: uid(), criteriaId: 'c1', criteriaName: 'Tổ chức thực hiện nhiệm vụ chính trị', value: 37, proposedScore: 38, proposedBonusScore: 0, explanation: 'Hoàn thành tốt.', state: 'DA_CONG_BO', scoredBy: 'Ủy ban Thường trực', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c2', criteriaName: 'Kết quả hoạt động công tác Mặt trận', value: 27, proposedScore: 27, proposedBonusScore: 0, explanation: 'Đạt chỉ tiêu.', state: 'DA_CONG_BO', scoredBy: 'Ủy ban Thường trực', scoredAt: now(), evidenceCount: 1 },
        { id: uid(), criteriaId: 'c3', criteriaName: 'Chất lượng đội ngũ cán bộ MTTQ cơ sở', value: 27, proposedScore: 27, proposedBonusScore: 0, explanation: 'Đội ngũ đảm bảo.', state: 'DA_CONG_BO', scoredBy: 'Ủy ban Thường trực', scoredAt: now(), evidenceCount: 1 },
      ],
      totalScore: 91,
      submittedAt: '2026-08-20T02:00:00.000Z',
      publishedAt: '2026-09-05T02:00:00.000Z',
      decisionAttachments: [{ id: 'qd-01', fileName: 'Quyet-dinh-cong-bo-ket-qua-2026.pdf', fileSize: 1480000 }],
    },
  },
};

const initialEvidence: Evidence[] = [
  { id: uid(), criteriaId: 'c1', localityId: 'loc-25195', fileName: 'bao-cao-2026.pdf', fileUrl: '#', uploadedAt: now(), fileSize: 842000, description: 'Báo cáo kết quả thực hiện nhiệm vụ', kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c3', localityId: 'loc-25195', fileName: 'danh-sach-can-bo.xlsx', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c1', localityId: 'loc-26068', fileName: 'ke-hoach.pdf', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c2', localityId: 'loc-26068', fileName: 'minh-chung-hoat-dong.jpg', fileUrl: '#', uploadedAt: now() },
  { id: uid(), criteriaId: 'c3', localityId: 'loc-26068', fileName: 'bao-cao-can-bo.pdf', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c1', localityId: 'loc-25210', fileName: 'ke-hoach-dong-xoai.pdf', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c1', localityId: 'loc-25222', fileName: 'ke-hoach-bu-gia-map.pdf', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c2', localityId: 'loc-25222', fileName: 'bao-cao-phong-trao.pdf', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c3', localityId: 'loc-25222', fileName: 'danh-sach-boi-duong.xlsx', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c1', localityId: 'loc-25217', fileName: 'bao-cao-phuoc-long.pdf', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
  { id: uid(), criteriaId: 'c1', localityId: 'loc-25220', fileName: 'bao-cao-phuoc-binh.pdf', fileUrl: '#', uploadedAt: now(), kind: 'STANDARD' },
];

const initialAudits: AuditEntry[] = [
  makeAudit('SCORE', 'Chuyên viên A', 'SPECIALIST', 'c1 - loc-25195', null, '30', 'Chấm lần đầu'),
  makeAudit('SCORE', 'Chuyên viên A', 'SPECIALIST', 'c3 - loc-25195', null, '25', 'Chấm lần đầu'),
  makeAudit('SCORE', 'Chuyên viên B', 'SPECIALIST', 'c2 - loc-26068', null, '25', 'Hoàn thành bảng'),
  makeAudit('SCORE', 'Địa phương', 'LOCAL', 'state - loc-26068', null, 'Nộp bảng điểm'),
];

export const useScoreStore = create<ScoreStore>()(
  persist(
    (set, get) => ({
      criteriaTables: initialTables,
      localities: initialLocalities,
      evidence: initialEvidence,
      audits: initialAudits,
      generalCommitteeComments: [],
      deadline: defaultDeadline,
      scores: initialScores,
      assignments: { tc1: ['loc-25195', 'loc-26068', 'loc-25210', 'loc-25222', 'loc-25217', 'loc-25220'] },
      lockedCriteria: { tc1: {} },

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

      createCriteriaTable: ({ name, totalScore, content, openDate, closeDate, note, updatedBy, criteria }) => {
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
          updatedBy: updatedBy ?? 'Quản trị viên',
          criteria: criteriaItems,
        };
        set((state) => ({
          criteriaTables: [...state.criteriaTables, table],
          assignments: { ...state.assignments, [id]: [] },
          lockedCriteria: { ...state.lockedCriteria, [id]: {} },
        }));
        return id;
      },

      updateCriteriaTable: (table) =>
        set((state) => {
          const previous = state.criteriaTables.find((item) => item.id === table.id);
          const applied = Boolean(previous && (state.assignments[table.id]?.length ?? 0) > 0);
          const groupChanged = Boolean(previous && (
            previous.name !== table.name ||
            previous.content !== table.content ||
            previous.totalScore !== table.totalScore ||
            previous.closeDate !== table.closeDate ||
            previous.note !== table.note
          ));
          const changedIds = previous
            ? (groupChanged ? previous.criteria.map((item) => item.id) : previous.criteria
                .filter((oldItem) => {
                  const nextItem = table.criteria.find((item) => item.id === oldItem.id);
                  return !nextItem ||
                    oldItem.name !== nextItem.name ||
                    oldItem.maxScore !== nextItem.maxScore ||
                    oldItem.bonusScore !== nextItem.bonusScore ||
                    oldItem.deadline !== nextItem.deadline;
                })
                .map((item) => item.id))
            : [];

          const lockedCriteria = { ...state.lockedCriteria };
          const scores = { ...state.scores };
          const audits = [...state.audits];
          if (applied && changedIds.length > 0) {
            const tableLocks = { ...(lockedCriteria[table.id] ?? {}) };
            const tableScores = { ...(scores[table.id] ?? {}) };
            (state.assignments[table.id] ?? []).forEach((localityId) => {
              tableLocks[localityId] = Array.from(new Set([...(tableLocks[localityId] ?? []), ...changedIds]));
              const record = tableScores[localityId];
              if (record) {
                tableScores[localityId] = {
                  ...record,
                  entries: record.entries.map((entry) =>
                    changedIds.includes(entry.criteriaId) ? { ...entry, locked: true } : entry,
                  ),
                };
              }
              changedIds.forEach((criteriaId) => {
                audits.push(makeAudit(
                  'EDIT',
                  table.updatedBy ?? 'Quản trị viên',
                  'SPECIALIST',
                  `${criteriaId} - ${localityId}`,
                  'Đang áp dụng',
                  'Đã cập nhật và khóa nhập liệu',
                  'Thông báo thay đổi tiêu chí đã được gửi đến địa phương',
                ));
              });
            });
            lockedCriteria[table.id] = tableLocks;
            scores[table.id] = tableScores;
          }

          return {
            criteriaTables: state.criteriaTables.map((item) =>
              item.id === table.id
                ? {
                    ...table,
                    updatedAt: now(),
                    updatedBy: table.updatedBy ?? 'Quản trị viên',
                    criteria: table.criteria.map((criterion) => ({ ...criterion, updatedAt: now() })),
                  }
                : item,
            ),
            lockedCriteria,
            scores,
            audits,
          };
        }),

      deleteCriteriaTable: (id) =>
        set((state) => ({
          criteriaTables: state.criteriaTables.filter((t) => t.id !== id),
          scores: Object.fromEntries(Object.entries(state.scores).filter(([k]) => k !== id)),
          assignments: Object.fromEntries(Object.entries(state.assignments).filter(([k]) => k !== id)),
          lockedCriteria: Object.fromEntries(Object.entries(state.lockedCriteria).filter(([k]) => k !== id)),
        })),

      setLocalityAssignments: (tableId, localityIds, attachments) =>
        set((state) => {
          if (!state.criteriaTables.some((table) => table.id === tableId)) return state;
          if (attachments?.some((file) => file.fileSize > MAX_UPLOAD_SIZE)) return state;

          const validLocalityIds = [...new Set(localityIds)].filter((localityId) =>
            state.localities.some((locality) => locality.id === localityId),
          );

          return {
            assignments: { ...state.assignments, [tableId]: validLocalityIds },
            criteriaTables: state.criteriaTables.map((table) =>
              table.id === tableId
                ? {
                    ...table,
                    assignedLocalityCount: validLocalityIds.length,
                    assignmentAttachments: attachments ?? table.assignmentAttachments,
                  }
                : table,
            ),
          };
        }),

      applyCriteriaToAllLocalities: (tableId, attachments) =>
        set((state) => {
          if (attachments?.some((file) => file.fileSize > MAX_UPLOAD_SIZE)) return state;
          const localityIds = state.localities.map((locality) => locality.id);

          return {
            assignments: { ...state.assignments, [tableId]: localityIds },
            criteriaTables: state.criteriaTables.map((table) =>
              table.id === tableId
                ? {
                    ...table,
                    assignedLocalityCount: localityIds.length,
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

      saveSelfAssessment: ({
        tableId,
        localityId,
        criteriaId,
        proposedScore,
        proposedBonusScore,
        explanation,
        actorName,
      }) => {
        const state = get();
        const table = state.criteriaTables.find((item) => item.id === tableId);
        const criterion = table?.criteria.find((item) => item.id === criteriaId);
        const record = state.scores[tableId]?.[localityId];
        const locked = state.lockedCriteria[tableId]?.[localityId]?.includes(criteriaId);
        if (!table || !criterion || record?.state === 'DA_CONG_BO' || locked || !explanation.trim()) return false;
        if (proposedScore < 0 || proposedScore > criterion.maxScore) return false;
        if (proposedBonusScore < 0 || proposedBonusScore > (criterion.bonusScore ?? 0)) return false;

        set((current) => {
          const tableScores = { ...(current.scores[tableId] ?? {}) };
          const currentRecord = tableScores[localityId] ?? current.emptyRecord;
          if (currentRecord.state !== 'DRAFT') return current;
          const oldEntry = currentRecord.entries.find((entry) => entry.criteriaId === criteriaId);
          const value = proposedScore + proposedBonusScore;
          const updatedEntry: ScoreEntry = {
            id: oldEntry?.id ?? uid(),
            criteriaId,
            criteriaName: criterion.name,
            value,
            proposedScore,
            proposedBonusScore,
            explanation: explanation.trim(),
            revisionRequest: null,
            locked: false,
            state: 'DRAFT',
            scoredBy: actorName,
            scoredAt: now(),
            evidenceCount: evidenceCountFor(criteriaId, localityId, current.evidence),
            stageScores: {
              ...oldEntry?.stageScores,
              LOCAL: {
                score: proposedScore,
                bonusScore: proposedBonusScore,
                reason: null,
                actorName,
                updatedAt: now(),
              },
            },
          };
          const entries = currentRecord.entries.filter((entry) => entry.criteriaId !== criteriaId);
          entries.push(updatedEntry);
          return {
            scores: {
              ...current.scores,
              [tableId]: {
                ...tableScores,
                [localityId]: {
                  ...currentRecord,
                  entries,
                  totalScore: entries.reduce((sum, entry) => sum + entry.value, 0),
                  revisionRequestedAt: entries.some((entry) => entry.revisionRequest)
                    ? currentRecord.revisionRequestedAt
                    : null,
                },
              },
            },
            audits: [
              ...current.audits,
              makeAudit(
                oldEntry ? 'EDIT' : 'SCORE',
                actorName,
                'LOCAL',
                `${criterion.name} - ${localityId}`,
                oldEntry ? String(oldEntry.value) : null,
                String(value),
                'Địa phương cập nhật tự đánh giá',
              ),
            ],
          };
        });
        return true;
      },

      reviewCriterion: ({
        tableId,
        localityId,
        criteriaId,
        score,
        bonusScore = 0,
        reason,
        stage,
        actorName,
        actorRole,
      }) => {
        const state = get();
        const record = state.scores[tableId]?.[localityId];
        const entry = record?.entries.find((item) => item.criteriaId === criteriaId);
        const criterion = state.criteriaTables
          .find((item) => item.id === tableId)
          ?.criteria.find((item) => item.id === criteriaId);
        const maxScore = entry?.isSupplementary ? (entry.supplementaryMaxScore ?? score) : criterion?.maxScore;
        const maxBonus = entry?.isSupplementary ? 0 : (criterion?.bonusScore ?? 0);
        if (!record || !entry || maxScore === undefined || score < 0 || score > maxScore) return false;
        if (bonusScore < 0 || bonusScore > maxBonus) return false;
        const differs = score !== (entry.proposedScore ?? entry.value) || bonusScore !== (entry.proposedBonusScore ?? 0);
        if ((differs || entry.isSupplementary) && !reason?.trim()) return false;

        set((current) => {
          const tableScores = { ...(current.scores[tableId] ?? {}) };
          const currentRecord = tableScores[localityId];
          if (!currentRecord || currentRecord.state === 'DA_CONG_BO') return current;
          const entries = currentRecord.entries.map((item) =>
            item.criteriaId === criteriaId
              ? {
                  ...item,
                  value: score + bonusScore,
                  scoredBy: actorName,
                  scoredAt: now(),
                  stageScores: {
                    ...item.stageScores,
                    [stage]: {
                      score,
                      bonusScore,
                      reason: reason?.trim() || null,
                      actorName,
                      updatedAt: now(),
                    },
                  },
                }
              : item,
          );
          return {
            scores: {
              ...current.scores,
              [tableId]: {
                ...tableScores,
                [localityId]: {
                  ...currentRecord,
                  entries,
                  totalScore: entries.reduce((sum, item) => sum + item.value, 0),
                },
              },
            },
            audits: [
              ...current.audits,
              makeAudit('EDIT', actorName, actorRole, `${entry.criteriaName} - ${localityId}`, String(entry.value), String(score + bonusScore), reason),
            ],
          };
        });
        return true;
      },

      addSupplementaryCriterion: ({
        tableId,
        localityId,
        name,
        score,
        reason,
        fileName,
        fileSize,
        actorName,
        actorRole,
        stage,
      }) => {
        if (!name.trim() || score < 0 || !reason.trim() || !fileName.trim() || (fileSize ?? 0) > MAX_UPLOAD_SIZE) return false;
        const state = get();
        const record = state.scores[tableId]?.[localityId];
        if (!record || record.state === 'DA_CONG_BO') return false;
        const criteriaId = `supp-${uid()}`;
        const timestamp = now();
        const entry: ScoreEntry = {
          id: uid(),
          criteriaId,
          criteriaName: name.trim(),
          value: score,
          proposedScore: 0,
          proposedBonusScore: 0,
          explanation: reason.trim(),
          state: record.state,
          scoredBy: actorName,
          scoredAt: timestamp,
          evidenceCount: 1,
          isSupplementary: true,
          supplementaryMaxScore: score,
          stageScores: {
            [stage]: { score, bonusScore: 0, reason: reason.trim(), actorName, updatedAt: timestamp },
          },
        };
        set((current) => {
          const tableScores = { ...(current.scores[tableId] ?? {}) };
          const currentRecord = tableScores[localityId];
          if (!currentRecord) return current;
          const entries = [...currentRecord.entries, entry];
          const evidenceItem: Evidence = {
            id: uid(),
            criteriaId,
            localityId,
            fileName: fileName.trim(),
            fileUrl: '#',
            fileSize,
            description: reason.trim(),
            kind: 'SUPPLEMENTARY',
            uploadedAt: timestamp,
          };
          return {
            scores: {
              ...current.scores,
              [tableId]: {
                ...tableScores,
                [localityId]: {
                  ...currentRecord,
                  entries,
                  totalScore: entries.reduce((sum, item) => sum + item.value, 0),
                },
              },
            },
            evidence: [...current.evidence, evidenceItem],
            audits: [
              ...current.audits,
              makeAudit('SCORE', actorName, actorRole, `${entry.criteriaName} - ${localityId}`, null, String(score), reason),
            ],
          };
        });
        return true;
      },

      requestRevision: (tableId, localityId, criteriaId, reason, actorName, actorRole) => {
        if (!reason.trim()) return false;
        const state = get();
        const record = state.scores[tableId]?.[localityId];
        if (!record || record.state === 'DRAFT' || record.state === 'DA_CONG_BO') return false;
        const patch = runTransition(state, tableId, localityId, 'reject', { name: actorName, role: actorRole }, reason);
        if (!patch) return false;
        const transitioned = patch.scores[tableId][localityId];
        const entries = transitioned.entries.map((entry) =>
          !criteriaId || entry.criteriaId === criteriaId
            ? { ...entry, revisionRequest: reason.trim(), locked: false, state: transitioned.state }
            : entry,
        );
        set({
          scores: {
            ...patch.scores,
            [tableId]: {
              ...patch.scores[tableId],
              [localityId]: { ...transitioned, entries, revisionRequestedAt: now() },
            },
          },
          audits: patch.audits,
        });
        return true;
      },

      addComment: (tableId, localityId, comment, actorName, actorRole) => {
        const reason = comment.trim();
        const record = get().scores[tableId]?.[localityId];
        if (!record || !reason || record.state === 'DA_CONG_BO') return false;

        set((state) => ({
          audits: [
            ...state.audits,
            makeAudit(
              'EDIT',
              actorName,
              actorRole,
              `Nhận xét Hội đồng - ${localityId}`,
              null,
              'Đã gửi nhận xét',
              reason,
            ),
          ],
        }));
        return true;
      },

      sendGeneralCommitteeComment: ({ content, attachment, actorName, actorRole }) => {
        const message = content.trim();
        if (!message) return false;
        const sentAt = now();
        set((state) => ({
          generalCommitteeComments: [
            ...state.generalCommitteeComments,
            { id: uid(), content: message, attachment, sentAt, actorName },
          ],
          audits: [
            ...state.audits,
            ...state.localities.map((locality) => makeAudit(
              'EDIT',
              actorName,
              actorRole,
              `Nhận xét chung phong trào thi đua - ${locality.id}`,
              null,
              'Đã gửi thông báo đến địa phương',
              attachment ? `${message}\n\nTập tin đính kèm: ${attachment.fileName}` : message,
            )),
          ],
        }));
        return true;
      },

      submit: (tableId, localityId, actorName, actorRole) =>
        set((s) => runTransition(s, tableId, localityId, 'submit', { name: actorName, role: actorRole }) ?? s),

      approve: (tableId, localityId, actorName, actorRole) =>
        set((s) => runTransition(s, tableId, localityId, 'approve', { name: actorName, role: actorRole }) ?? s),

      reject: (tableId, localityId, reason, actorName, actorRole) =>
        set((state) => {
          const patch = runTransition(state, tableId, localityId, 'reject', { name: actorName, role: actorRole }, reason);
          if (!patch) return state;
          if (state.scores[tableId]?.[localityId]?.state === 'CHO_CHUYEN_VIEN') return patch;
          const record = patch.scores[tableId][localityId];
          return {
            ...patch,
            scores: {
              ...patch.scores,
              [tableId]: {
                ...patch.scores[tableId],
                [localityId]: { ...record, revisionRequestedAt: now() },
              },
            },
          };
        }),

      publish: (tableId, localityId, actorName, actorRole, decisionAttachments, publicationComment) =>
        set((s) => {
          const patch = runTransition(
            s,
            tableId,
            localityId,
            'publish',
            { name: actorName, role: actorRole },
            publicationComment?.trim() || null,
          );
          if (!patch) return s;
          const record = patch.scores[tableId][localityId];
          return {
            ...patch,
            scores: {
              ...patch.scores,
              [tableId]: {
                ...patch.scores[tableId],
                [localityId]: { ...record, decisionAttachments: decisionAttachments ?? record.decisionAttachments },
              },
            },
          };
        }),

      uploadEvidence: ({ id, criteriaId, localityId, fileName, fileUrl, fileSize, description, kind }) => {
        set((state) => {
          if ((fileSize ?? 0) > MAX_UPLOAD_SIZE) return state;
          const ev: Evidence = {
            id: id ?? uid(),
            criteriaId,
            localityId,
            fileName,
            fileUrl,
            fileSize,
            description,
            kind: kind ?? 'STANDARD',
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
      version: 1,
      migrate: (persistedState) => {
        const previous = persistedState as Partial<ScoreStore>;
        return {
          criteriaTables: previous.criteriaTables ?? initialTables,
          localities: previous.localities ?? initialLocalities,
          audits: previous.audits ?? initialAudits,
          generalCommitteeComments: previous.generalCommitteeComments ?? [],
          deadline: previous.deadline ?? defaultDeadline,
          scores: initialScores,
          evidence: initialEvidence,
          assignments: { tc1: ['loc-25195', 'loc-26068', 'loc-25210', 'loc-25222', 'loc-25217', 'loc-25220'] },
          lockedCriteria: { tc1: {} },
        };
      },
      partialize: (s) => ({
        criteriaTables: s.criteriaTables,
        localities: s.localities,
        evidence: s.evidence,
        audits: s.audits,
        generalCommitteeComments: s.generalCommitteeComments,
        deadline: s.deadline,
        scores: s.scores,
        assignments: s.assignments,
        lockedCriteria: s.lockedCriteria,
      }),
    },
  ),
);
