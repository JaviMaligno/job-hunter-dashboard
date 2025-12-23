"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Board } from "@/components/kanban/Board";
import { useJobs, useSearchJobs } from "@/lib/hooks/useJobs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { SearchFilterBar } from "@/components/jobs/SearchFilterBar";
import { Icons } from "@/components/icons";
import type { Job, JobStatus } from "@/types/job";

interface SearchFilters {
  q?: string;
  status?: JobStatus;
  company?: string;
  location?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);

  const userId = session?.user?.id;

  // Regular jobs query (when not searching)
  const jobsQuery = useJobs(userId || "");

  // Search query (when searching)
  const searchQuery = useSearchJobs(
    userId || "",
    searchFilters || {},
    !!searchFilters && !!userId
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

  // Show loading while session or jobs are loading
  if (sessionStatus === "loading" || (userId && isLoading)) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (sessionStatus === "unauthenticated" || !userId) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Please log in to view your jobs.</p>
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
        <AddJobDialog userId={userId}>
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
