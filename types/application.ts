export enum ApplicationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  SUBMITTED = "submitted",
  FAILED = "failed",
}

export enum ApplicationMode {
  ASSISTED = "assisted",
  SEMI_AUTO = "semi_auto",
  AUTO = "auto",
}

export interface CustomQuestion {
  question: string;
  answer: string;
  confidence: number;
}

export interface Application {
  id: string;
  job_id?: string;
  user_id: string;
  mode: ApplicationMode;
  status: ApplicationStatus;
  browser_session_id?: string;
  form_fields_filled?: Record<string, any>;
  form_questions_answered?: CustomQuestion[];
  screenshot_path?: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface StartApplicationRequest {
  job_url: string;
  mode: ApplicationMode;
}

export interface ApplicationStatusResponse {
  session_id: string;
  status: ApplicationStatus;
  mode: ApplicationMode;
  job_url: string;
  fields_filled?: Record<string, any>;
  questions_answered?: CustomQuestion[];
  screenshot_path?: string;
  error_message?: string;
}

export interface ApplicationUpdate {
  status: ApplicationStatus;
  message: string;
  screenshot_path?: string;
  fields_filled?: Record<string, any>;
  questions_answered?: CustomQuestion[];
}

export interface RateLimitStatus {
  total_today: number;
  auto_today: number;
  total_limit: number;
  auto_limit: number;
  reset_at: string;
}
