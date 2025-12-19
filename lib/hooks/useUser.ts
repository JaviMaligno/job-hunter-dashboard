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
