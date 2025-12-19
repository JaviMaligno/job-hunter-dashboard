import { apiClient } from "./client";
import type {
  Application,
  StartApplicationRequest,
  ApplicationStatusResponse,
  RateLimitStatus,
} from "@/types/application";

export const applicationsApi = {
  start: async (
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
    return apiClient<ApplicationStatusResponse>(
      `/api/applications/${sessionId}`
    );
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
