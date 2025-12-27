import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import type {
  EmailSenderPreferencesUpdate,
  UserCreate,
  UserUpdate,
} from "@/types/user";

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: UserCreate) => usersApi.create(user),
    onSuccess: (newUser) => {
      queryClient.setQueryData(["user", newUser.id], newUser);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UserUpdate }) =>
      usersApi.update(id, updates),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user", updatedUser.id], updatedUser);
    },
  });
}

export function useEmailSenders(userId: string) {
  return useQuery({
    queryKey: ["user", userId, "email-senders"],
    queryFn: () => usersApi.getEmailSenders(userId),
    enabled: !!userId,
  });
}

export function useUpdateEmailSenders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: EmailSenderPreferencesUpdate;
    }) => usersApi.updateEmailSenders(userId, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["user", variables.userId, "email-senders"],
        data
      );
    },
  });
}

// Gmail connection hooks
export function useGmailStatus(userId: string) {
  return useQuery({
    queryKey: ["gmail", userId, "status"],
    queryFn: () => usersApi.getGmailStatus(userId),
    enabled: !!userId,
    refetchOnWindowFocus: true, // Refetch when user returns from OAuth
  });
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.disconnectGmail(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["gmail", userId, "status"] });
    },
  });
}

// LinkedIn connection hooks
export function useLinkedInStatus(userId: string) {
  return useQuery({
    queryKey: ["linkedin", userId, "status"],
    queryFn: () => usersApi.getLinkedInStatus(userId),
    enabled: !!userId,
    refetchOnWindowFocus: true, // Refetch when user returns from OAuth
  });
}

export function useDisconnectLinkedIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.disconnectLinkedIn(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["linkedin", userId, "status"] });
    },
  });
}

// CV hooks
export function useUserCV(userId: string) {
  return useQuery({
    queryKey: ["user", userId, "cv"],
    queryFn: () => usersApi.getCV(userId),
    enabled: !!userId,
  });
}

export function useUploadCV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      usersApi.uploadCV(userId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId, "cv"] });
    },
  });
}

export function useDeleteCV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.deleteCV(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId, "cv"] });
    },
  });
}

export function useUserCVContent(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["user", userId, "cv-content"],
    queryFn: () => usersApi.getCVContent(userId),
    enabled: !!userId && enabled,
  });
}
