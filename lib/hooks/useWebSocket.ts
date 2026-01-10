import { useEffect, useState, useRef, useCallback } from "react";
import type { ApplicationUpdate } from "@/types/application";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useApplicationWebSocket(sessionId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ApplicationUpdate | null>(
    null
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const url = `${WS_URL}/api/applications/ws/${sessionId}`;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ApplicationUpdate;
          setLastMessage(data);
        } catch {
          // Silently ignore parse errors
        }
      };

      ws.onerror = () => {
        // Error event doesn't contain useful info - wait for close event
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;

        // Handle specific close codes
        if (event.code === 4004) {
          // Session not found - don't retry
          setConnectionError("Session not found");
          return;
        }

        if (event.code === 1000 || event.code === 1001) {
          // Normal close - don't retry
          return;
        }

        // Unexpected close - retry with backoff
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current++;
          const delay = RETRY_DELAY_MS * retriesRef.current;
          retryTimeoutRef.current = setTimeout(connect, delay);
        } else {
          setConnectionError("Connection failed after multiple attempts");
        }
      };

      wsRef.current = ws;
    } catch {
      setConnectionError("Failed to create WebSocket connection");
    }
  }, [sessionId]);

  useEffect(() => {
    connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [connect]);

  return { isConnected, lastMessage, connectionError };
}
