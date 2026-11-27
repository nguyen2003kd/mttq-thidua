import { create } from 'zustand';

export type UploadFileState = 'queued' | 'uploading' | 'success' | 'error' | 'unknown';

export interface UploadQueueItem {
  id: string;
  batchId: string;
  source: 'individual' | 'bulk';
  name: string;
  size: number;
  status: UploadFileState;
  progress: number;
  error?: string;
}

interface UploadProgressState {
  items: UploadQueueItem[];
  visible: boolean;
  minimized: boolean;
  startBatch: (files: Array<Pick<UploadQueueItem, 'name' | 'size'>>, source?: 'individual' | 'bulk') => string[];
  setUploading: (id: string) => void;
  setProgress: (id: string, progress: number) => void;
  succeed: (id: string) => void;
  fail: (id: string, reason: string) => void;
  uncertain: (id: string, reason: string) => void;
  toggleMinimized: () => void;
  dismiss: () => void;
  clearFinished: () => void;
}

let nextBatchId = 0;
const MAX_HISTORY = 60;

const updateItem = (
  items: UploadQueueItem[],
  id: string,
  patch: Partial<UploadQueueItem>,
): UploadQueueItem[] => items.map((item) => item.id === id ? { ...item, ...patch } : item);

export const useUploadProgressStore = create<UploadProgressState>((set) => ({
  items: [],
  visible: false,
  minimized: false,

  startBatch: (files, source = 'individual') => {
    if (!files.length) return [];
    const batchId = String(++nextBatchId);
    const newItems: UploadQueueItem[] = files.map((file, index) => ({
      id: batchId + ':' + index,
      batchId,
      source,
      name: file.name,
      size: file.size,
      status: 'queued',
      progress: 0,
    }));
    set((state) => ({
      items: [...newItems, ...state.items].slice(0, MAX_HISTORY),
      visible: true,
      minimized: false,
    }));
    return newItems.map((item) => item.id);
  },

  setUploading: (id) => set((state) => ({
    items: updateItem(state.items, id, { status: 'uploading', progress: 0, error: undefined }),
  })),

  setProgress: (id, progress) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id && item.status === 'uploading'
        ? { ...item, progress: Math.max(item.progress, Math.min(95, Math.max(0, Math.round(progress)))) }
        : item,
    ),
  })),

  succeed: (id) => set((state) => ({
    items: updateItem(state.items, id, { status: 'success', progress: 100, error: undefined }),
  })),

  fail: (id, reason) => set((state) => ({
    items: updateItem(state.items, id, { status: 'error', progress: 0, error: reason }),
  })),

  uncertain: (id, reason) => set((state) => ({
    items: updateItem(state.items, id, { status: 'unknown', progress: 0, error: reason }),
  })),

  toggleMinimized: () => set((state) => ({ minimized: !state.minimized })),
  dismiss: () => set((state) => {
    if (state.items.some((item) => item.status === 'queued' || item.status === 'uploading')) {
      return { minimized: true };
    }
    return { visible: false, minimized: false, items: [] };
  }),

  clearFinished: () => set((state) => ({
    items: state.items.filter((item) => item.status === 'queued' || item.status === 'uploading'),
    visible: state.items.some((item) => item.status === 'queued' || item.status === 'uploading'),
  })),
}));
