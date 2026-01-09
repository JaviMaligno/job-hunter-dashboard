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
  MANUAL = "manual",
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

// User data for form filling (matches backend UserFormData)
export interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_country_code?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  county_state?: string;
  country?: string;
  postal_code?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface StartApplicationRequest {
  job_url: string;
  user_data: UserFormData;
  cv_content: string;
  cv_file_path?: string;
  cover_letter?: string;
  mode: ApplicationMode;
  headless?: boolean;
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

// V2 API Types

export enum AgentType {
  GEMINI = "gemini",
  CLAUDE = "claude",
  HYBRID = "hybrid",
}

export interface StartApplicationV2Request {
  job_url: string;
  user_data: UserFormData;
  cv_content: string;
  cv_file_path?: string;
  cover_letter?: string;
  mode: ApplicationMode;
  agent?: AgentType;
  auto_solve_captcha?: boolean;
  gemini_model?: string;
  browser_mode?: string;
  devtools_url?: string;
}

export interface ApplicationV2Response {
  session_id: string;
  status: string;
  success: boolean;
  agent_used: string;
  steps_completed: string[];
  fields_filled: number;
  intervention_id?: string;
  intervention_type?: string;
  intervention_title?: string;
  captcha_solved: boolean;
  captcha_cost: number;
  error?: string;
  final_url?: string;
}
