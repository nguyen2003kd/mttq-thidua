import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  stickyTitle: string | null;
  stickyDescription: string | null;
  setStickyTitle: (title: string | null) => void;
  setStickyDescription: (desc: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  stickyTitle: null,
  stickyDescription: null,
  setStickyTitle: (title) => set({ stickyTitle: title }),
  setStickyDescription: (desc) => set({ stickyDescription: desc }),
}));
