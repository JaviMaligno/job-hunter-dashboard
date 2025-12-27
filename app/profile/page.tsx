"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUser, useUpdateUser } from "@/lib/hooks/useUser";
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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { CVUpload } from "@/components/settings/CVUpload";
import { EmailSendersSettings } from "@/components/settings/EmailSendersSettings";
import { GmailConnection } from "@/components/settings/GmailConnection";
import { LinkedInConnection } from "@/components/settings/LinkedInConnection";
import type { UserUpdate } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // Get user ID from session
  const userId = session?.user?.id;

  const { data: user, isLoading: isUserLoading } = useUser(userId || "");
  const updateUser = useUpdateUser();

  const [formData, setFormData] = useState<UserUpdate>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user && !isInitialized) {
      setFormData({
        full_name: user.full_name,
        email: user.email || "",
        phone: user.phone,
        address: user.address,
        linkedin_url: user.linkedin_url,
        github_url: user.github_url,
        portfolio_url: user.portfolio_url,
        job_preferences: user.job_preferences,
      });
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Auto-fill email from session if form email is empty
  useEffect(() => {
    if (session?.user?.email && !formData.email && isInitialized) {
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || "",
      }));
    }
  }, [session?.user?.email, formData.email, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("Please sign in to update your profile");
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: userId,
        updates: formData,
      });
      // Show success message
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleChange = (field: keyof UserUpdate, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Show loading state while session or user data is loading
  if (sessionStatus === "loading" || (userId && isUserLoading)) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
          <p className="text-muted-foreground">Please sign in to view your profile</p>
          <Button onClick={() => router.push("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Show error if no user ID in session
  if (!userId) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
          <p className="text-muted-foreground">Unable to load profile. Please sign in again.</p>
          <Button onClick={() => router.push("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and job preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              This information will be used to pre-fill job applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ""}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Links */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Links</CardTitle>
            <CardDescription>
              Add links to your professional profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url || ""}
                onChange={(e) => handleChange("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                value={formData.github_url || ""}
                onChange={(e) => handleChange("github_url", e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input
                id="portfolio_url"
                type="url"
                value={formData.portfolio_url || ""}
                onChange={(e) => handleChange("portfolio_url", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Job Preferences</CardTitle>
            <CardDescription>
              Help us find the right jobs for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="desired_roles">Desired Roles (comma-separated)</Label>
                <Input
                  id="desired_roles"
                  value={formData.job_preferences?.desired_roles?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      job_preferences: {
                        ...prev.job_preferences,
                        desired_roles: e.target.value.split(",").map((r) => r.trim()),
                      },
                    }))
                  }
                  placeholder="Software Engineer, Full Stack Developer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desired_locations">Desired Locations (comma-separated)</Label>
                <Input
                  id="desired_locations"
                  value={formData.job_preferences?.desired_locations?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      job_preferences: {
                        ...prev.job_preferences,
                        desired_locations: e.target.value.split(",").map((l) => l.trim()),
                      },
                    }))
                  }
                  placeholder="San Francisco, Remote"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_salary">Minimum Salary</Label>
                <Input
                  id="min_salary"
                  type="number"
                  value={formData.job_preferences?.min_salary || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      job_preferences: {
                        ...prev.job_preferences,
                        min_salary: parseInt(e.target.value) || undefined,
                      },
                    }))
                  }
                  placeholder="80000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_salary">Maximum Salary</Label>
                <Input
                  id="max_salary"
                  type="number"
                  value={formData.job_preferences?.max_salary || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      job_preferences: {
                        ...prev.job_preferences,
                        max_salary: parseInt(e.target.value) || undefined,
                      },
                    }))
                  }
                  placeholder="150000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Base CV Upload */}
        <CVUpload userId={userId} />

        {/* Gmail Connection */}
        <GmailConnection userId={userId} />

        {/* LinkedIn Connection */}
        <LinkedInConnection userId={userId} />

        {/* Email Alert Sources */}
        <EmailSendersSettings userId={userId} />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateUser.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateUser.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
