import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Job, JobBlockerType } from "@/types/job";
import { AlertCircle, MapPin, Building2, Zap, Wifi, Home } from "lucide-react";

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const getMatchScoreColor = (score?: number) => {
    if (!score) return "bg-gray-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getBlockerLabel = (type: JobBlockerType) => {
    const labels: Record<JobBlockerType, string> = {
      captcha: "CAPTCHA",
      login_required: "Login Required",
      form_too_complex: "Complex Form",
      unsupported_ats: "Unsupported ATS",
      other: "Blocked",
    };
    return labels[type] || "Blocked";
  };

  const getRemoteTypeBadge = () => {
    if (!job.remote_type) return null;
    const config = {
      remote: { color: "bg-green-500", icon: Wifi, label: "Remote" },
      hybrid: { color: "bg-blue-500", icon: Home, label: "Hybrid" },
      onsite: { color: "bg-gray-500", icon: Building2, label: "Onsite" },
    };
    const { color, icon: Icon, label } = config[job.remote_type];
    return (
      <Badge className={`${color} text-white text-[10px] px-1.5 py-0 h-5`}>
        <Icon className="h-2.5 w-2.5 mr-0.5" />
        {label}
      </Badge>
    );
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2">{job.title}</h3>

          {/* Company */}
          {job.company && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{job.company}</span>
            </div>
          )}

          {/* Location */}
          {job.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.location}</span>
            </div>
          )}

          {/* Remote Type & Easy Apply Badges */}
          {(job.remote_type || job.easy_apply) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {getRemoteTypeBadge()}
              {job.easy_apply && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-5">
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  Easy
                </Badge>
              )}
            </div>
          )}

          {/* Footer: Match Score & Blocker */}
          <div className="flex items-center justify-between pt-2">
            {/* Match Score */}
            {job.match_score !== undefined && job.match_score !== null && (
              <Badge
                className={`${getMatchScoreColor(job.match_score)} text-white`}
              >
                {job.match_score}% match
              </Badge>
            )}

            {/* Blocker Indicator */}
            {job.blocker_type && (job.blocker_type as string) !== "none" && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertCircle className="h-3 w-3" />
                <span>{getBlockerLabel(job.blocker_type)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
