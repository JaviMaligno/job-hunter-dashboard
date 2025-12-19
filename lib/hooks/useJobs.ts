import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api/jobs";
import type { JobCreate, JobUpdate, JobStatus } from "@/types/job";

export function useJobs(
  userId: string,
  status?: JobStatus,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ["jobs", userId, status, page, pageSize],
    queryFn: () =>
      jobsApi.list({ user_id: userId, status, page, page_size: pageSize }),
    enabled: !!userId,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateJob(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (job: JobCreate) => jobsApi.create(userId, job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", userId] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: JobUpdate }) =>
      jobsApi.update(id, updates),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.setQueryData(["job", updatedJob.id], updatedJob);
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobsApi.updateStatus(id, status),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.setQueryData(["job", updatedJob.id], updatedJob);
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useImportJobFromUrl(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => jobsApi.importFromUrl(userId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", userId] });
    },
  });
}

export function useSearchJobs(
  userId: string,
  params: {
    q?: string;
    status?: JobStatus;
    company?: string;
    location?: string;
    min_match_score?: number;
    page?: number;
    page_size?: number;
  },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["jobs", "search", userId, params],
    queryFn: () =>
      jobsApi.search({
        user_id: userId,
        ...params,
      }),
    enabled: enabled && !!userId,
  });
}
