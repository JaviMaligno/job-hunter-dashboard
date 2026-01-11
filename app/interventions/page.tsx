"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  Wifi,
  WifiOff,
  Activity,
  Pause,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import { InterventionCard } from "@/components/interventions/InterventionCard";
import { SessionDetailDialog } from "@/components/interventions/SessionDetailDialog";
import { useInterventionSocket } from "@/lib/hooks/useInterventionSocket";
import { interventionsApi } from "@/lib/api/interventions";
import type { Intervention, SessionSummary } from "@/types/intervention";

export default function InterventionsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // WebSocket for real-time updates
  const {
    isConnected,
    pendingCount,
    interventions: wsInterventions,
    error: wsError,
    refresh: wsRefresh,
  } = useInterventionSocket({
    onIntervention: (intervention) => {
      // Could show a toast notification here
      console.log("New intervention:", intervention.title);
    },
  });

  // State for sessions
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [resumingSessionId, setResumingSessionId] = useState<string | null>(null);

  // State for session detail dialog
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fallback to API if WebSocket fails
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load interventions via API as fallback
  useEffect(() => {
    const loadInterventions = async () => {
      try {
        const data = await interventionsApi.list();
        setInterventions(data);
      } catch (err) {
        console.error("Failed to load interventions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load via API if WebSocket is not connected
    if (!isConnected) {
      loadInterventions();
    } else {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await interventionsApi.listSessions();
        setSessions(data);
      } catch (err) {
        setSessionsError(err instanceof Error ? err.message : "Failed to load sessions");
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, []);

  // Use WebSocket interventions if connected, otherwise use API data
  const displayInterventions = isConnected ? wsInterventions : interventions;

  const handleRefresh = async () => {
    if (isConnected) {
      wsRefresh();
    } else {
      setIsLoading(true);
      try {
        const data = await interventionsApi.list();
        setInterventions(data);
      } catch (err) {
        console.error("Failed to refresh:", err);
      } finally {
        setIsLoading(false);
      }
    }

    // Also refresh sessions
    setIsLoadingSessions(true);
    try {
      const data = await interventionsApi.listSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to refresh sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await interventionsApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSessionClick = (s: SessionSummary) => {
    setSelectedSession(s);
    setIsDetailOpen(true);
  };

  const handleMarkApplied = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === sessionId ? { ...s, status: "submitted", can_resume: false } : s
      )
    );
  };

  const handleResumeSession = async (sessionId: string) => {
    setResumingSessionId(sessionId);
    try {
      await interventionsApi.resumeSession(sessionId);
      // Optimistically update the session status
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId
            ? { ...s, status: "in_progress", can_resume: false }
            : s
        )
      );
      // Refresh sessions list after a short delay to get updated status
      setTimeout(async () => {
        const data = await interventionsApi.listSessions();
        setSessions(data);
      }, 2000);
    } catch (err) {
      console.error("Failed to resume session:", err);
      // Refresh to get actual state
      const data = await interventionsApi.listSessions();
      setSessions(data);
    } finally {
      setResumingSessionId(null);
    }
  };

  // Show loading while session is loading
  if (sessionStatus === "loading") {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const resumableSessions = sessions.filter((s) => s.can_resume);
  const completedSessions = sessions.filter((s) => !s.can_resume);

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automation Center</h1>
            <p className="text-muted-foreground mt-1">
              Manage interventions and application sessions
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>

            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayInterventions.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resumable</CardTitle>
            <Pause className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumableSessions.length}</div>
            <p className="text-xs text-muted-foreground">Sessions paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="interventions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interventions" className="relative">
            Interventions
            {displayInterventions.length > 0 && (
              <Badge className="ml-2 bg-orange-500">{displayInterventions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions">
            Sessions
            {resumableSessions.length > 0 && (
              <Badge className="ml-2 bg-blue-500">{resumableSessions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Interventions Tab */}
        <TabsContent value="interventions">
          {wsError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                Real-time updates unavailable: {wsError}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayInterventions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">All Clear!</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  No pending interventions. Your automation is running smoothly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayInterventions.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  onResolved={handleRefresh}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center h-[300px]">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">No Sessions</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  Start an application to see sessions here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumable Sessions */}
              {resumableSessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Resumable Sessions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumableSessions.map((s) => (
                      <Card
                        key={s.session_id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => handleSessionClick(s)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm truncate max-w-[200px]">
                              {s.job_url}
                            </CardTitle>
                            <Badge
                              variant={s.status === "paused" ? "secondary" : "destructive"}
                            >
                              {s.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            Step {s.current_step} - {s.fields_filled} fields filled
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResumeSession(s.session_id);
                              }}
                              disabled={resumingSessionId === s.session_id}
                            >
                              {resumingSessionId === s.session_id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  Resume
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(s.session_id);
                              }}
                              disabled={resumingSessionId === s.session_id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              {completedSessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Sessions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSessions.slice(0, 9).map((s) => (
                      <Card
                        key={s.session_id}
                        className="opacity-75 cursor-pointer hover:opacity-100 hover:border-primary/50 transition-all"
                        onClick={() => handleSessionClick(s)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm truncate max-w-[150px]">
                              {new URL(s.job_url).hostname}
                            </CardTitle>
                            <Badge
                              variant={
                                s.status === "submitted"
                                  ? "default"
                                  : s.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {s.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground">
                            {s.fields_filled} fields - {new Date(s.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Session Detail Dialog */}
      <SessionDetailDialog
        session={selectedSession}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onResume={handleResumeSession}
        onMarkApplied={handleMarkApplied}
      />
    </div>
  );
}
