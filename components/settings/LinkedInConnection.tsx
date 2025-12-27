"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLinkedInStatus, useDisconnectLinkedIn } from "@/lib/hooks/useUser";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, ExternalLink, Linkedin } from "lucide-react";

interface LinkedInConnectionProps {
  userId: string;
}

function LinkedInConnectionContent({ userId }: LinkedInConnectionProps) {
  const searchParams = useSearchParams();
  const { data: status, isLoading, refetch } = useLinkedInStatus(userId);
  const disconnectLinkedIn = useDisconnectLinkedIn();

  // Handle OAuth callback params
  useEffect(() => {
    const linkedinConnected = searchParams.get("linkedin_connected");
    const linkedinError = searchParams.get("linkedin_error");

    if (linkedinConnected === "true") {
      refetch();
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("linkedin_connected");
      url.searchParams.delete("linkedin_email");
      url.searchParams.delete("linkedin_name");
      window.history.replaceState({}, "", url.toString());
    }

    if (linkedinError) {
      console.error("LinkedIn connection error:", linkedinError);
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("linkedin_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, refetch]);

  const handleConnect = () => {
    window.location.href = usersApi.getLinkedInConnectUrl(userId);
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect your LinkedIn account?")) {
      try {
        await disconnectLinkedIn.mutateAsync(userId);
      } catch (error) {
        console.error("Failed to disconnect LinkedIn:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5" />
          LinkedIn Connection
        </CardTitle>
        <CardDescription>
          Connect LinkedIn to apply to jobs directly from your authenticated session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Connected</p>
                  {status.name && (
                    <p className="text-sm text-muted-foreground">{status.name}</p>
                  )}
                  {status.email && (
                    <p className="text-xs text-muted-foreground">{status.email}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Active
              </Badge>
            </div>

            {status.connected_at && (
              <p className="text-sm text-muted-foreground">
                Connected: {new Date(status.connected_at).toLocaleString()}
              </p>
            )}

            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> LinkedIn jobs in your pipeline will now be attempted
                using your connected session. Due to API limitations, some jobs may still
                require manual intervention.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnectLinkedIn.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {disconnectLinkedIn.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Disconnect LinkedIn
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Not Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to apply to LinkedIn jobs automatically
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleConnect} className="w-full sm:w-auto">
              <Linkedin className="mr-2 h-4 w-4" />
              Connect LinkedIn
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>

            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to LinkedIn to authorize the connection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading fallback for Suspense
function LinkedInConnectionFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5" />
          LinkedIn Connection
        </CardTitle>
        <CardDescription>
          Connect LinkedIn to apply to jobs directly from your authenticated session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Export wrapped in Suspense to handle useSearchParams
export function LinkedInConnection({ userId }: LinkedInConnectionProps) {
  return (
    <Suspense fallback={<LinkedInConnectionFallback />}>
      <LinkedInConnectionContent userId={userId} />
    </Suspense>
  );
}
