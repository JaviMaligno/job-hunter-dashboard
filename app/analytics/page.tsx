"use client";

import { useRouter } from "next/navigation";
import { useJobs } from "@/lib/hooks/useJobs";
import { useRateLimit } from "@/lib/hooks/useApplications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, AlertCircle, CheckCircle } from "lucide-react";
import { JobStatus, JobBlockerType } from "@/types/job";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// TODO: Replace with actual user ID from auth
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

const COLORS = {
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#eab308",
  red: "#ef4444",
  purple: "#a855f7",
  orange: "#f97316",
  gray: "#6b7280",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: jobsData } = useJobs(TEMP_USER_ID);
  const { data: rateLimit } = useRateLimit(TEMP_USER_ID);

  const jobs = jobsData?.jobs || [];

  // Calculate metrics
  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter((j) => j.status === JobStatus.APPLIED).length;
  const blockedJobs = jobs.filter((j) => j.status === JobStatus.BLOCKED).length;
  const averageMatchScore =
    jobs.reduce((sum, j) => sum + (j.match_score || 0), 0) / (jobs.length || 1);

  // Status breakdown
  const statusData = [
    { name: "Inbox", value: jobs.filter((j) => j.status === JobStatus.INBOX).length, color: COLORS.gray },
    { name: "Interesting", value: jobs.filter((j) => j.status === JobStatus.INTERESTING).length, color: COLORS.yellow },
    { name: "Adapted", value: jobs.filter((j) => j.status === JobStatus.ADAPTED).length, color: COLORS.blue },
    { name: "Ready", value: jobs.filter((j) => j.status === JobStatus.READY).length, color: COLORS.green },
    { name: "Applied", value: appliedJobs, color: COLORS.purple },
    { name: "Blocked", value: blockedJobs, color: COLORS.orange },
    { name: "Rejected", value: jobs.filter((j) => j.status === JobStatus.REJECTED).length, color: COLORS.red },
  ].filter((item) => item.value > 0);

  // Blocker breakdown
  const blockerData = Object.values(JobBlockerType).map((type) => ({
    name: type.replace(/_/g, " "),
    count: jobs.filter((j) => j.blocker_type === type).length,
  })).filter((item) => item.count > 0);

  // Match score distribution
  const matchScoreRanges = [
    { range: "0-20%", count: jobs.filter((j) => j.match_score && j.match_score < 20).length },
    { range: "20-40%", count: jobs.filter((j) => j.match_score && j.match_score >= 20 && j.match_score < 40).length },
    { range: "40-60%", count: jobs.filter((j) => j.match_score && j.match_score >= 40 && j.match_score < 60).length },
    { range: "60-80%", count: jobs.filter((j) => j.match_score && j.match_score >= 60 && j.match_score < 80).length },
    { range: "80-100%", count: jobs.filter((j) => j.match_score && j.match_score >= 80).length },
  ].filter((item) => item.count > 0);

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your job hunting progress and metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              In your pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appliedJobs}</div>
            <p className="text-xs text-muted-foreground">
              {totalJobs > 0 ? `${Math.round((appliedJobs / totalJobs) * 100)}% of total` : "0% of total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageMatchScore)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blocked Jobs</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Need manual attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Status */}
      {rateLimit && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily Application Limits</CardTitle>
            <CardDescription>
              Track your automated application usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Total Automated</span>
                  <span className="text-sm font-medium">
                    {rateLimit.total_today} / {rateLimit.total_limit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((rateLimit.total_today / rateLimit.total_limit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Full Auto</span>
                  <span className="text-sm font-medium">
                    {rateLimit.auto_today} / {rateLimit.auto_limit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((rateLimit.auto_today / rateLimit.auto_limit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Distribution across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Match Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Match Score Distribution</CardTitle>
            <CardDescription>How well jobs match your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={matchScoreRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.blue} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Blocker Breakdown */}
        {blockerData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Blocker Types</CardTitle>
              <CardDescription>Common obstacles in applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={blockerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.orange} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
