"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Intervention, WSMessage, InterventionWSMessage, InterventionStatus, InterventionType } from "@/types/intervention";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface UseInterventionSocketOptions {
  onIntervention?: (intervention: Intervention) => void;
  onResolved?: (interventionId: string, action: string) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseInterventionSocketReturn {
  isConnected: boolean;
  pendingCount: number;
  interventions: Intervention[];
  error: string | null;
  refresh: () => void;
}

export function useInterventionSocket(
  options: UseInterventionSocketOptions = {}
): UseInterventionSocketReturn {
  const {
    onIntervention,
    onResolved,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs for callbacks to avoid recreating connect on every render
  const onInterventionRef = useRef(onIntervention);
  const onResolvedRef = useRef(onResolved);

  // Keep refs updated
  useEffect(() => {
    onInterventionRef.current = onIntervention;
    onResolvedRef.current = onResolved;
  }, [onIntervention, onResolved]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Also prevent connecting if already connecting
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(`${WS_URL}/api/applications/v2/ws/interventions`);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          switch (message.type) {
            case "initial_state":
            case "refresh":
              setPendingCount(message.payload.pending_count || 0);
              setInterventions(message.payload.interventions || []);
              break;

            case "intervention":
              // New intervention received - map WebSocket payload to Intervention type
              const wsPayload = message.payload as InterventionWSMessage["payload"];
              const newIntervention: Intervention = {
                id: wsPayload.intervention_id,
                session_id: wsPayload.session_id,
                intervention_type: wsPayload.intervention_type as InterventionType,
                status: "pending" as InterventionStatus,
                title: wsPayload.title,
                description: wsPayload.description,
                current_url: wsPayload.current_url,
                created_at: new Date().toISOString(),
              };
              setInterventions((prev) => [newIntervention, ...prev]);
              setPendingCount((prev) => prev + 1);
              onInterventionRef.current?.(newIntervention);
              break;

            case "intervention_resolved":
              // Intervention was resolved
              const { intervention_id, action } = message.payload;
              setInterventions((prev) =>
                prev.filter((i) => i.id !== intervention_id)
              );
              setPendingCount((prev) => Math.max(0, prev - 1));
              onResolvedRef.current?.(intervention_id, action);
              break;

            case "pong":
              // Heartbeat response
              break;

            default:
              // Ignore unknown message types
              break;
          }
        } catch {
          // Silently ignore parse errors
        }
      };

      ws.onerror = () => {
        // Error event doesn't contain useful info - wait for close
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;

        // Set error for abnormal closures
        if (event.code !== 1000 && event.code !== 1001) {
          setError("Connection lost");
        }

        // Auto-reconnect for unexpected disconnections
        if (autoReconnect && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch {
      setError("Failed to connect");
    }
  }, [autoReconnect, reconnectInterval]); // Removed callback dependencies

  const refresh = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("refresh");
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    pendingCount,
    interventions,
    error,
    refresh,
  };
}

// Hook for session-specific updates (V2 API)
export function useSessionSocket(sessionId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    step: number;
    fieldsFilled: number;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    try {
      const ws = new WebSocket(
        `${WS_URL}/api/applications/v2/ws/${sessionId}`
      );

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "connected" || message.type === "status") {
            setStatus(message.payload.status);
            setProgress({
              step: message.payload.current_step,
              fieldsFilled: message.payload.fields_filled,
            });
          } else if (message.type === "progress") {
            setProgress({
              step: message.payload.progress_percent,
              fieldsFilled: message.payload.details?.fields_filled || 0,
            });
          }
        } catch {
          // Silently ignore parse errors
        }
      };

      ws.onerror = () => {
        // Wait for close event
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (event.code === 4004) {
          setError("Session not found");
        } else if (event.code !== 1000 && event.code !== 1001) {
          setError("Connection lost");
        }
      };

      wsRef.current = ws;

      return () => {
        ws.close(1000, "Component unmounted");
      };
    } catch {
      setError("Failed to connect");
    }
  }, [sessionId]);

  return { isConnected, status, progress, error };
}
