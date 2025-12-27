import { apiClient } from "./client";
import {
  AgentType,
  type Application,
  type StartApplicationRequest,
  type ApplicationStatusResponse,
  type RateLimitStatus,
  type StartApplicationV2Request,
  type ApplicationV2Response,
} from "@/types/application";

export const applicationsApi = {
  // V2 start endpoint with intervention support
  start: async (
    userId: string,
    request: StartApplicationRequest,
    jobId?: string
  ): Promise<ApplicationV2Response> => {
    const params = new URLSearchParams({ user_id: userId });
    if (jobId) {
      params.append("job_id", jobId);
    }

    // Convert legacy request to V2 format
    const v2Request: StartApplicationV2Request = {
      job_url: request.job_url,
      user_data: request.user_data,
      cv_content: request.cv_content,
      cv_file_path: request.cv_file_path,
      cover_letter: request.cover_letter,
      mode: request.mode,
      agent: AgentType.CLAUDE, // Default to Claude agent
      auto_solve_captcha: true,
    };

    return apiClient<ApplicationV2Response>(
      `/api/applications/v2/start?${params}`,
      {
        method: "POST",
        body: JSON.stringify(v2Request),
      }
    );
  },

  // Legacy start endpoint (deprecated)
  startLegacy: async (
    userId: string,
    request: StartApplicationRequest,
    jobId?: string
  ): Promise<ApplicationStatusResponse> => {
    const params = new URLSearchParams({ user_id: userId });
    if (jobId) {
      params.append("job_id", jobId);
    }

    return apiClient<ApplicationStatusResponse>(
      `/api/applications?${params}`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  },

  getStatus: async (sessionId: string): Promise<ApplicationStatusResponse> => {
    // Try V2 endpoint first for full status including intervention info
    try {
      const v2Response = await apiClient<{
        session_id: string;
        status: string;
        mode: string;
        job_url: string;
        fields_filled: Record<string, any>;
        blocker_type?: string;
        blocker_message?: string;
        intervention_id?: string;
        error?: string;
      }>(`/api/applications/v2/sessions/${sessionId}`);

      // Convert to ApplicationStatusResponse format
      return {
        session_id: v2Response.session_id,
        status: v2Response.status as any,
        mode: v2Response.mode as any,
        job_url: v2Response.job_url,
        fields_filled: v2Response.fields_filled,
        error_message: v2Response.error,
      };
    } catch {
      // Fall back to legacy endpoint if V2 fails
      return apiClient<ApplicationStatusResponse>(
        `/api/applications/${sessionId}`
      );
    }
  },

  pause: async (sessionId: string): Promise<ApplicationStatusResponse> => {
    return apiClient<ApplicationStatusResponse>(
      `/api/applications/${sessionId}/pause`,
      {
        method: "POST",
      }
    );
  },

  resume: async (sessionId: string): Promise<ApplicationStatusResponse> => {
    return apiClient<ApplicationStatusResponse>(
      `/api/applications/${sessionId}/resume`,
      {
        method: "POST",
      }
    );
  },

  submit: async (sessionId: string): Promise<ApplicationStatusResponse> => {
    return apiClient<ApplicationStatusResponse>(
      `/api/applications/${sessionId}/submit`,
      {
        method: "POST",
      }
    );
  },

  getRateLimit: async (userId: string): Promise<RateLimitStatus> => {
    return apiClient<RateLimitStatus>(
      `/api/applications/rate-limit?user_id=${userId}`
    );
  },
};
