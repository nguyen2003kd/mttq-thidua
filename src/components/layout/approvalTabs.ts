import { ROUTES } from '@/constants/routes';

export const APPROVAL_TABS = [
  {
    value: 'chuyen-vien-cap-2',
    label: 'Chuyên viên cấp 2',
    to: '/thi-dua/cham-diem',
    match: '/thi-dua/cham-diem',
  },
  {
    value: 'lanh-dao-ban',
    label: 'Lãnh đạo ban',
    to: `${ROUTES.SPECIALIST_REVIEW}?as=reviewer`,
    match: ROUTES.SPECIALIST_REVIEW,
    as: 'reviewer',
  },
  {
    value: 'chuyen-vien-truong',
    label: 'Chuyên viên trưởng',
    to: `${ROUTES.SPECIALIST_REVIEW}?as=specialist`,
    match: ROUTES.SPECIALIST_REVIEW,
    as: 'specialist',
  },
  {
    value: 'lanh-dao',
    label: 'Lãnh đạo',
    to: '/thi-dua/duyet/lanh-dao-ban/ban1',
    match: '/thi-dua/duyet/lanh-dao-ban',
  },
  {
    value: 'hoi-dong',
    label: 'Hội đồng TĐKT',
    to: ROUTES.DUYET_COUNCIL,
    match: ROUTES.DUYET_COUNCIL,
  },
  {
    value: 'ban-thuong-truc',
    label: 'Ban Thường trực',
    to: ROUTES.DUYET_STANDING,
    match: ROUTES.DUYET_STANDING,
  },
] as const;

/** Đường dẫn thuộc nhóm màn chấm/duyệt (dùng để active mục sidebar 'Duyệt'). */
export function isApprovalTabPath(pathname: string): boolean {
  return APPROVAL_TABS.some((tab) => pathname.startsWith(tab.match));
}

/**
 * Tab đang khớp đường dẫn (ưu tiên prefix dài nhất). Với màn dùng chung
 * /chuyen-vien/duyet, phân biệt tab bằng query `as` (mặc định 'specialist'
 * khớp cả khi param trống — trùng fallback scoringRole trong trang).
 */
export function activeApprovalTab(pathname: string, search: string): (typeof APPROVAL_TABS)[number] | undefined {
  const asParam = new URLSearchParams(search).get('as')?.toLowerCase() ?? 'specialist';
  const candidates = APPROVAL_TABS
    .filter((tab) => pathname.startsWith(tab.match))
    .sort((a, b) => b.match.length - a.match.length);
  return candidates.find((tab) => !('as' in tab) || tab.as === asParam) ?? candidates[0];
}
