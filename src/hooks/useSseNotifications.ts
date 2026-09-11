import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore, type SseNotification } from '@/store/notificationStore';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';
import baseConfig from '@/configs/base';

/**
 * Parse SSE text frames from a ReadableStream.
 * Handles `event:`, `data:` lines and dispatches named events.
 */
function parseSseChunk(chunk: string, buffer: { current: string }, handlers: {
  onEvent: (eventName: string, data: string) => void;
}) {
  buffer.current += chunk;
  const frames = buffer.current.split('\n\n');
  buffer.current = frames.pop() ?? '';

  for (const frame of frames) {
    let eventName = 'message';
    let data = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data += line.slice(5).trim();
      } else if (line.startsWith(':')) {
        // comment / heartbeat — ignore
      }
    }
    if (data) handlers.onEvent(eventName, data);
  }
}

/**
 * Connects to the backend SSE stream (`GET /api/v1/notifications/stream`)
 * using fetch + ReadableStream (so we can pass the Authorization header).
 *
 * On `notification` events, adds to notification store and shows a toast.
 * Auto-reconnects with backoff on disconnect.
 */
export function useSseNotifications() {
  const token = useAuthStore((s) => s.token);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setConnected = useNotificationStore((s) => s.setConnected);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSignedIn || !token) return;

    let cancelled = false;
    let attempt = 0;
    const buffer = { current: '' };

    const connect = async () => {
      if (cancelled) return;
      attempt++;
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const url = `${baseConfig.backendDomain}/api/v1/notifications/stream`;
        console.log('[SSE] Connecting to', url);
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        console.log('[SSE] Response status:', res.status, 'Content-Type:', res.headers.get('content-type'));

        if (!res.ok || !res.body) {
          throw new Error(`SSE connection failed: ${res.status}`);
        }

        setConnected(true);
        attempt = 0;

        // Sync unread count from DB on connect
        notificationsApi
          .unreadCount()
          .then((data) => setUnreadCount(data.count))
          .catch(() => {
            // ignore — badge stays as-is
          });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[SSE] Stream ended');
            break;
          }
          const text = decoder.decode(value, { stream: true });
          console.log('[SSE] Raw chunk:', JSON.stringify(text));
          parseSseChunk(text, buffer, {
            onEvent: (eventName, data) => {
              if (eventName === 'notification') {
                try {
                  const payload = JSON.parse(data) as SseNotification;
                  addNotification(payload);
                  toast.info(payload.title, { description: payload.body });
                } catch {
                  // ignore malformed JSON
                }
              }
              // 'connected' event — connection confirmed
              if (eventName === 'connected') {
                // SSE connected successfully
              }
            },
          });
        }
      } catch (e) {
        if (!cancelled) console.error('[SSE] Connection error:', e);
        // disconnected or cancelled
      } finally {
        setConnected(false);
      }

      // Reconnect with backoff (max 30s)
      if (!cancelled) {
        const delay = Math.min(1000 * 2 ** attempt, 30_000);
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      setConnected(false);
    };
  }, [token, isSignedIn, addNotification, setConnected, setUnreadCount]);
}
