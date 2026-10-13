import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_EMULATION_CLASSIFICATIONS,
  emulationClassificationsQueryKey,
  fetchEmulationClassifications,
  selectClassificationSet,
  type EmulationClassificationConfig,
} from '@/lib/emulationClassification';

/**
 * Bộ cấu hình xếp loại từ bảng emulation_classifications (scope cấp xã).
 * Ưu tiên bộ theo `assessmentYear`, fallback về năm mới nhất, cuối cùng là thang mặc định.
 */
export function useEmulationClassifications(assessmentYear?: number) {
  const query = useQuery({
    queryKey: emulationClassificationsQueryKey(),
    queryFn: fetchEmulationClassifications,
    staleTime: 5 * 60_000,
  });

  const classifications: readonly EmulationClassificationConfig[] = useMemo(() => {
    const items = query.data;
    if (!items || items.length === 0) return DEFAULT_EMULATION_CLASSIFICATIONS;
    const selected = selectClassificationSet(items, assessmentYear);
    return selected.length > 0 ? selected : DEFAULT_EMULATION_CLASSIFICATIONS;
  }, [query.data, assessmentYear]);

  return { classifications, isLoading: query.isLoading, isError: query.isError };
}
