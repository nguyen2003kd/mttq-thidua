import { create } from 'zustand';

interface FilterState {
  selectedBanId: string | null;
  selectedCriteriaId: string | null;
  selectedYear: number;
  searchQuery: string;
  setBanId: (banId: string | null) => void;
  setCriteriaId: (criteriaId: string | null) => void;
  setYear: (year: number) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const currentYear = new Date().getFullYear();

export const useFilterStore = create<FilterState>((set) => ({
  selectedBanId: null,
  selectedCriteriaId: null,
  selectedYear: currentYear,
  searchQuery: '',
  setBanId: (banId) => set({ selectedBanId: banId }),
  setCriteriaId: (criteriaId) => set({ selectedCriteriaId: criteriaId }),
  setYear: (year) => set({ selectedYear: year }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () =>
    set({
      selectedBanId: null,
      selectedCriteriaId: null,
      selectedYear: currentYear,
      searchQuery: '',
    }),
}));
