"use client";

import { Suspense, useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, XCircle, Loader2, ExternalLink, Tag, MailCheck, Plus } from "lucide-react";

interface GmailConnectionProps {
  userId: string;
}

function GmailConnectionContent({ userId }: GmailConnectionProps) {
  const searchParams = useSearchParams();
  const { data: status, isLoading, refetch } = useGmailStatus(userId);
  const disconnectGmail = useDisconnectGmail();

  // Optional permissions state
  const [wantLabels, setWantLabels] = useState(false);
  const [wantModify, setWantModify] = useState(false);
  const [showAddPermissions, setShowAddPermissions] = useState(false);

  // Check if there are permissions that can still be added
  const canAddMorePermissions = status?.connected && (!status.can_manage_labels || !status.can_modify);

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
    // Redirect to Gmail OAuth with selected permissions
    window.location.href = usersApi.getGmailConnectUrl(userId, {
      labels: wantLabels,
      modify: wantModify,
    });
  };

  const handleAddPermissions = () => {
    // Request additional permissions (Google will merge with existing)
    window.location.href = usersApi.getGmailConnectUrl(userId, {
      labels: wantLabels || status?.can_manage_labels,
      modify: wantModify || status?.can_modify,
    });
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

            {/* Show granted permissions */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Permissions:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-green-700">
                  <MailCheck className="mr-1 h-3 w-3" />
                  Read emails
                </Badge>
                {status.can_manage_labels && (
                  <Badge variant="outline" className="text-blue-700">
                    <Tag className="mr-1 h-3 w-3" />
                    Manage labels
                  </Badge>
                )}
                {status.can_modify && (
                  <Badge variant="outline" className="text-purple-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Mark as read
                  </Badge>
                )}
              </div>
            </div>

            {status.last_sync_at && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(status.last_sync_at).toLocaleString()}
              </p>
            )}

            {/* Add more permissions section */}
            {canAddMorePermissions && (
              <div className="space-y-3">
                {!showAddPermissions ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddPermissions(true)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add more permissions
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">Request additional permissions:</p>

                    {!status.can_manage_labels && (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="add-labels"
                          checked={wantLabels}
                          onCheckedChange={(checked) => setWantLabels(checked === true)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="add-labels" className="text-sm font-medium">
                            Manage labels
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Create and apply labels to organize job emails
                          </p>
                        </div>
                      </div>
                    )}

                    {!status.can_modify && (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="add-modify"
                          checked={wantModify}
                          onCheckedChange={(checked) => setWantModify(checked === true)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="add-modify" className="text-sm font-medium">
                            Mark as read
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically mark processed job alerts as read
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleAddPermissions}
                        disabled={!wantLabels && !wantModify}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Request permissions
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddPermissions(false);
                          setWantLabels(false);
                          setWantModify(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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

            {/* Permission selection */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Choose permissions:</p>

              <div className="flex items-start space-x-3">
                <Checkbox id="read-emails" checked disabled />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="read-emails" className="text-sm font-medium">
                    Read emails (required)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Scan your inbox for job alert emails
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="manage-labels"
                  checked={wantLabels}
                  onCheckedChange={(checked) => setWantLabels(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="manage-labels" className="text-sm font-medium">
                    Manage labels (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Create and apply labels to organize job emails
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="mark-read"
                  checked={wantModify}
                  onCheckedChange={(checked) => setWantModify(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="mark-read" className="text-sm font-medium">
                    Mark as read (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically mark processed job alerts as read
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
              You can change these permissions later by reconnecting.
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
