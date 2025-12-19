import { apiClient } from "./client";
import type {
  Job,
  JobCreate,
  JobUpdate,
  JobListResponse,
  JobStatus,
  JobImportResponse,
} from "@/types/job";

export const jobsApi = {
  list: async (params: {
    user_id: string;
    status?: JobStatus;
    page?: number;
    page_size?: number;
  }): Promise<JobListResponse> => {
    const searchParams = new URLSearchParams({
      user_id: params.user_id,
      ...(params.status && { status: params.status }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.page_size && { page_size: params.page_size.toString() }),
    });

    return apiClient<JobListResponse>(`/api/jobs?${searchParams}`);
  },

  get: async (id: string): Promise<Job> => {
    return apiClient<Job>(`/api/jobs/${id}`);
  },

  create: async (userId: string, job: JobCreate): Promise<Job> => {
    return apiClient<Job>(`/api/jobs?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify(job),
    });
  },

  update: async (id: string, updates: JobUpdate): Promise<Job> => {
    return apiClient<Job>(`/api/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  updateStatus: async (id: string, status: JobStatus): Promise<Job> => {
    return jobsApi.update(id, { status });
  },

  delete: async (id: string): Promise<void> => {
    return apiClient<void>(`/api/jobs/${id}`, {
      method: "DELETE",
    });
  },

  importFromUrl: async (userId: string, url: string): Promise<JobImportResponse> => {
    return apiClient<JobImportResponse>(`/api/jobs/import-url?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  search: async (params: {
    user_id: string;
    q?: string;
    status?: JobStatus;
    company?: string;
    location?: string;
    min_match_score?: number;
    page?: number;
    page_size?: number;
  }): Promise<JobListResponse & { query?: string; filters?: Record<string, unknown> }> => {
    const searchParams = new URLSearchParams({
      user_id: params.user_id,
      ...(params.q && { q: params.q }),
      ...(params.status && { status: params.status }),
      ...(params.company && { company: params.company }),
      ...(params.location && { location: params.location }),
      ...(params.min_match_score !== undefined && { min_match_score: params.min_match_score.toString() }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.page_size && { page_size: params.page_size.toString() }),
    });

    return apiClient<JobListResponse & { query?: string; filters?: Record<string, unknown> }>(
      `/api/jobs/search?${searchParams}`
    );
  },
};
