import { apiClient } from "./client";
import type {
  CVResponse,
  CVUploadResponse,
  EmailSenderPreferencesResponse,
  EmailSenderPreferencesUpdate,
  User,
  UserCreate,
  UserUpdate,
} from "@/types/user";

export interface GmailStatus {
  connected: boolean;
  email: string | null;
  last_sync_at: string | null;
  can_manage_labels: boolean;
  can_modify: boolean;
}

export interface GmailConnectOptions {
  labels?: boolean;
  modify?: boolean;
}

export interface EmailScanRequest {
  max_emails?: number;
  unread_only?: boolean;
}

export interface ScannedEmail {
  message_id: string;
  subject: string;
  sender: string;
  received_at: string;
}

export interface EmailScanResponse {
  success: boolean;
  emails_scanned: number;
  jobs_extracted: number;
  jobs_skipped_duplicates: number;
  emails: ScannedEmail[];
  message?: string;
}

export const usersApi = {
  create: async (user: UserCreate): Promise<User> => {
    return apiClient<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  get: async (id: string): Promise<User> => {
    return apiClient<User>(`/api/users/${id}`);
  },

  update: async (id: string, updates: UserUpdate): Promise<User> => {
    return apiClient<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  getEmailSenders: async (
    userId: string
  ): Promise<EmailSenderPreferencesResponse> => {
    return apiClient<EmailSenderPreferencesResponse>(
      `/api/users/${userId}/email-senders`
    );
  },

  updateEmailSenders: async (
    userId: string,
    updates: EmailSenderPreferencesUpdate
  ): Promise<EmailSenderPreferencesResponse> => {
    return apiClient<EmailSenderPreferencesResponse>(
      `/api/users/${userId}/email-senders`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
  },

  // Gmail connection
  getGmailStatus: async (userId: string): Promise<GmailStatus> => {
    return apiClient<GmailStatus>(`/api/gmail/status/${userId}`);
  },

  getGmailConnectUrl: (userId: string, options?: GmailConnectOptions): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const params = new URLSearchParams();
    if (options?.labels) params.set("labels", "true");
    if (options?.modify) params.set("modify", "true");
    const queryString = params.toString();
    return `${baseUrl}/api/gmail/connect/${userId}${queryString ? `?${queryString}` : ""}`;
  },

  disconnectGmail: async (userId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/gmail/disconnect/${userId}`, {
      method: "DELETE",
    });
  },

  // Email scanning
  scanEmails: async (userId: string, options?: EmailScanRequest): Promise<EmailScanResponse> => {
    return apiClient<EmailScanResponse>(`/api/gmail/scan/${userId}`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  },

  // CV management
  getCV: async (userId: string): Promise<CVResponse> => {
    return apiClient<CVResponse>(`/api/users/${userId}/cv`);
  },

  uploadCV: async (userId: string, file: File): Promise<CVUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/users/${userId}/cv`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || "Failed to upload CV");
    }

    return response.json();
  },

  deleteCV: async (userId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/users/${userId}/cv`, {
      method: "DELETE",
    });
  },

  getCVContent: async (userId: string): Promise<string> => {
    const data = await apiClient<CVResponse>(`/api/users/${userId}/cv?include_content=true`);
    return data.content || "";
  },
};
