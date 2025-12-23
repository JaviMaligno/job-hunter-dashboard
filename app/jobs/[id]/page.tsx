"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useJob } from "@/lib/hooks/useJobs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ExternalLink,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { JobBlockerType, JobStatus } from "@/types/job";
import { ApplicationModeSelector } from "@/components/jobs/ApplicationModeSelector";
import { CVAdaptDialog } from "@/components/jobs/CVAdaptDialog";
import { useState } from "react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const jobId = params.id as string;
  const userId = session?.user?.id;
  const { data: job, isLoading, error } = useJob(jobId);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showCVAdaptDialog, setShowCVAdaptDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px] flex-col gap-4">
          <p className="text-red-600">Error loading job details</p>
          <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getBlockerLabel = (type: JobBlockerType) => {
    const labels: Record<JobBlockerType, string> = {
      captcha: "CAPTCHA Detected",
      login_required: "Login Required",
      form_too_complex: "Form Too Complex",
      unsupported_ats: "Unsupported ATS",
      other: "Blocked",
    };
    return labels[type] || "Blocked";
  };

  const canApply =
    job.status !== JobStatus.APPLIED && job.status !== JobStatus.REJECTED;

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              {job.company && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{job.company}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {job.match_score !== undefined && job.match_score !== null && (
              <div className="flex items-center gap-2">
                <Sparkles className={`h-5 w-5 ${getMatchScoreColor(job.match_score)}`} />
                <span className={`text-2xl font-bold ${getMatchScoreColor(job.match_score)}`}>
                  {job.match_score}%
                </span>
                <span className="text-muted-foreground">match</span>
              </div>
            )}
            {canApply && (
              <Button onClick={() => setShowApplicationModal(true)}>
                Start Application
              </Button>
            )}
            {job.status === JobStatus.APPLIED && (
              <Badge className="bg-green-600">Applied</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Blocker Warning */}
      {job.blocker_type && (job.blocker_type as string) !== "none" && (
        <Card className="mb-6 border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">
                  {getBlockerLabel(job.blocker_type)}
                </p>
                {job.blocker_details && (
                  <p className="text-sm text-orange-800 mt-1">
                    {job.blocker_details}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              {job.description_raw ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{job.description_raw}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No description available</p>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements_extracted && job.requirements_extracted.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ul className="list-disc list-inside space-y-1">{job.requirements_extracted.map((req, index) => (<li key={index} className="text-sm">{req}</li>))}</ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills Match */}
          {(job.skills_matched || job.skills_missing) && (
            <Card>
              <CardHeader>
                <CardTitle>Skills Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.skills_matched && job.skills_matched.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-green-700">
                      Matched Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_matched.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-green-500 text-green-700"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {job.skills_missing && job.skills_missing.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-red-700">
                      Missing Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_missing.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-red-500 text-red-700"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {job.salary_range && (
                <div>
                  <p className="text-muted-foreground">Salary Range</p>
                  <p className="font-medium">{job.salary_range}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge>{job.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Job URL</p>
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <span className="truncate">View posting</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Application Materials</CardTitle>
              <CardDescription>
                Generated documents for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowCVAdaptDialog(true)}
                className="w-full"
                variant="secondary"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Adapt CV & Generate Cover Letter
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                AI will analyze the job requirements and adapt your CV
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Mode Selector Modal */}
      {showApplicationModal && (
        <ApplicationModeSelector
          jobId={jobId}
          jobUrl={job.source_url}
          userId={userId || ""}
          onClose={() => setShowApplicationModal(false)}
        />
      )}

      {/* CV Adapt Dialog */}
      <CVAdaptDialog
        open={showCVAdaptDialog}
        onOpenChange={setShowCVAdaptDialog}
        jobTitle={job.title}
        company={job.company || "Unknown Company"}
        jobDescription={job.description_raw}
        jobUrl={job.source_url}
        userId={userId}
      />
    </div>
  );
}
