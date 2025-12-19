import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import type { Job, JobStatus } from "@/types/job";
import { SortableJobCard } from "./SortableJobCard";

interface ColumnProps {
  status: JobStatus;
  title: string;
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

export function Column({ status, title, jobs, onJobClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col gap-2 min-w-[280px] max-w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <h2 className="font-semibold text-sm">{title}</h2>
        <Badge variant="secondary">{jobs.length}</Badge>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 p-2 bg-muted/30 rounded-lg min-h-[500px]"
      >
        <SortableContext
          items={jobs.map((job) => job.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No jobs in this stage
            </div>
          ) : (
            jobs.map((job) => (
              <SortableJobCard
                key={job.id}
                job={job}
                onClick={() => onJobClick(job)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
