import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_EMULATION_CLASSIFICATIONS,
  scoringConfigsQueryKey,
  fetchScoringConfigs,
  selectConfigLevels,
} from '@/lib/emulationClassification';

/**
 * Thang xếp loại theo CẤU HÌNH ĐIỂM của kỳ thi đua đang chọn.
 * Truyền `scoringConfigId` từ kỳ (period.scoringConfigId); không có/không tìm thấy
 * → dùng cấu hình đầu tiên, cuối cùng là thang mặc định.
 */
export function useEmulationClassifications(scoringConfigId?: string | null) {
  const query = useQuery({
    queryKey: scoringConfigsQueryKey(),
    queryFn: fetchScoringConfigs,
    staleTime: 5 * 60_000,
  });

  const classifications = useMemo(() => {
    const configs = query.data ?? [];
    const levels = selectConfigLevels(configs, scoringConfigId);
    return levels.length > 0 ? levels : DEFAULT_EMULATION_CLASSIFICATIONS;
  }, [query.data, scoringConfigId]);

  return { classifications, isLoading: query.isLoading, isError: query.isError };
}
