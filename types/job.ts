export enum JobStatus {
  INBOX = "inbox",
  INTERESTING = "interesting",
  ADAPTED = "adapted",
  READY = "ready",
  APPLIED = "applied",
  BLOCKED = "blocked",
  REJECTED = "rejected",
  ARCHIVED = "archived",
}

export enum JobBlockerType {
  CAPTCHA = "captcha",
  LOGIN_REQUIRED = "login_required",
  FORM_TOO_COMPLEX = "form_too_complex",
  UNSUPPORTED_ATS = "unsupported_ats",
  OTHER = "other",
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  location: string | null;
  source_url: string;
  source_platform?: string;
  job_type?: string;
  description_raw?: string;
  description_summary?: string;
  requirements_extracted?: string[];
  salary_range?: string;
  match_score?: number;
  skills_matched?: string[];
  skills_missing?: string[];
  match_explanation?: string;
  status: JobStatus;
  blocker_type?: JobBlockerType;
  blocker_details?: string;
  ats_type?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  source_url: string;
  title: string;
  company?: string;
  location?: string;
  job_type?: string;
  description_raw?: string;
  source_platform?: string;
}

export interface JobUpdate {
  status?: JobStatus;
  title?: string;
  company?: string;
  location?: string;
  description_raw?: string;
  blocker_type?: JobBlockerType;
  blocker_details?: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
}

export interface JobImportResponse {
  job: Job;
  message: string;
  scraped_fields: string[];
}
