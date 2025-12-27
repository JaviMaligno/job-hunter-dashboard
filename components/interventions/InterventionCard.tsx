"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldAlert,
  LogIn,
  Upload,
  HelpCircle,
  FileQuestion,
  Eye,
  ChevronDown,
  ChevronUp,
  ListChecks,
  ListTodo,
} from "lucide-react";
import type { Intervention, InterventionType } from "@/types/intervention";
import { interventionsApi } from "@/lib/api/interventions";

interface InterventionCardProps {
  intervention: Intervention;
  onResolved?: () => void;
}

const typeConfig: Record<
  InterventionType,
  { icon: typeof AlertCircle; label: string; color: string }
> = {
  captcha: { icon: ShieldAlert, label: "CAPTCHA", color: "bg-orange-500" },
  login_required: { icon: LogIn, label: "Login Required", color: "bg-blue-500" },
  file_upload: { icon: Upload, label: "File Upload", color: "bg-purple-500" },
  custom_question: { icon: HelpCircle, label: "Custom Question", color: "bg-cyan-500" },
  multi_step_form: { icon: FileQuestion, label: "Multi-Step Form", color: "bg-indigo-500" },
  review_before_submit: { icon: Eye, label: "Review Required", color: "bg-green-500" },
  error: { icon: AlertCircle, label: "Error", color: "bg-red-500" },
  other: { icon: AlertCircle, label: "Attention Needed", color: "bg-gray-500" },
};

export function InterventionCard({ intervention, onResolved }: InterventionCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const config = typeConfig[intervention.intervention_type] || typeConfig.other;
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Just now";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const handleResolve = async (action: "continue" | "submit" | "cancel" | "retry") => {
    setIsResolving(true);
    setError(null);

    try {
      await interventionsApi.resolve(intervention.id, { action });
      onResolved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setIsResolving(false);
    }
  };

  const filledCount = intervention.fields_filled
    ? Object.keys(intervention.fields_filled).length
    : 0;
  const remainingCount = intervention.fields_remaining?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{intervention.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDate(intervention.created_at)}</span>
              </div>
            </div>
          </div>
          <Badge className={`${config.color} text-white`}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-2 space-y-2">
        {/* Description - always visible and prominent */}
        {intervention.description && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">{intervention.description}</p>
          </div>
        )}

        {/* Instructions */}
        {intervention.instructions && (
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {intervention.instructions}
            </p>
          </div>
        )}

        {/* Progress summary */}
        {(filledCount > 0 || remainingCount > 0) && (
          <div className="flex gap-3 text-xs">
            {filledCount > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <ListChecks className="h-3 w-3" />
                <span>{filledCount} fields filled</span>
              </div>
            )}
            {remainingCount > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <ListTodo className="h-3 w-3" />
                <span>{remainingCount} remaining</span>
              </div>
            )}
          </div>
        )}

        {/* CAPTCHA info */}
        {intervention.captcha_type && (
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300">
              <ShieldAlert className="h-3 w-3" />
              <span>CAPTCHA: {intervention.captcha_type}</span>
              {intervention.captcha_solve_attempted && (
                <Badge variant="outline" className="ml-2 text-xs py-0">
                  Auto-solve failed
                </Badge>
              )}
            </div>
            {intervention.captcha_solve_error && (
              <p className="text-xs text-orange-600 mt-1">
                {intervention.captcha_solve_error}
              </p>
            )}
          </div>
        )}

        {/* Expandable details */}
        {(intervention.current_url || (filledCount > 0 && showDetails)) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showDetails ? "Hide details" : "Show details"}
          </button>
        )}

        {showDetails && (
          <div className="space-y-2 pt-1 border-t">
            {/* Current URL */}
            {intervention.current_url && (
              <a
                href={intervention.current_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{intervention.current_url}</span>
              </a>
            )}

            {/* Fields filled */}
            {intervention.fields_filled &&
              Object.keys(intervention.fields_filled).length > 0 && (
                <div className="text-xs">
                  <p className="font-medium mb-1">Fields filled:</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {Object.entries(intervention.fields_filled)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <li key={key} className="truncate">
                          {key}: {value}
                        </li>
                      ))}
                    {Object.keys(intervention.fields_filled).length > 5 && (
                      <li className="text-muted-foreground">
                        +{Object.keys(intervention.fields_filled).length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

            {/* Fields remaining */}
            {intervention.fields_remaining &&
              intervention.fields_remaining.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium mb-1">Still needed:</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {intervention.fields_remaining.slice(0, 5).map((field, i) => (
                      <li key={i}>{field}</li>
                    ))}
                    {intervention.fields_remaining.length > 5 && (
                      <li>+{intervention.fields_remaining.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </CardContent>

      <CardFooter className="pt-2 gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => handleResolve("continue")}
          disabled={isResolving}
          className="flex-1"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Done
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResolve("retry")}
          disabled={isResolving}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleResolve("cancel")}
          disabled={isResolving}
          className="text-red-500 hover:text-red-600"
        >
          <XCircle className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
