import { useEffect, useRef } from 'react';
import { apiBaseUrl, getAccessToken } from './axiosInstance.js';

const EVENT_NAME = 'historical-record.changed';

/**
 * Subscribes to server-sent events for the signed-in user. Calls `onEvent` when a
 * historical academic record tied to `userId` is created/updated/deleted, so the
 * student's open page can refresh in place without a manual reload.
 */
export function useRecordEvents({ userId, onEvent }) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!userId) return undefined;

    let closed = false;
    let es = null;
    let tokenAtConnect = null;

    const connect = () => {
      const token = getAccessToken();
      if (closed || !token) return;
      tokenAtConnect = token;

      es = new EventSource(`${apiBaseUrl}/events?token=${encodeURIComponent(token)}`, { withCredentials: true });

      es.addEventListener(EVENT_NAME, (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.studentId && data.studentId === userId) onEventRef.current?.(data);
        } catch {
          /* ignore malformed payloads */
        }
      });

      es.onerror = () => {
        // Access token may have rotated; reconnect once with the fresh token.
        const current = getAccessToken();
        if (current && current !== tokenAtConnect) {
          es?.close();
          es = null;
          connect();
        }
      };
    };

    connect();

    return () => {
      closed = true;
      es?.close();
    };
  }, [userId]);
}