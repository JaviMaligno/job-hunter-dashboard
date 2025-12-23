"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Mail, Sparkles, CheckCircle, XCircle, Copy, Download, Upload } from "lucide-react";
import { jobsApi, type CVAdaptResponse } from "@/lib/api/jobs";
import { useUserCV, useUserCVContent } from "@/lib/hooks/useUser";

interface CVAdaptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  jobUrl?: string;
  userId?: string;
}

export function CVAdaptDialog({
  open,
  onOpenChange,
  jobTitle,
  company,
  jobDescription,
  jobUrl,
  userId,
}: CVAdaptDialogProps) {
  const [cvContent, setCvContent] = useState("");
  const [cvSource, setCvSource] = useState<"saved" | "paste">("paste");
  const [language, setLanguage] = useState<"en" | "es">("es");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CVAdaptResponse | null>(null);
  const [activeTab, setActiveTab] = useState("input");

  // Load saved CV info
  const { data: savedCV } = useUserCV(userId || "");
  const { data: savedCVContent, isLoading: isLoadingCVContent } = useUserCVContent(
    userId || "",
    !!userId && cvSource === "saved" && savedCV?.has_cv
  );

  // Auto-select saved CV if available
  useEffect(() => {
    if (savedCV?.has_cv && !cvContent) {
      setCvSource("saved");
    }
  }, [savedCV, cvContent]);

  // Load saved CV content when selected
  useEffect(() => {
    if (cvSource === "saved" && savedCVContent) {
      setCvContent(savedCVContent);
    }
  }, [cvSource, savedCVContent]);

  const handleAdapt = async () => {
    if (!cvContent.trim()) {
      setError("Please paste your CV content");
      return;
    }

    if (!jobDescription && !jobUrl) {
      setError("Job description is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await jobsApi.adaptCV({
        cv_content: cvContent,
        job_description: jobDescription,
        job_url: jobUrl,
        job_title: jobTitle,
        company: company,
        language: language,
      });
      setResult(response);
      setActiveTab("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adapt CV");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => {
      setResult(null);
      setError(null);
      setActiveTab("input");
    }, 200);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Adapt CV & Generate Cover Letter
          </DialogTitle>
          <DialogDescription>
            AI will analyze the job requirements and adapt your CV, plus generate a personalized cover letter.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input" disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" />
              Input
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!result}>
              <Sparkles className="mr-2 h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Job Title</p>
                <p className="text-sm text-muted-foreground">{jobTitle}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Company</p>
                <p className="text-sm text-muted-foreground">{company}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your CV</Label>

              {/* CV Source Selection */}
              {savedCV?.has_cv && (
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={cvSource === "saved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCvSource("saved")}
                    disabled={isLoadingCVContent}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Use Saved CV
                    {isLoadingCVContent && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                  </Button>
                  <Button
                    type="button"
                    variant={cvSource === "paste" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCvSource("paste");
                      setCvContent("");
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Paste New
                  </Button>
                </div>
              )}

              {cvSource === "saved" && savedCV?.has_cv ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Using saved CV ({savedCV.text_length?.toLocaleString()} chars)
                    </span>
                  </div>
                  <Textarea
                    id="cv-content"
                    value={cvContent}
                    onChange={(e) => setCvContent(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder={isLoadingCVContent ? "Loading saved CV..." : ""}
                    disabled={isLoadingCVContent}
                  />
                </div>
              ) : (
                <>
                  <Textarea
                    id="cv-content"
                    placeholder="Paste your CV content here...&#10;&#10;Include your experience, skills, education, etc."
                    value={cvContent}
                    onChange={(e) => setCvContent(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Copy your CV from Word/PDF and paste here. Or upload your CV in Profile settings.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Output Language</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "es")}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="result" className="flex-1 overflow-auto space-y-4 mt-4">
            {result && (
              <>
                {/* Match Score */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${getMatchScoreColor(result.match_score)}`}>
                    {result.match_score}%
                  </div>
                  <div>
                    <p className="font-medium">Match Score</p>
                    <p className="text-sm text-muted-foreground">
                      {result.match_score >= 80 && "Excellent match! High chance of interview."}
                      {result.match_score >= 60 && result.match_score < 80 && "Good match. Worth applying."}
                      {result.match_score >= 40 && result.match_score < 60 && "Moderate match. Consider the gaps."}
                      {result.match_score < 40 && "Low match. Significant skill gaps."}
                    </p>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Skills Matched ({result.skills_matched.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.skills_matched.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-green-700 border-green-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Skills Missing ({result.skills_missing.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.skills_missing.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-red-700 border-red-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Changes Made */}
                {result.changes_made.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Changes Made</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {result.changes_made.map((change, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Highlights */}
                {result.key_highlights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Interview Talking Points</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {result.key_highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Sparkles className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Adapted CV */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Adapted CV
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(result.adapted_cv, "CV")}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(result.adapted_cv, `CV_${company}_${jobTitle}.txt`)}>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={result.adapted_cv}
                    readOnly
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Cover Letter
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(result.cover_letter, "Cover Letter")}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(result.cover_letter, `CoverLetter_${company}_${jobTitle}.txt`)}>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={result.cover_letter}
                    readOnly
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          {activeTab === "input" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAdapt} disabled={isLoading || !cvContent.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Adapting..." : "Adapt CV & Generate Cover Letter"}
              </Button>
            </>
          )}
          {activeTab === "result" && (
            <>
              <Button variant="outline" onClick={() => setActiveTab("input")}>
                Edit Input
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
