import { useEffect, useRef, useState } from 'react';

const TIME_API_URL = 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Ho_Chi_Minh';
const RESYNC_INTERVAL_MS = 60_000;
const TICK_INTERVAL_MS = 1_000;

interface TimeApiResponse {
  dateTime?: string;
}

interface TimeAnchor {
  serverTimeMs: number;
  performanceMs: number;
}

function parseUtcDateTime(value?: string): number {
  if (!value) return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  return Date.parse(normalized);
}

export function useTrustedTime() {
  const anchorRef = useRef<TimeAnchor | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let disposed = false;
    let activeController: AbortController | null = null;

    const syncTime = async () => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch(TIME_API_URL, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`TimeAPI.io returned ${response.status}`);
        }

        const data = await response.json() as TimeApiResponse;
        const serverTimeMs = parseUtcDateTime(data.dateTime);
        if (!Number.isFinite(serverTimeMs)) {
          throw new Error('TimeAPI.io returned an invalid UTC time');
        }

        anchorRef.current = { serverTimeMs, performanceMs: performance.now() };
        if (!disposed) {
          setNowMs(serverTimeMs);
          setError(null);
        }
      } catch (caught) {
        if (controller.signal.aborted || disposed) return;
        if (!anchorRef.current) setNowMs(null);
        setError(caught instanceof Error ? caught : new Error('Không thể đồng bộ thời gian chuẩn.'));
      }
    };

    void syncTime();

    const tickTimer = window.setInterval(() => {
      const anchor = anchorRef.current;
      if (!anchor || disposed) return;
      setNowMs(anchor.serverTimeMs + (performance.now() - anchor.performanceMs));
    }, TICK_INTERVAL_MS);

    const syncTimer = window.setInterval(() => {
      void syncTime();
    }, RESYNC_INTERVAL_MS);

    return () => {
      disposed = true;
      activeController?.abort();
      window.clearInterval(tickTimer);
      window.clearInterval(syncTimer);
    };
  }, []);

  return { nowMs, isReady: nowMs !== null, error };
}
