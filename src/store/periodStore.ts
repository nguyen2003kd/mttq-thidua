import { create } from 'zustand';

/** Kỳ thi đua đang chọn dùng chung giữa các trang của Địa phương
 *  (Kết quả, Tiêu chí được giao, Lịch sử thao tác) — chọn ở một trang, các trang còn lại đi theo. */
interface PeriodState {
  selectedPeriodId: string | null;
  setSelectedPeriod: (id: string | null) => void;
}

export const usePeriodStore = create<PeriodState>((set) => ({
  selectedPeriodId: null,
  setSelectedPeriod: (id) => set({ selectedPeriodId: id }),
}));
