export const ROUTES = {
  // Route chuẩn theo FSD cho hai phân quyền MVP
  SPECIALIST_CRITERIA: '/chuyen-vien/tieu-chi',
  SPECIALIST_REVIEW: '/chuyen-vien/duyet',
  SPECIALIST_SCORE_SUMMARY: '/chuyen-vien/tong-hop-cham-diem',
  SPECIALIST_HISTORY: '/chuyen-vien/lich-su',
  LOCALITY_CRITERIA: '/dia-phuong/tieu-chi',
  LOCALITY_RESULTS: '/dia-phuong/ket-qua',

  // Admin
  ADMIN_CRITERIA_LIST: '/thi-dua/admin/bang-tieu-chi',
  ADMIN_CRITERIA_DETAIL: '/thi-dua/admin/bang-tieu-chi/:id/chi-tiet',
  ADMIN_CRITERIA_FORM: '/thi-dua/admin/bang-tieu-chi/:id',
  ADMIN_CRITERIA_NEW: '/thi-dua/admin/bang-tieu-chi/new',
  // NOTE: ADMIN_CRITERIA_NEW trỏ tới route `bang-tieu-chi/:id` với id="new";
  // CriteriaFormPage tự nhận biết qua `id === 'new'`. Không có route literal riêng.
  ADMIN_DEADLINE_CONFIG: '/thi-dua/admin/cau-hinh-thoi-han',
  ADMIN_USERS: '/thi-dua/admin/tai-khoan',
  ADMIN_DEPARTMENTS: '/thi-dua/admin/ban',
  ADMIN_DASHBOARD: '/thi-dua/admin/dashboard',
  ADMIN_LOCALITY: '/thi-dua/admin/dia-phuong',

  // Địa phương
  LOCALITY_MINH_CHUNG: '/thi-dua/dia-phuong/minh-chung',
  LOCALITY_TRANG_THAI: '/thi-dua/dia-phuong/trang-thai',
  LOCALITY_KET_QUA: '/thi-dua/dia-phuong/ket-qua/:nam',

  // Chấm điểm
  CHAM_DIEM_BY_CRITERIA: '/thi-dua/cham-diem/theo-tieu-chi/:id',
  CHAM_DIEM_BY_LOCALITY: '/thi-dua/cham-diem/theo-dia-phuong/:id',

  // Duyệt
  DUYET_BAN_LEADER: '/thi-dua/duyet/lanh-dao-ban/:banId',
  DUYET_COUNCIL: '/thi-dua/duyet/hoi-dong-tdkt',
  DUYET_STANDING: '/thi-dua/duyet/ban-thuong-truc',
  DUYET_STANDING_REVIEW: '/thi-dua/duyet/ban-thuong-truc/duyet',

  // Audit log
  AUDIT_LOG: '/thi-dua/lich-su-thay-doi/:diaPhuongId',

  // Dashboard
  DASHBOARD_OVERVIEW: '/thi-dua/dashboard-tong-quan',

  // Auth
  LOGIN: '/login',
  CHANGE_PASSWORD: '/doi-mat-khau',
  /** Form bắt buộc nhập họ tên + SĐT người đại diện khi thiếu sau login. */
  PROFILE_COMPLETION: '/hoan-thien-ho-so',
  /** Trang tài khoản — xem/sửa thông tin người đại diện. */
  ACCOUNT: '/tai-khoan',
} as const;
