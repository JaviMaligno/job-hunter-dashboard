"use client";

import { useState } from "react";
import { useLocalApplicationFlow } from "@/lib/hooks/useExtension";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Chrome,
  Play,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocalApplicationFlowProps {
  jobUrl: string;
  jobTitle: string;
  company: string;
  userId: string;
  cvContent?: string;
  coverLetter?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

type StepStatus = "pending" | "active" | "completed" | "error";

interface Step {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

export function LocalApplicationFlow({
  jobUrl,
  jobTitle,
  company,
  userId,
  cvContent,
  coverLetter,
  onComplete,
  onCancel,
}: LocalApplicationFlowProps) {
  const flow = useLocalApplicationFlow(jobUrl, userId);

  // Map flow state to step statuses
  const getSteps = (): Step[] => {
    const stepMap: Record<string, Step[]> = {
      idle: [
        {
          id: "connect",
          label: "Extension Connected",
          description: "Chrome extension is ready",
          status: flow.isExtensionConnected ? "completed" : "pending",
        },
        {
          id: "open",
          label: "Open Application",
          description: "Open job page in your browser",
          status: "pending",
        },
        {
          id: "analyze",
          label: "Analyze Form",
          description: "Identify form fields",
          status: "pending",
        },
        {
          id: "fill",
          label: "Fill Form",
          description: "Auto-fill with your information",
          status: "pending",
        },
      ],
      opening: [
        {
          id: "connect",
          label: "Extension Connected",
          description: "Chrome extension is ready",
          status: "completed",
        },
        {
          id: "open",
          label: "Opening Page",
          description: "Opening job page in your browser...",
          status: "active",
        },
        {
          id: "analyze",
          label: "Analyze Form",
          description: "Identify form fields",
          status: "pending",
        },
        {
          id: "fill",
          label: "Fill Form",
          description: "Auto-fill with your information",
          status: "pending",
        },
      ],
      analyzing: [
        {
          id: "connect",
          label: "Extension Connected",
          description: "Chrome extension is ready",
          status: "completed",
        },
        {
          id: "open",
          label: "Page Opened",
          description: "Job page is open",
          status: "completed",
        },
        {
          id: "analyze",
          label: "Analyzing Form",
          description: "Identifying form fields...",
          status: "active",
        },
        {
          id: "fill",
          label: "Fill Form",
          description: "Auto-fill with your information",
          status: "pending",
        },
      ],
      ready: [
        {
          id: "connect",
          label: "Extension Connected",
          description: "Chrome extension is ready",
          status: "completed",
        },
        {
          id: "open",
          label: "Page Opened",
          description: "Job page is open",
          status: "completed",
        },
        {
          id: "analyze",
          label: "Form Analyzed",
          description: `Found ${flow.formFields.length} fields`,
          status: "completed",
        },
        {
          id: "fill",
          label: "Ready to Fill",
          description: `${flow.fillInstructions.length} fields can be auto-filled`,
          status: "active",
        },
      ],
      filling: [
        {
          id: "connect",
          label: "Extension Connected",
          description: "Chrome extension is ready",
          status: "completed",
        },
        {
          id: "open",
          label: "Page Opened",
          description: "Job page is open",
          status: "completed",
        },
        {
          id: "analyze",
          label: "Form Analyzed",
          description: `Found ${flow.formFields.length} fields`,
          status: "completed",
        },
        {
          id: "fill",
          label: "Filling Form",
          description: `Filling ${flow.filledCount}/${flow.totalFields} fields...`,
          status: "active",
        },
      ],
      completed: [
        {
          id: "connect",
          label: "Extension Connected",
          description: "Chrome extension is ready",
          status: "completed",
        },
        {
          id: "open",
          label: "Page Opened",
          description: "Job page is open",
          status: "completed",
        },
        {
          id: "analyze",
          label: "Form Analyzed",
          description: `Found ${flow.formFields.length} fields`,
          status: "completed",
        },
        {
          id: "fill",
          label: "Form Filled",
          description: `Filled ${flow.filledCount}/${flow.totalFields} fields`,
          status: "completed",
        },
      ],
      error: [
        {
          id: "connect",
          label: "Extension Connected",
          description: flow.isExtensionConnected
            ? "Chrome extension is ready"
            : "Extension not connected",
          status: flow.isExtensionConnected ? "completed" : "error",
        },
        {
          id: "open",
          label: "Open Application",
          description: flow.error || "An error occurred",
          status: "error",
        },
        {
          id: "analyze",
          label: "Analyze Form",
          description: "Identify form fields",
          status: "pending",
        },
        {
          id: "fill",
          label: "Fill Form",
          description: "Auto-fill with your information",
          status: "pending",
        },
      ],
    };

    return stepMap[flow.step] || stepMap.idle;
  };

  const steps = getSteps();
  const progress =
    (steps.filter((s) => s.status === "completed").length / steps.length) * 100;

  const handleStart = () => {
    flow.start(cvContent, coverLetter);
  };

  const handleFill = () => {
    flow.executeFills();
  };

  const handleReset = () => {
    flow.reset();
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Chrome className="h-5 w-5" />
              Local Browser Mode
            </CardTitle>
            <CardDescription className="mt-1">
              Apply in your browser with AI assistance
            </CardDescription>
          </div>
          {flow.isExtensionConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Extension Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              Extension Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Job Info */}
        <div className="rounded-lg bg-muted p-3">
          <p className="font-medium text-sm">{jobTitle}</p>
          <p className="text-muted-foreground text-sm">{company}</p>
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            View job posting <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : step.status === "active" ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : step.status === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    step.status === "pending" && "text-muted-foreground",
                    step.status === "error" && "text-red-600"
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    step.status === "error"
                      ? "text-red-500"
                      : "text-muted-foreground"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fill Instructions Preview */}
        {flow.step === "ready" && flow.fillInstructions.length > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="font-medium text-sm">Fields to fill:</p>
            <div className="space-y-1">
              {flow.fillInstructions.slice(0, 5).map((inst, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>{inst.field_name || inst.selector}</span>
                  <span className="truncate max-w-[150px]">{inst.value}</span>
                </div>
              ))}
              {flow.fillInstructions.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{flow.fillInstructions.length - 5} more fields
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {flow.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{flow.error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={flow.step === "completed" || flow.step === "error" ? handleReset : onCancel}
        >
          {flow.step === "completed" || flow.step === "error" ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </>
          ) : (
            "Cancel"
          )}
        </Button>

        {flow.step === "idle" && (
          <Button
            onClick={handleStart}
            disabled={!flow.isExtensionConnected}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Application
          </Button>
        )}

        {flow.step === "ready" && (
          <Button onClick={handleFill}>
            <Play className="h-4 w-4 mr-2" />
            Fill Form ({flow.fillInstructions.length} fields)
          </Button>
        )}

        {flow.step === "completed" && (
          <Button onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Done
          </Button>
        )}

        {(flow.step === "opening" ||
          flow.step === "analyzing" ||
          flow.step === "filling") && (
          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {flow.step === "filling" ? "Filling..." : "Processing..."}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
