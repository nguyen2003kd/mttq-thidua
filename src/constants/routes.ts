export const ROUTES = {
  // Admin
  ADMIN_CRITERIA_LIST: '/thi-dua/admin/bang-tieu-chi',
  ADMIN_CRITERIA_FORM: '/thi-dua/admin/bang-tieu-chi/:id',
  ADMIN_CRITERIA_NEW: '/thi-dua/admin/bang-tieu-chi/new',
  ADMIN_ASSIGN_LOCALITY: '/thi-dua/admin/bang-tieu-chi/:id/gan-dia-phuong',
  ADMIN_DEADLINE_CONFIG: '/thi-dua/admin/cau-hinh-thoi-han',
  ADMIN_DASHBOARD: '/thi-dua/admin/dashboard',

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

  // Audit log
  AUDIT_LOG: '/thi-dua/lich-su-thay-doi/:diaPhuongId',

  // Dashboard
  DASHBOARD_OVERVIEW: '/thi-dua/dashboard-tong-quan',

  // Auth
  LOGIN: '/login',
} as const;
