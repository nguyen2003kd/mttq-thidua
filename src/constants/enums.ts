import type { ScoreState, LocalityStatus, Role, ActionType } from '@/types/rbac';

export const SCORE_STATES: ScoreState[] = [
  'DRAFT',
  'CHO_DUYET_BAN',
  'CHO_DUYET_HOI_DONG',
  'CHO_DUYET_BTT',
  'DA_CONG_BO',
];

export const SCORE_STATE_LABELS: Record<ScoreState, string> = {
  DRAFT: 'Nháp',
  CHO_DUYET_BAN: 'Chờ duyệt Ban',
  CHO_DUYET_HOI_DONG: 'Chờ Hội đồng TĐKT',
  CHO_DUYET_BTT: 'Chờ Ban thường trực',
  DA_CONG_BO: 'Đã công bố',
};

export const LOCALITY_STATUS_LABELS: Record<LocalityStatus, string> = {
  submitted: 'Đã nộp',
  processing: 'Đang xử lý',
  published: 'Công bố',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin tiêu chí',
  LOCALITY: 'Địa phương',
  SPECIALIST: 'Chuyên viên',
  BAN_LEADER: 'Lãnh đạo Ban',
  COUNCIL_CHAIR: 'Chủ tịch Hội đồng TĐKT',
  COUNCIL_VICE: 'Phó Chủ tịch Hội đồng TĐKT',
  STANDING_COMMITTEE: 'Ban thường trực',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  SCORE: 'Chấm điểm',
  EDIT: 'Sửa điểm',
  APPROVE: 'Duyệt',
  REJECT: 'Trả lại',
  PUBLISH: 'Công bố',
};

export const CRITERIA_STATUS_LABELS: Record<'DRAFT' | 'ACTIVE' | 'EXPIRED', string> = {
  DRAFT: 'Nháp',
  ACTIVE: 'Đang hoạt động',
  EXPIRED: 'Đã kết thúc',
};

export const PUBLISH_CONFIRM_KEYWORD = 'CÔNG BỐ';
