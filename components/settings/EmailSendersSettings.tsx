"use client";

import { useState } from "react";
import { useEmailSenders, useUpdateEmailSenders } from "@/lib/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Mail, Building2, Globe, Loader2 } from "lucide-react";
import type { EmailSender } from "@/types/user";

interface EmailSendersSettingsProps {
  userId: string;
}

export function EmailSendersSettings({ userId }: EmailSendersSettingsProps) {
  const { data, isLoading } = useEmailSenders(userId);
  const updateEmailSenders = useUpdateEmailSenders();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSender, setNewSender] = useState({ name: "", pattern: "" });

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Alert Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const { default_senders, user_preferences, effective_senders } = data;

  const isSenderEnabled = (sender: EmailSender): boolean => {
    const disabledIds = user_preferences.disabled_sender_ids || [];
    const enabledIds = user_preferences.enabled_sender_ids || [];

    if (disabledIds.includes(sender.id)) return false;
    if (enabledIds.includes(sender.id)) return true;
    return sender.enabled;
  };

  const handleToggleSender = async (sender: EmailSender) => {
    const isCurrentlyEnabled = isSenderEnabled(sender);

    await updateEmailSenders.mutateAsync({
      userId,
      updates: isCurrentlyEnabled
        ? { disabled_sender_ids: [sender.id] }
        : { enabled_sender_ids: [sender.id] },
    });
  };

  const handleAddCustomSender = async () => {
    if (!newSender.name || !newSender.pattern) return;

    const customId = `custom-${Date.now()}`;

    await updateEmailSenders.mutateAsync({
      userId,
      updates: {
        custom_senders: [
          {
            id: customId,
            name: newSender.name,
            pattern: newSender.pattern,
            enabled: true,
          },
        ],
      },
    });

    setNewSender({ name: "", pattern: "" });
    setIsAddDialogOpen(false);
  };

  const handleRemoveCustomSender = async (senderId: string) => {
    await updateEmailSenders.mutateAsync({
      userId,
      updates: {
        remove_sender_ids: [senderId],
      },
    });
  };

  // Group senders by category
  const majorPlatforms = default_senders.filter((s) =>
    ["linkedin", "indeed", "glassdoor", "infojobs"].includes(s.id)
  );
  const specializedPlatforms = default_senders.filter((s) =>
    ["jackandjill", "cord", "angellist", "wellfound", "remoteco", "otta"].includes(s.id)
  );
  const atsPlatforms = default_senders.filter((s) =>
    ["greenhouse", "lever", "workable", "bamboohr", "ashby", "smartrecruiters"].includes(s.id)
  );
  const regionalPlatforms = default_senders.filter((s) =>
    ["totaljobs", "reed", "monster", "ziprecruiter", "dice"].includes(s.id)
  );
  const customSenders =
    user_preferences.senders?.filter((s) => s.is_custom) || [];

  const renderSenderToggle = (sender: EmailSender, showDelete = false) => (
    <div
      key={sender.id}
      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{sender.name}</p>
          <p className="text-xs text-muted-foreground">{sender.pattern}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveCustomSender(sender.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
        <Switch
          checked={isSenderEnabled(sender)}
          onCheckedChange={() => handleToggleSender(sender)}
          disabled={updateEmailSenders.isPending}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Alert Sources
        </CardTitle>
        <CardDescription>
          Choose which job platforms&apos; emails to monitor.{" "}
          {effective_senders.length} source
          {effective_senders.length !== 1 ? "s" : ""} active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Major Platforms */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Major Job Platforms
          </h4>
          <div className="space-y-1">
            {majorPlatforms.map((sender) => renderSenderToggle(sender))}
          </div>
        </div>

        {/* Specialized Platforms */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Specialized Platforms
          </h4>
          <div className="space-y-1">
            {specializedPlatforms.map((sender) => renderSenderToggle(sender))}
          </div>
        </div>

        {/* ATS Platforms */}
        <div>
          <h4 className="text-sm font-semibold mb-2">ATS Platforms</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Direct company applications via applicant tracking systems
          </p>
          <div className="space-y-1">
            {atsPlatforms.map((sender) => renderSenderToggle(sender))}
          </div>
        </div>

        {/* Regional Platforms */}
        {regionalPlatforms.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Regional Platforms</h4>
            <div className="space-y-1">
              {regionalPlatforms.map((sender) => renderSenderToggle(sender))}
            </div>
          </div>
        )}

        {/* Custom Senders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Custom Sources</h4>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Email Source</DialogTitle>
                  <DialogDescription>
                    Add a custom email sender pattern to monitor for job alerts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender-name">Name</Label>
                    <Input
                      id="sender-name"
                      placeholder="e.g., My Company"
                      value={newSender.name}
                      onChange={(e) =>
                        setNewSender((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-pattern">Email Pattern</Label>
                    <Input
                      id="sender-pattern"
                      placeholder="e.g., company.com or noreply@company.com"
                      value={newSender.pattern}
                      onChange={(e) =>
                        setNewSender((prev) => ({
                          ...prev,
                          pattern: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a domain (company.com) or specific email address
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCustomSender}
                    disabled={!newSender.name || !newSender.pattern}
                  >
                    Add Source
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {customSenders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No custom sources added yet
            </p>
          ) : (
            <div className="space-y-1">
              {customSenders.map((sender) => renderSenderToggle(sender, true))}
            </div>
          )}
        </div>

        {/* Active Sources Summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Active Sources</h4>
          <div className="flex flex-wrap gap-2">
            {effective_senders.map((sender) => (
              <Badge key={sender.id} variant="secondary">
                {sender.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
