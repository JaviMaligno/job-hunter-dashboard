// Intervention types for v2 API

export enum InterventionType {
  CAPTCHA = "captcha",
  LOGIN_REQUIRED = "login_required",
  FILE_UPLOAD = "file_upload",
  CUSTOM_QUESTION = "custom_question",
  MULTI_STEP_FORM = "multi_step_form",
  REVIEW_BEFORE_SUBMIT = "review_before_submit",
  ERROR = "error",
  OTHER = "other",
}

export enum InterventionStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CANCELLED = "cancelled",
  TIMED_OUT = "timed_out",
}

export enum AgentType {
  GEMINI = "gemini",
  CLAUDE = "claude",
  HYBRID = "hybrid",
}

export interface Intervention {
  id: string;
  session_id: string;
  intervention_type: InterventionType;
  status: InterventionStatus;
  title: string;
  description: string;
  instructions?: string;
  current_url?: string;
  captcha_type?: string;
  captcha_solve_attempted?: boolean;
  captcha_solve_error?: string;
  fields_filled?: Record<string, string>;
  fields_remaining?: string[];
  screenshot_path?: string;
  created_at: string;
}

export interface SessionSummary {
  session_id: string;
  job_url: string;
  status: string;
  current_step: number;
  fields_filled: number;
  created_at: string;
  paused_at?: string;
  can_resume: boolean;
}

export interface StartApplicationV2Request {
  job_url: string;
  user_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_country_code?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    address_line_1?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  };
  cv_content: string;
  cv_file_path?: string;
  cover_letter?: string;
  agent?: AgentType;
  auto_solve_captcha?: boolean;
  gemini_model?: string;
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

export interface ResolveInterventionRequest {
  action: "continue" | "submit" | "cancel" | "retry";
  notes?: string;
  close_browser?: boolean;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface InterventionWSMessage extends WSMessage {
  type: "intervention";
  payload: {
    intervention_id: string;
    session_id: string;
    user_id: string;
    intervention_type: string;
    title: string;
    description: string;
    current_url?: string;
  };
}

export interface StatusWSMessage extends WSMessage {
  type: "status" | "connected";
  payload: {
    session_id: string;
    status: string;
    current_step: number;
    fields_filled: number;
    blocker_type?: string;
  };
}
