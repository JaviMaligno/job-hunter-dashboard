import { apiClient } from "./client";
import type {
  EmailSenderPreferencesResponse,
  EmailSenderPreferencesUpdate,
  User,
  UserCreate,
  UserUpdate,
} from "@/types/user";

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
};
