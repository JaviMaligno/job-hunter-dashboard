import { apiClient } from "./client";
import type {
  Intervention,
  SessionSummary,
  StartApplicationV2Request,
  ApplicationV2Response,
  ResolveInterventionRequest,
} from "@/types/intervention";

export const interventionsApi = {
  // Start a v2 application
  startV2: async (
    request: StartApplicationV2Request
  ): Promise<ApplicationV2Response> => {
    return apiClient<ApplicationV2Response>("/api/applications/v2/start", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // List all interventions
  list: async (): Promise<Intervention[]> => {
    return apiClient<Intervention[]>("/api/applications/v2/interventions");
  },

  // Get a specific intervention
  get: async (interventionId: string): Promise<Intervention> => {
    return apiClient<Intervention>(
      `/api/applications/v2/interventions/${interventionId}`
    );
  },

  // Resolve an intervention
  resolve: async (
    interventionId: string,
    request: ResolveInterventionRequest
  ): Promise<{ status: string; intervention_id: string; action: string }> => {
    return apiClient<{ status: string; intervention_id: string; action: string }>(
      `/api/applications/v2/interventions/${interventionId}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  },

  // List all sessions
  listSessions: async (resumableOnly: boolean = false): Promise<SessionSummary[]> => {
    const params = resumableOnly ? "?resumable_only=true" : "";
    return apiClient<SessionSummary[]>(`/api/applications/v2/sessions${params}`);
  },

  // Get session details
  getSession: async (sessionId: string): Promise<any> => {
    return apiClient<any>(`/api/applications/v2/sessions/${sessionId}`);
  },

  // Resume a session
  resumeSession: async (
    sessionId: string,
    options?: { restore_browser?: boolean; auto_solve_captcha?: boolean }
  ): Promise<ApplicationV2Response> => {
    return apiClient<ApplicationV2Response>(
      `/api/applications/v2/sessions/${sessionId}/resume`,
      {
        method: "POST",
        body: JSON.stringify(options || {}),
      }
    );
  },

  // Delete a session
  deleteSession: async (sessionId: string): Promise<{ status: string; session_id: string }> => {
    return apiClient<{ status: string; session_id: string }>(
      `/api/applications/v2/sessions/${sessionId}`,
      {
        method: "DELETE",
      }
    );
  },
};
