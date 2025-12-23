export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  base_cv_path?: string;
  job_preferences?: JobPreferences;
  created_at: string;
  updated_at: string;
}

export interface JobPreferences {
  desired_roles?: string[];
  desired_locations?: string[];
  min_salary?: number;
  max_salary?: number;
  remote_preference?: "remote" | "hybrid" | "onsite" | "any";
  work_authorization?: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  job_preferences?: JobPreferences;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  job_preferences?: JobPreferences;
}

// Email Sender Preferences
export interface EmailSender {
  id: string;
  name: string;
  pattern: string;
  enabled: boolean;
  is_custom: boolean;
}

export interface EmailSenderPreferences {
  senders: EmailSender[];
  enabled_sender_ids: string[];
  disabled_sender_ids: string[];
}

export interface EmailSenderPreferencesUpdate {
  enabled_sender_ids?: string[];
  disabled_sender_ids?: string[];
  custom_senders?: Omit<EmailSender, "is_custom">[];
  remove_sender_ids?: string[];
}

export interface EmailSenderPreferencesResponse {
  default_senders: EmailSender[];
  user_preferences: EmailSenderPreferences;
  effective_senders: EmailSender[];
}

// CV Types (matching API response from users.py)
export interface CVResponse {
  has_cv: boolean;
  text_length: number;
  preview: string | null;
  content: string | null;
}

export interface CVUploadResponse {
  success: boolean;
  message: string;
  text_length: number;
  preview: string;
}
