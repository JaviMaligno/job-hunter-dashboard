"use client";

import { useParams, useRouter } from "next/navigation";
import { useApplicationStatus, usePauseApplication, useResumeApplication, useSubmitApplication } from "@/lib/hooks/useApplications";
import { useApplicationWebSocket } from "@/lib/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pause, Play, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ApplicationStatus, ApplicationMode } from "@/types/application";
import { useEffect } from "react";

export default function ApplicationTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { data: application, isLoading } = useApplicationStatus(sessionId);
  const { isConnected, lastMessage, connectionError } = useApplicationWebSocket(sessionId);
  const pauseMutation = usePauseApplication();
  const resumeMutation = useResumeApplication();
  const submitMutation = useSubmitApplication();

  // Redirect to home when completed
  useEffect(() => {
    if (
      application?.status === ApplicationStatus.SUBMITTED ||
      application?.status === ApplicationStatus.FAILED
    ) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [application?.status, router]);

  const getStatusColor = (status: ApplicationStatus) => {
    const colors: Record<ApplicationStatus, string> = {
      pending: "bg-gray-500",
      in_progress: "bg-blue-500",
      paused: "bg-yellow-500",
      submitted: "bg-green-500",
      failed: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.SUBMITTED:
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case ApplicationStatus.FAILED:
        return <XCircle className="h-6 w-6 text-red-600" />;
      case ApplicationStatus.IN_PROGRESS:
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px] flex-col gap-4">
          <p className="text-red-600">Application not found</p>
          <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isCompleted =
    application.status === ApplicationStatus.SUBMITTED ||
    application.status === ApplicationStatus.FAILED;
  const canPause =
    application.status === ApplicationStatus.IN_PROGRESS &&
    application.mode === ApplicationMode.ASSISTED;
  const canResume = application.status === ApplicationStatus.PAUSED;
  const canSubmit =
    application.status === ApplicationStatus.PAUSED &&
    application.mode === ApplicationMode.ASSISTED;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Application Progress</h1>
            <p className="text-muted-foreground">{application.job_url}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(application.status)}>
              {application.status}
            </Badge>
            <Badge variant="outline">{application.mode}</Badge>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(application.status)}
              <div>
                <CardTitle>
                  {application.status === ApplicationStatus.SUBMITTED && "Application Submitted!"}
                  {application.status === ApplicationStatus.FAILED && "Application Failed"}
                  {application.status === ApplicationStatus.IN_PROGRESS && "Filling Out Form..."}
                  {application.status === ApplicationStatus.PAUSED && "Paused for Review"}
                  {application.status === ApplicationStatus.PENDING && "Starting..."}
                </CardTitle>
                <CardDescription>
                  {lastMessage?.message || "Processing application"}
                </CardDescription>
              </div>
            </div>

            {/* WebSocket Connection Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : connectionError ? "bg-red-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-muted-foreground">
                {isConnected ? "Live" : connectionError ? connectionError : "Connecting..."}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          {application.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {application.error_message}
            </div>
          )}

          {/* Screenshot */}
          {(application.screenshot_path || lastMessage?.screenshot_path) && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Current View</h3>
              <img
                src={lastMessage?.screenshot_path || application.screenshot_path}
                alt="Application screenshot"
                className="w-full rounded border"
              />
            </div>
          )}

          {/* Fields Filled */}
          {Object.keys(application.fields_filled || {}).length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Fields Filled</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(application.fields_filled!).map(([key, value]) => (
                  <div key={key} className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground text-xs">{key}</p>
                    <p className="font-medium truncate">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions Answered */}
          {application.questions_answered && application.questions_answered.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Questions Answered</h3>
              <div className="space-y-2">
                {application.questions_answered.map((qa, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded">
                    <p className="font-medium text-sm mb-1">{qa.question}</p>
                    <p className="text-sm">{qa.answer}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {Math.round(qa.confidence * 100)}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          {!isCompleted && (
            <div className="flex gap-2 pt-4">
              {canPause && (
                <Button
                  variant="outline"
                  onClick={() => pauseMutation.mutate(sessionId)}
                  disabled={pauseMutation.isPending}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              {canResume && (
                <Button
                  variant="outline"
                  onClick={() => resumeMutation.mutate(sessionId)}
                  disabled={resumeMutation.isPending}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              {canSubmit && (
                <Button
                  onClick={() => submitMutation.mutate(sessionId)}
                  disabled={submitMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </Button>
              )}
            </div>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <div className="text-center p-4">
              <p className="text-muted-foreground">
                Redirecting to dashboard in 5 seconds...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
