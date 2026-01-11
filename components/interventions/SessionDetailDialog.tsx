"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { interventionsApi } from "@/lib/api/interventions";
import type { SessionSummary, SessionDetail } from "@/types/intervention";

interface SessionDetailDialogProps {
  session: SessionSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume?: (sessionId: string) => void;
  onMarkApplied?: (sessionId: string) => void;
}

export function SessionDetailDialog({
  session,
  open,
  onOpenChange,
  onResume,
  onMarkApplied,
}: SessionDetailDialogProps) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!session) return;
      setIsLoading(true);
      try {
        const data = await interventionsApi.getSession(session.session_id);
        setDetail(data);
      } catch (err) {
        console.error("Failed to load session details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && session) {
      fetchDetails();
    } else {
      setDetail(null);
    }
  }, [open, session]);

  const handleResume = async () => {
    if (!session) return;
    setIsResuming(true);
    try {
      if (onResume) {
        onResume(session.session_id);
      }
      onOpenChange(false);
    } finally {
      setIsResuming(false);
    }
  };

  const handleMarkApplied = async () => {
    if (!session) return;
    setIsMarking(true);
    try {
      await interventionsApi.markAsApplied(session.session_id);
      if (onMarkApplied) {
        onMarkApplied(session.session_id);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to mark as applied:", err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleOpenUrl = () => {
    if (detail?.current_url || session?.job_url) {
      window.open(detail?.current_url || session?.job_url, "_blank");
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-600">Submitted</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "needs_intervention":
        return <Badge className="bg-orange-500">Needs Attention</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBlockerInfo = () => {
    if (!detail?.blocker_type) return null;

    const blockerLabels: Record<string, { label: string; icon: React.ReactNode }> = {
      captcha: { label: "CAPTCHA Required", icon: <AlertCircle className="h-4 w-4" /> },
      login_required: { label: "Login Required", icon: <AlertCircle className="h-4 w-4" /> },
      file_upload: { label: "File Upload Needed", icon: <AlertCircle className="h-4 w-4" /> },
      custom_question: { label: "Custom Questions", icon: <AlertCircle className="h-4 w-4" /> },
      multi_step_form: { label: "Multi-Step Form", icon: <Clock className="h-4 w-4" /> },
      review_before_submit: { label: "Review Required", icon: <CheckCircle className="h-4 w-4" /> },
    };

    return blockerLabels[detail.blocker_type] || { label: detail.blocker_type, icon: <AlertCircle className="h-4 w-4" /> };
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Session Details
            {detail && getStatusBadge(detail.status)}
          </DialogTitle>
          <DialogDescription className="truncate">
            {session.job_url}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* Blocker Info */}
              {detail.blocker_type && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-medium mb-1">
                    {getBlockerInfo()?.icon}
                    {getBlockerInfo()?.label}
                  </div>
                  {detail.blocker_message && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {detail.blocker_message}
                    </p>
                  )}
                </div>
              )}

              {/* Error Info */}
              {detail.error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Error
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">{detail.error}</p>
                </div>
              )}

              {/* Progress Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-lg font-semibold">
                    Step {detail.current_step} / {detail.total_steps}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Mode</p>
                  <p className="text-lg font-semibold capitalize">{detail.mode.replace("_", " ")}</p>
                </div>
              </div>

              {/* Steps Completed */}
              {detail.steps_completed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Steps Completed</h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.steps_completed.map((step, i) => (
                      <Badge key={i} variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {step}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields Filled */}
              {Object.keys(detail.fields_filled).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Fields Filled ({Object.keys(detail.fields_filled).length})
                  </h4>
                  <div className="bg-muted/30 rounded-lg divide-y divide-border">
                    {Object.entries(detail.fields_filled).map(([field, value]) => (
                      <div
                        key={field}
                        className="flex items-center justify-between p-2 text-sm hover:bg-muted/50 cursor-pointer group"
                        onClick={() => copyToClipboard(value, field)}
                      >
                        <span className="text-muted-foreground">{field}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono truncate max-w-[200px]">{value}</span>
                          {copiedField === field ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields Remaining */}
              {detail.fields_remaining.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Fields Remaining ({detail.fields_remaining.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.fields_remaining.map((field, i) => (
                      <Badge key={i} variant="outline" className="text-orange-600 border-orange-600">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(detail.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(detail.updated_at).toLocaleString()}</p>
                {detail.paused_at && (
                  <p>Paused: {new Date(detail.paused_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Failed to load session details
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleOpenUrl}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open URL
          </Button>

          <div className="flex gap-2">
            {detail?.can_resume && (
              <Button onClick={handleResume} disabled={isResuming}>
                {isResuming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Resume Session
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleMarkApplied}
              disabled={isMarking || detail?.status === "submitted"}
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Applied
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
