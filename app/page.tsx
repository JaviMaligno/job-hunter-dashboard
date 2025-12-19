"use client";

import { useState, useCallback } from "react";
import { Board } from "@/components/kanban/Board";
import { useJobs, useSearchJobs } from "@/lib/hooks/useJobs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { SearchFilterBar } from "@/components/jobs/SearchFilterBar";
import { Icons } from "@/components/icons";
import type { Job, JobStatus } from "@/types/job";

// TODO: Replace with actual user ID from auth
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

interface SearchFilters {
  q?: string;
  status?: JobStatus;
  company?: string;
  location?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);

  // Regular jobs query (when not searching)
  const jobsQuery = useJobs(TEMP_USER_ID);

  // Search query (when searching)
  const searchQuery = useSearchJobs(
    TEMP_USER_ID,
    searchFilters || {},
    !!searchFilters
  );

  // Use search results when searching, otherwise regular jobs
  const isSearching = !!searchFilters;
  const activeQuery = isSearching ? searchQuery : jobsQuery;
  const { data, isLoading, error } = activeQuery;

  const handleJobClick = (job: Job) => {
    router.push(`/jobs/${job.id}`);
  };

  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchFilters(null);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-red-600">Error loading jobs: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            {data?.total || 0} total jobs
          </p>
        </div>
        <AddJobDialog userId={TEMP_USER_ID}>
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </AddJobDialog>
      </div>

      <div className="mb-6">
        <SearchFilterBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          isSearching={searchQuery.isFetching}
          resultCount={isSearching ? data?.total : undefined}
        />
      </div>

      <Board jobs={data?.jobs || []} onJobClick={handleJobClick} />
    </div>
  );
}
