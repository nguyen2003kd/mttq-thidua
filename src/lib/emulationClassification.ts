import { mainInstance } from '@/api/mutator/custom-instance';
import { getGetApiV1EmulationClassificationsQueryKey } from '@/api/endpoints/emulation-classifications';

/** Cấu hình 1 mức xếp loại — bảng emulation_classifications chỉ lưu cấu hình điểm. */
export interface EmulationClassificationConfig {
  code: string;
  name: string;
  minPoint: number;
  maxPoint: number;
  includeMin: boolean;
  includeMax: boolean;
  sortOrder: number;
  assessmentYear: number;
}

/** Scope phân loại thi đua cấp xã — khớp seed BE (migration AddEmulationClassifications). */
export const EMULATION_SCOPE_CODE = 'MTTQ_DONG_NAI_CAP_XA';

/** Thang mặc định theo quy định — dùng khi API cấu hình chưa có dữ liệu hoặc tải lỗi. */
export const DEFAULT_EMULATION_CLASSIFICATIONS: EmulationClassificationConfig[] = [
  { code: 'XUAT_SAC', name: 'Xuất sắc', minPoint: 95, maxPoint: 100, includeMin: true, includeMax: true, sortOrder: 1, assessmentYear: 2025 },
  { code: 'TOT', name: 'Tốt', minPoint: 85, maxPoint: 95, includeMin: true, includeMax: false, sortOrder: 2, assessmentYear: 2025 },
  { code: 'KHA', name: 'Khá', minPoint: 70, maxPoint: 85, includeMin: true, includeMax: false, sortOrder: 3, assessmentYear: 2025 },
  { code: 'TRUNG_BINH', name: 'Trung bình', minPoint: 0, maxPoint: 70, includeMin: true, includeMax: false, sortOrder: 4, assessmentYear: 2025 },
];

interface ClassificationApiItem {
  code: string;
  name: string;
  minPoint: number;
  maxPoint: number;
  includeMin: boolean;
  includeMax: boolean;
  sortOrder: number;
  assessmentYear: number;
  status: string;
}

interface ClassificationApiEnvelope {
  data: { items: ClassificationApiItem[] };
}

function toConfig(item: ClassificationApiItem): EmulationClassificationConfig {
  return {
    code: item.code,
    name: item.name,
    minPoint: item.minPoint,
    maxPoint: item.maxPoint,
    includeMin: item.includeMin,
    includeMax: item.includeMax,
    sortOrder: item.sortOrder,
    assessmentYear: item.assessmentYear,
  };
}

/** GET /api/v1/emulation-classifications — chỉ lấy mức Active của scope cấp xã. */
export async function fetchEmulationClassifications(): Promise<EmulationClassificationConfig[]> {
  const response = await mainInstance<ClassificationApiEnvelope>({
    url: '/api/v1/emulation-classifications',
    method: 'GET',
    params: { ScopeCode: EMULATION_SCOPE_CODE, Status: 'Active', Page: 1, PageSize: 100, SortBy: 'sortOrder', SortOrder: 'asc' },
  });
  return (response.data?.items ?? []).map(toConfig);
}

export const emulationClassificationsQueryKey = () =>
  getGetApiV1EmulationClassificationsQueryKey({
    ScopeCode: EMULATION_SCOPE_CODE,
    Status: 'Active',
    Page: 1,
    PageSize: 100,
    SortBy: 'sortOrder',
    SortOrder: 'asc',
  });

/** Chọn bộ cấu hình theo năm: năm yêu cầu → năm gần nhất ≤ năm yêu cầu → năm mới nhất. */
export function selectClassificationSet(
  items: EmulationClassificationConfig[],
  assessmentYear?: number,
): EmulationClassificationConfig[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.assessmentYear - b.assessmentYear || a.sortOrder - b.sortOrder);
  if (assessmentYear !== undefined) {
    const exact = sorted.filter((row) => row.assessmentYear === assessmentYear);
    if (exact.length > 0) return exact;
    const older = sorted.filter((row) => row.assessmentYear < assessmentYear);
    if (older.length > 0) {
      const year = Math.max(...older.map((row) => row.assessmentYear));
      return sorted.filter((row) => row.assessmentYear === year);
    }
  }
  const latest = Math.max(...sorted.map((row) => row.assessmentYear));
  return sorted.filter((row) => row.assessmentYear === latest);
}

/** Điểm thuộc mức khi (includeMin ? score >= min : score > min) && (includeMax ? score <= max : score < max). */
export function classifyByConfig(
  score: number | null | undefined,
  rows: readonly EmulationClassificationConfig[],
): EmulationClassificationConfig | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  const capped = Math.min(score, 100);
  return (
    rows.find(
      (row) =>
        (row.includeMin ? capped >= row.minPoint : capped > row.minPoint) &&
        (row.includeMax ? capped <= row.maxPoint : capped < row.maxPoint),
    ) ?? null
  );
}

function formatPoint(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
}

/** Mô tả thang: "Từ 95 đến 100 điểm" / "Từ 85 đến dưới 95 điểm" / "Dưới 70 điểm" (kể từ 0). */
export function formatClassificationRange(row: EmulationClassificationConfig): string {
  if (row.minPoint <= 0) return `Dưới ${formatPoint(row.maxPoint)} điểm`;
  return row.includeMax
    ? `Từ ${formatPoint(row.minPoint)} đến ${formatPoint(row.maxPoint)} điểm`
    : `Từ ${formatPoint(row.minPoint)} đến dưới ${formatPoint(row.maxPoint)} điểm`;
}
