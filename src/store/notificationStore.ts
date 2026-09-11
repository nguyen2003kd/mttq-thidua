import { create } from 'zustand';
import { notificationsApi, type NotificationItemApi } from '@/features/notifications/api/notificationsApi';

export interface SseNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: string;
  createdAt: string;
  isRead?: boolean;
}

const PAGE_SIZE = 10;

function toNotification(item: NotificationItemApi): SseNotification {
  return {
    id: item.messageId || item.id,
    title: item.title ?? '',
    body: item.body ?? '',
    type: item.type ?? '',
    data: item.data ?? '',
    createdAt: item.createdAt,
    isRead: item.isRead,
  };
}

interface NotificationState {
  notifications: SseNotification[];
  unreadCount: number;
  connected: boolean;
  page: number;
  total: number;
  loading: boolean;
  hasMore: boolean;
  fetchFirstPage: () => Promise<void>;
  loadMore: () => Promise<void>;
  addNotification: (n: SseNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
  setConnected: (v: boolean) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connected: false,
  page: 0,
  total: 0,
  loading: false,
  hasMore: false,

  fetchFirstPage: async () => {
    set({ loading: true });
    try {
      const res = await notificationsApi.list(1, PAGE_SIZE);
      const items = res.items.map(toNotification);
      set({
        notifications: items,
        page: 1,
        total: res.total,
        hasMore: items.length < res.total,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { loading, hasMore, page } = get();
    if (loading || !hasMore) return;
    set({ loading: true });
    try {
      const res = await notificationsApi.list(page + 1, PAGE_SIZE);
      const items = res.items.map(toNotification);
      set((s) => {
        const existing = new Set(s.notifications.map((n) => n.id));
        const merged = [...s.notifications, ...items.filter((n) => !existing.has(n.id))];
        return {
          notifications: merged,
          page: res.page,
          total: res.total,
          hasMore: merged.length < res.total,
          loading: false,
        };
      });
    } catch {
      set({ loading: false });
    }
  },

  addNotification: (n) =>
    set((s) => {
      if (s.notifications.some((x) => x.id === n.id)) return s;
      return {
        notifications: [{ ...n, isRead: false }, ...s.notifications],
        unreadCount: s.unreadCount + 1,
        total: s.total + 1,
        hasMore: s.notifications.length < s.total + 1,
      };
    }),
  markRead: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      if (!target || target.isRead) return s;
      return {
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      };
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setConnected: (v) => set({ connected: v }),
  clear: () =>
    set({ notifications: [], unreadCount: 0, connected: false, page: 0, total: 0, loading: false, hasMore: false }),
}));
