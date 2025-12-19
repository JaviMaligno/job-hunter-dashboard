import { apiClient } from "./client";
import type {
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

  getGmailConnectUrl: (userId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/api/gmail/connect/${userId}`;
  },

  disconnectGmail: async (userId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/gmail/disconnect/${userId}`, {
      method: "DELETE",
    });
  },
};
