import type { ScoreState, LocalityStatus, Role, ActionType } from '@/types/rbac';

export const SCORE_STATES: ScoreState[] = [
  'DRAFT',
  'CHO_CHUYEN_VIEN',
  'CHO_DUYET_BAN',
  'CHO_DUYET_HOI_DONG',
  'CHO_DUYET_BTT',
  'DA_CONG_BO',
];

export const SCORE_STATE_LABELS: Record<ScoreState, string> = {
  DRAFT: 'Nháp',
  CHO_CHUYEN_VIEN: 'Đang chờ duyệt',
  CHO_DUYET_BAN: 'Đang chờ duyệt',
  CHO_DUYET_HOI_DONG: 'Đang chờ duyệt',
  CHO_DUYET_BTT: 'Chờ duyệt',
  DA_CONG_BO: 'Đã công bố',
};

export const LOCALITY_STATUS_LABELS: Record<LocalityStatus, string> = {
  submitted: 'Đã nộp',
  processing: 'Đang xử lý',
  published: 'Công bố',
};

export const ROLE_LABELS: Record<Role, string> = {
  LOCAL: 'Địa phương',
  SPECIALIST: 'Chuyên viên',
  LEADER: 'Lãnh đạo',
  COUNCIL: 'Hội đồng',
  COMMITTEE: 'Ủy ban',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  SCORE: 'Chấm điểm',
  EDIT: 'Sửa điểm',
  APPROVE: 'Duyệt',
  REJECT: 'Trả lại',
  PUBLISH: 'Công bố',
};

export const CRITERIA_STATUS_LABELS: Record<'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PUBLISHED', string> = {
  DRAFT: 'Nháp',
  ACTIVE: 'Đang hoạt động',
  EXPIRED: 'Đã kết thúc',
  PUBLISHED: 'Đã công bố',
};

export const PUBLISH_CONFIRM_KEYWORD = 'CÔNG BỐ';
