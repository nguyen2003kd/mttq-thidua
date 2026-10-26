import { mainInstance } from '@/api/mutator/custom-instance';
import type { ScoringConfigApi } from '@/features/admin/api/scoringConfigsApi';

/** Cấu hình 1 mức xếp loại — thuộc một Cấu hình điểm (ScoringConfig). */
export interface EmulationClassificationConfig {
  code: string;
  name: string;
  minPoint: number;
  maxPoint: number;
  includeMin: boolean;
  includeMax: boolean;
  sortOrder: number;
}

/** Thang mặc định theo quy định — dùng khi chưa có cấu hình điểm nào hoặc tải lỗi. */
export const DEFAULT_EMULATION_CLASSIFICATIONS: EmulationClassificationConfig[] = [
  { code: 'XUAT_SAC', name: 'Xuất sắc', minPoint: 95, maxPoint: 100, includeMin: true, includeMax: true, sortOrder: 1 },
  { code: 'TOT', name: 'Tốt', minPoint: 85, maxPoint: 95, includeMin: true, includeMax: false, sortOrder: 2 },
  { code: 'KHA', name: 'Khá', minPoint: 70, maxPoint: 85, includeMin: true, includeMax: false, sortOrder: 3 },
  { code: 'TRUNG_BINH', name: 'Trung bình', minPoint: 0, maxPoint: 70, includeMin: true, includeMax: false, sortOrder: 4 },
];

interface PagedEnvelope {
  data: { items: ScoringConfigApi[] };
}

/** GET /api/v1/scoring-configs — danh sách cấu hình điểm kèm các mức xếp loại. */
export async function fetchScoringConfigs(): Promise<ScoringConfigApi[]> {
  const response = await mainInstance<PagedEnvelope>({
    url: '/api/v1/scoring-configs',
    method: 'GET',
    params: { Page: 1, PageSize: 100 },
  });
  return response.data?.items ?? [];
}

export const scoringConfigsQueryKey = () => ['scoring-configs', 'all'] as const;

/** Chọn mức xếp loại theo cấu hình điểm của kỳ: đúng cấu hình → cấu hình đầu tiên → rỗng (fallback thang mặc định ở hook). */
export function selectConfigLevels(
  configs: ScoringConfigApi[],
  scoringConfigId?: string | null,
): EmulationClassificationConfig[] {
  if (configs.length === 0) return [];
  const config = scoringConfigId
    ? configs.find((item) => item.id === scoringConfigId)
    : configs[0];
  return (config?.levels ?? []).map((level) => ({
    code: level.code,
    name: level.name,
    minPoint: level.minPoint,
    maxPoint: level.maxPoint,
    includeMin: level.includeMin,
    includeMax: level.includeMax,
    sortOrder: level.sortOrder,
  }));
}

/** Điểm thuộc mức khi (includeMin ? score >= min : score > min) && (includeMax ? score <= max : score < max).
 *  Điểm vượt qua mốc của mức cao nhất (hoặc thấp hơn mức thấp nhất) → xếp vào mức gần nhất. */
export function classifyByConfig(
  score: number | null | undefined,
  rows: readonly EmulationClassificationConfig[],
): EmulationClassificationConfig | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  const exact = rows.find(
    (row) =>
      (row.includeMin ? score >= row.minPoint : score > row.minPoint) &&
      (row.includeMax ? score <= row.maxPoint : score < row.maxPoint),
  );
  if (exact || rows.length === 0) return exact ?? null;
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  return score > sorted[0].maxPoint ? sorted[0] : sorted[sorted.length - 1];
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
