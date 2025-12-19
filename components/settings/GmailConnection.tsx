"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGmailStatus, useDisconnectGmail } from "@/lib/hooks/useUser";
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
import { Mail, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";

interface GmailConnectionProps {
  userId: string;
}

function GmailConnectionContent({ userId }: GmailConnectionProps) {
  const searchParams = useSearchParams();
  const { data: status, isLoading, refetch } = useGmailStatus(userId);
  const disconnectGmail = useDisconnectGmail();

  // Handle OAuth callback params
  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");
    const gmailError = searchParams.get("gmail_error");

    if (gmailConnected === "true") {
      refetch();
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      url.searchParams.delete("gmail_email");
      window.history.replaceState({}, "", url.toString());
    }

    if (gmailError) {
      console.error("Gmail connection error:", gmailError);
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, refetch]);

  const handleConnect = () => {
    // Redirect to Gmail OAuth
    window.location.href = usersApi.getGmailConnectUrl(userId);
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect your Gmail account?")) {
      try {
        await disconnectGmail.mutateAsync(userId);
      } catch (error) {
        console.error("Failed to disconnect Gmail:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription>
          Connect your Gmail to automatically import job alert emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Connected</p>
                  {status.email && (
                    <p className="text-sm text-muted-foreground">{status.email}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>

            {status.last_sync_at && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(status.last_sync_at).toLocaleString()}
              </p>
            )}

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnectGmail.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {disconnectGmail.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Disconnect Gmail
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
                    Connect your Gmail to scan for job alerts
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleConnect} className="w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" />
              Connect Gmail
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>

            <p className="text-xs text-muted-foreground">
              We only request read-only access to scan for job alert emails.
              We never send emails on your behalf.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading fallback for Suspense
function GmailConnectionFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription>
          Connect your Gmail to automatically import job alert emails
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
export function GmailConnection({ userId }: GmailConnectionProps) {
  return (
    <Suspense fallback={<GmailConnectionFallback />}>
      <GmailConnectionContent userId={userId} />
    </Suspense>
  );
}
