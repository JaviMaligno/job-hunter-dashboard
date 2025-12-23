"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStartApplication } from "@/lib/hooks/useApplications";
import { ApplicationMode } from "@/types/application";
import { useRouter } from "next/navigation";
import { X, PlayCircle, PauseCircle, Zap } from "lucide-react";

interface ApplicationModeSelectorProps {
  jobId: string;
  jobUrl: string;
  userId: string;
  onClose: () => void;
}

export function ApplicationModeSelector({
  jobId,
  jobUrl,
  userId,
  onClose,
}: ApplicationModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ApplicationMode | null>(
    null
  );
  const startApplication = useStartApplication(userId);
  const router = useRouter();

  const modes = [
    {
      mode: ApplicationMode.ASSISTED,
      icon: PlayCircle,
      title: "Assisted Mode",
      description: "You review and approve each step",
      features: [
        "AI fills out the form",
        "You review before submission",
        "Manual control over submission",
        "No rate limits",
      ],
      color: "blue",
    },
    {
      mode: ApplicationMode.SEMI_AUTO,
      icon: PauseCircle,
      title: "Semi-Auto Mode",
      description: "Pauses on blockers, auto-submits otherwise",
      features: [
        "AI fills and submits automatically",
        "Pauses on CAPTCHA or complex forms",
        "10 applications per day limit",
        "Best for most jobs",
      ],
      color: "green",
    },
    {
      mode: ApplicationMode.AUTO,
      icon: Zap,
      title: "Full Auto Mode",
      description: "Fully automated application",
      features: [
        "Completely automated",
        "Skips jobs with blockers",
        "5 applications per day limit",
        "Use with caution",
      ],
      color: "orange",
    },
  ];

  const handleStart = async () => {
    if (!selectedMode) return;

    try {
      const result = await startApplication.mutateAsync({
        request: {
          job_url: jobUrl,
          mode: selectedMode,
        },
        jobId,
      });

      // Navigate to application tracking page
      router.push(`/applications/${result.session_id}`);
    } catch (error: any) {
      console.error("Failed to start application:", error);
      // TODO: Show error toast
    }
  };

  const getBorderColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "border-blue-500",
      green: "border-green-500",
      orange: "border-orange-500",
    };
    return colors[color] || "border-gray-500";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Choose Application Mode</CardTitle>
            <CardDescription>
              Select how you want to apply to this job
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modes.map((modeOption) => {
              const Icon = modeOption.icon;
              const isSelected = selectedMode === modeOption.mode;

              return (
                <button
                  key={modeOption.mode}
                  onClick={() => setSelectedMode(modeOption.mode)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${getBorderColor(modeOption.color)} bg-muted`
                      : "border-muted hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Icon className={`h-6 w-6 text-${modeOption.color}-600`} />
                    <div className="flex-1">
                      <h3 className="font-semibold">{modeOption.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {modeOption.description}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1">
                    {modeOption.features.map((feature, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={!selectedMode || startApplication.isPending}
            >
              {startApplication.isPending
                ? "Starting..."
                : "Start Application"}
            </Button>
          </div>

          {/* Error Message */}
          {startApplication.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {startApplication.error?.message ||
                "Failed to start application"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
