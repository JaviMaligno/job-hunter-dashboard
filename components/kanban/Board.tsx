"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Job, JobStatus } from "@/types/job";
import { Column } from "./Column";
import { JobCard } from "./JobCard";
import { useUpdateJobStatus } from "@/lib/hooks/useJobs";

interface BoardProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

const COLUMNS: Array<{ status: JobStatus; title: string }> = [
  { status: "inbox" as JobStatus, title: "Inbox" },
  { status: "interesting" as JobStatus, title: "Interesting" },
  { status: "adapted" as JobStatus, title: "CV Adapted" },
  { status: "ready" as JobStatus, title: "Ready to Apply" },
  { status: "applied" as JobStatus, title: "Applied" },
  { status: "blocked" as JobStatus, title: "Blocked" },
  { status: "rejected" as JobStatus, title: "Rejected" },
  { status: "archived" as JobStatus, title: "Archived" },
];

export function Board({ jobs, onJobClick }: BoardProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const updateJobStatus = useUpdateJobStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find((j) => j.id === event.active.id);
    if (job) {
      setActiveJob(job);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveJob(null);
      return;
    }

    const jobId = active.id as string;
    const newStatus = over.id as JobStatus;

    const job = jobs.find((j) => j.id === jobId);
    if (job && job.status !== newStatus) {
      // Optimistic update
      updateJobStatus.mutate({ id: jobId, status: newStatus });
    }

    setActiveJob(null);
  };

  const getJobsByStatus = (status: JobStatus) => {
    return jobs.filter((job) => job.status === status);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.status}
            status={column.status}
            title={column.title}
            jobs={getJobsByStatus(column.status)}
            onJobClick={onJobClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
