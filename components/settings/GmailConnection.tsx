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
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, XCircle, Loader2, ExternalLink, Tag, MailCheck, Settings2, Search, FileText } from "lucide-react";
import type { EmailScanResponse } from "@/lib/api/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GmailConnectionProps {
  userId: string;
}

function GmailConnectionContent({ userId }: GmailConnectionProps) {
  const searchParams = useSearchParams();
  const { data: status, isLoading, refetch } = useGmailStatus(userId);
  const disconnectGmail = useDisconnectGmail();

  // Permission management state
  const [wantLabels, setWantLabels] = useState(false);
  const [wantModify, setWantModify] = useState(false);
  const [showManagePermissions, setShowManagePermissions] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [pendingPermissions, setPendingPermissions] = useState<{ labels: boolean; modify: boolean } | null>(null);

  // Email scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<EmailScanResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Process email by ID state
  const [messageId, setMessageId] = useState("");
  const [isProcessingById, setIsProcessingById] = useState(false);
  const [processResult, setProcessResult] = useState<any | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  // Initialize permission state from current status
  useEffect(() => {
    if (status?.connected) {
      setWantLabels(status.can_manage_labels);
      setWantModify(status.can_modify);
    }
  }, [status?.connected, status?.can_manage_labels, status?.can_modify]);

  // Check if permissions have changed
  const hasPermissionChanges = status?.connected && (
    wantLabels !== status.can_manage_labels ||
    wantModify !== status.can_modify
  );

  // Check if we're removing permissions (requires re-auth)
  const isRemovingPermissions = status?.connected && (
    (!wantLabels && status.can_manage_labels) ||
    (!wantModify && status.can_modify)
  );

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

  const handleUpdatePermissions = () => {
    if (isRemovingPermissions) {
      // Show confirmation dialog for removing permissions
      setPendingPermissions({ labels: wantLabels, modify: wantModify });
      setShowReauthDialog(true);
    } else {
      // Just adding permissions - redirect directly
      window.location.href = usersApi.getGmailConnectUrl(userId, {
        labels: wantLabels,
        modify: wantModify,
      });
    }
  };

  const handleConfirmReauth = async () => {
    if (!pendingPermissions) return;

    // Disconnect first, then reconnect with new permissions
    try {
      await disconnectGmail.mutateAsync(userId);
      // Redirect to OAuth with new permissions
      window.location.href = usersApi.getGmailConnectUrl(userId, {
        labels: pendingPermissions.labels,
        modify: pendingPermissions.modify,
      });
    } catch (error) {
      console.error("Failed to update permissions:", error);
      setShowReauthDialog(false);
      setPendingPermissions(null);
    }
  };

  const handleCancelManage = () => {
    // Reset to current permissions
    if (status) {
      setWantLabels(status.can_manage_labels);
      setWantModify(status.can_modify);
    }
    setShowManagePermissions(false);
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

  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const result = await usersApi.scanEmails(userId, { max_emails: 20 });
      setScanResult(result);
      refetch(); // Refresh status to get updated last_sync_at
    } catch (error) {
      console.error("Failed to scan emails:", error);
      setScanError(error instanceof Error ? error.message : "Failed to scan emails");
    } finally {
      setIsScanning(false);
    }
  };

  const handleProcessById = async () => {
    if (!messageId.trim()) return;

    setIsProcessingById(true);
    setProcessResult(null);
    setProcessError(null);
    try {
      const result = await usersApi.processEmailById(userId, messageId.trim());
      setProcessResult(result);
      setMessageId(""); // Clear input on success
      refetch(); // Refresh status
    } catch (error) {
      console.error("Failed to process email:", error);
      setProcessError(error instanceof Error ? error.message : "Failed to process email");
    } finally {
      setIsProcessingById(false);
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

            {/* Scan emails button */}
            <div className="space-y-3">
              <Button
                onClick={handleScan}
                disabled={isScanning}
                variant="secondary"
              >
                {isScanning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {isScanning ? "Scanning..." : "Scan Emails for Jobs"}
              </Button>

              {/* Scan results */}
              {scanResult && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 space-y-3">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Scan Complete
                  </p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-blue-900 rounded">
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {scanResult.emails_scanned}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Emails</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-blue-900 rounded">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {scanResult.jobs_extracted}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">New Jobs</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-blue-900 rounded">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {scanResult.jobs_skipped_duplicates}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Duplicates</p>
                    </div>
                  </div>

                  {/* Info message about duplicates */}
                  {scanResult.jobs_skipped_duplicates > 0 && scanResult.jobs_extracted === 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                      All jobs from these emails are already in your list. Check your Kanban board!
                    </p>
                  )}

                  {scanResult.emails.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Recent emails:</p>
                      {scanResult.emails.slice(0, 5).map((email) => (
                        <p key={email.message_id} className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          {email.sender}: {email.subject}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scan error */}
              {scanError && (
                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-red-700 dark:text-red-300">{scanError}</p>
                </div>
              )}
            </div>

            {/* Process email by ID section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1.5">
                <Label htmlFor="message-id" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Process Email by ID
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enter Gmail message ID (found in URL after #inbox/)
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  id="message-id"
                  type="text"
                  placeholder="e.g., 18d1234567890abc"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleProcessById}
                  disabled={isProcessingById || !messageId.trim()}
                  variant="secondary"
                >
                  {isProcessingById ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Process"
                  )}
                </Button>
              </div>

              {/* Process result */}
              {processResult && (
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Email processed successfully!
                    {processResult.jobs_extracted !== undefined && (
                      <span className="ml-1">
                        {processResult.jobs_extracted} job(s) extracted.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Process error */}
              {processError && (
                <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-red-700 dark:text-red-300">{processError}</p>
                </div>
              )}
            </div>

            {/* Manage permissions section */}
            <div className="space-y-3">
              {!showManagePermissions ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManagePermissions(true)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto"
                >
                  <Settings2 className="mr-1 h-3 w-3" />
                  Manage permissions
                </Button>
              ) : (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">Manage Gmail permissions:</p>

                  {/* Read emails - always required */}
                  <div className="flex items-start space-x-3 opacity-60">
                    <Checkbox id="manage-read" checked disabled />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="manage-read" className="text-sm font-medium">
                        Read emails (required)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Scan your inbox for job alert emails
                      </p>
                    </div>
                  </div>

                  {/* Manage labels */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="manage-labels"
                      checked={wantLabels}
                      onCheckedChange={(checked) => setWantLabels(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="manage-labels" className="text-sm font-medium">
                        Manage labels
                        {status.can_manage_labels && !wantLabels && (
                          <span className="ml-2 text-xs text-orange-600">(will be removed)</span>
                        )}
                        {!status.can_manage_labels && wantLabels && (
                          <span className="ml-2 text-xs text-green-600">(will be added)</span>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Create and apply labels to organize job emails
                      </p>
                    </div>
                  </div>

                  {/* Mark as read */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="manage-modify"
                      checked={wantModify}
                      onCheckedChange={(checked) => setWantModify(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="manage-modify" className="text-sm font-medium">
                        Mark as read
                        {status.can_modify && !wantModify && (
                          <span className="ml-2 text-xs text-orange-600">(will be removed)</span>
                        )}
                        {!status.can_modify && wantModify && (
                          <span className="ml-2 text-xs text-green-600">(will be added)</span>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically mark processed job alerts as read
                      </p>
                    </div>
                  </div>

                  {/* Warning when removing permissions */}
                  {isRemovingPermissions && (
                    <p className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
                      Removing permissions requires re-authentication with Google.
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleUpdatePermissions}
                      disabled={!hasPermissionChanges}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      {isRemovingPermissions ? "Update & Re-authenticate" : "Update permissions"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelManage}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
              You can manage these permissions after connecting.
            </p>
          </div>
        )}
      </CardContent>

      {/* Re-authentication confirmation dialog */}
      <AlertDialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              Removing Gmail permissions requires disconnecting and reconnecting your account.
              You will be redirected to Google to re-authorize with the new permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowReauthDialog(false);
              setPendingPermissions(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReauth}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
