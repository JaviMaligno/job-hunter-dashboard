import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applications";
import type { StartApplicationRequest } from "@/types/application";

export function useApplicationStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ["application", sessionId],
    queryFn: () => applicationsApi.getStatus(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds for status updates
  });
}

export function useStartApplication(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      jobId,
    }: {
      request: StartApplicationRequest;
      jobId?: string;
    }) => applicationsApi.start(userId, request, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rateLimit", userId] });
    },
  });
}

export function usePauseApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => applicationsApi.pause(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(["application", data.session_id], data);
    },
  });
}

export function useResumeApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => applicationsApi.resume(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(["application", data.session_id], data);
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => applicationsApi.submit(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(["application", data.session_id], data);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useRateLimit(userId: string) {
  return useQuery({
    queryKey: ["rateLimit", userId],
    queryFn: () => applicationsApi.getRateLimit(userId),
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });
}
