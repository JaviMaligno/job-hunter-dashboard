import { apiClient } from "./client";
import type {
  Job,
  JobCreate,
  JobUpdate,
  JobListResponse,
  JobStatus,
  JobImportResponse,
} from "@/types/job";

// CV Adaptation types
export interface CVAdaptRequest {
  job_url?: string;
  job_description?: string;
  job_title: string;
  company: string;
  cv_content?: string;
  language?: "en" | "es";
}

export interface CVAdaptResponse {
  adapted_cv: string;
  cover_letter: string;
  match_score: number;
  changes_made: string[];
  skills_matched: string[];
  skills_missing: string[];
  key_highlights: string[];
  job_id?: string;
  material_ids?: string[];
}

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

  /**
   * Adapt CV and generate cover letter for a job.
   * This uses AI to analyze the job requirements and adapt the CV.
   */
  adaptCV: async (request: CVAdaptRequest): Promise<CVAdaptResponse> => {
    return apiClient<CVAdaptResponse>("/api/jobs/adapt", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};
