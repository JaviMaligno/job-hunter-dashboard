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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, FileText, Mail, Sparkles, CheckCircle, XCircle, Copy, Download, Upload, ChevronDown, Plus, Pencil, Save } from "lucide-react";
import { jobsApi, type CVAdaptResponse, type CVEnhanceResponse } from "@/lib/api/jobs";
import { useUserCV, useUserCVContent } from "@/lib/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";

interface CVAdaptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string; // If provided, materials will be saved to this job
  jobTitle: string;
  company: string;
  jobDescription?: string;
  jobUrl?: string;
  userId?: string;
}

export function CVAdaptDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  company,
  jobDescription,
  jobUrl,
  userId,
}: CVAdaptDialogProps) {
  const queryClient = useQueryClient();
  const [cvContent, setCvContent] = useState("");
  const [cvSource, setCvSource] = useState<"saved" | "paste">("paste");
  const [language, setLanguage] = useState<"auto" | "en" | "es">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CVAdaptResponse | null>(null);
  const [activeTab, setActiveTab] = useState("input");

  // CV editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedCV, setEditedCV] = useState("");

  // Add skill dialog state
  const [addSkillDialogOpen, setAddSkillDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [skillExplanation, setSkillExplanation] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

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
        job_id: jobId, // Save materials to this job if provided
        cv_content: cvContent,
        job_description: jobDescription,
        job_url: jobUrl,
        job_title: jobTitle,
        company: company,
        language: language === "auto" ? undefined : language,
      });
      setResult(response);
      setActiveTab("result");

      // Invalidate materials query to refresh the list if materials were saved
      if (jobId && response.material_ids?.length) {
        queryClient.invalidateQueries({ queryKey: ["materials", jobId] });
      }
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

  const handleDownloadFormat = async (
    content: string,
    docType: "cv" | "cover_letter",
    format: "txt" | "docx" | "pdf"
  ) => {
    if (format === "txt") {
      const filename = docType === "cv"
        ? `CV_${company}_${jobTitle}.txt`
        : `CoverLetter_${company}_${jobTitle}.txt`;
      handleDownload(content, filename);
      return;
    }

    try {
      const blob = await jobsApi.generateDocument({
        content,
        format,
        doc_type: docType,
        job_title: jobTitle,
        company: company,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const typeName = docType === "cv" ? "CV" : "CoverLetter";
      a.download = `${typeName}_${company}_${jobTitle}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${format.toUpperCase()}`);
    }
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

  // Start editing the adapted CV
  const handleStartEditing = () => {
    if (result) {
      setEditedCV(result.adapted_cv);
      setIsEditing(true);
    }
  };

  // Save edited CV
  const handleSaveEditing = () => {
    if (result && editedCV) {
      setResult({
        ...result,
        adapted_cv: editedCV,
      });
      setIsEditing(false);
    }
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedCV("");
  };

  // Open add skill dialog
  const handleOpenAddSkillDialog = (skill: string) => {
    setSelectedSkill(skill);
    setSkillExplanation("");
    setAddSkillDialogOpen(true);
  };

  // Handle add skill with AI
  const handleAddSkillWithAI = async () => {
    if (!result || !skillExplanation.trim()) return;

    setIsEnhancing(true);
    try {
      const response = await jobsApi.enhanceCV({
        cv_content: result.adapted_cv,
        skill_name: selectedSkill,
        skill_explanation: skillExplanation,
        job_title: jobTitle,
        company: company,
      });

      // Update the result with the enhanced CV
      setResult({
        ...result,
        adapted_cv: response.enhanced_cv,
        skills_missing: result.skills_missing.filter((s) => s !== selectedSkill),
        skills_matched: [...result.skills_matched, selectedSkill],
        changes_made: [...result.changes_made, ...response.changes_made],
      });

      setAddSkillDialogOpen(false);
      setSelectedSkill("");
      setSkillExplanation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance CV");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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

          <TabsContent value="input" className="flex-1 overflow-auto space-y-4 mt-4 px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Select value={language} onValueChange={(v) => setLanguage(v as "auto" | "en" | "es")}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
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

          <TabsContent value="result" className="flex-1 overflow-auto space-y-4 mt-4 px-1">
            {result && (
              <>
                {/* Match Score & Language */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${getMatchScoreColor(result.match_score)}`}>
                    {result.match_score}%
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Match Score</p>
                    <p className="text-sm text-muted-foreground">
                      {result.match_score >= 80 && "Excellent match! High chance of interview."}
                      {result.match_score >= 60 && result.match_score < 80 && "Good match. Worth applying."}
                      {result.match_score >= 40 && result.match_score < 60 && "Moderate match. Consider the gaps."}
                      {result.match_score < 40 && "Low match. Significant skill gaps."}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {result.detected_language === "es" ? "🇪🇸 Spanish" : "🇬🇧 English"}
                  </Badge>
                </div>

                {/* Skills Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-red-700 border-red-300 cursor-pointer hover:bg-red-50 transition-colors"
                          onClick={() => handleOpenAddSkillDialog(skill)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click a skill to add it to your CV
                    </p>
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
                      {isEditing && (
                        <Badge variant="secondary" className="text-xs">
                          Editing
                        </Badge>
                      )}
                    </p>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleCancelEditing}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveEditing}>
                            <Save className="h-3 w-3 mr-1" />
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={handleStartEditing}>
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit CV
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopy(result.adapted_cv, "CV")}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleDownloadFormat(result.adapted_cv, "cv", "txt")}>
                                TXT (Plain Text)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadFormat(result.adapted_cv, "cv", "docx")}>
                                DOCX (Word)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadFormat(result.adapted_cv, "cv", "pdf")}>
                                PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={isEditing ? editedCV : result.adapted_cv}
                    onChange={(e) => isEditing && setEditedCV(e.target.value)}
                    readOnly={!isEditing}
                    rows={8}
                    className={`font-mono text-xs ${isEditing ? "border-purple-400 focus:border-purple-500" : ""}`}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDownloadFormat(result.cover_letter, "cover_letter", "txt")}>
                            TXT (Plain Text)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadFormat(result.cover_letter, "cover_letter", "docx")}>
                            DOCX (Word)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadFormat(result.cover_letter, "cover_letter", "pdf")}>
                            PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Add Skill Dialog */}
      <Dialog open={addSkillDialogOpen} onOpenChange={setAddSkillDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Add &ldquo;{selectedSkill}&rdquo; to your CV
            </DialogTitle>
            <DialogDescription>
              Explain your experience with this skill in detail. The more context you provide, the better the AI can integrate it naturally into your CV.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 py-4">
            {/* Guidance Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">What to include:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Projects:</strong> Where and how you used {selectedSkill}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Experience level:</strong> Years, proficiency (beginner/intermediate/expert)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Achievements:</strong> Results, metrics, impact you delivered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Context:</strong> Why you learned it, courses, certifications</span>
                </li>
              </ul>
            </div>

            {/* Main Textarea */}
            <div className="space-y-2">
              <Label htmlFor="skill-explanation" className="text-base font-medium">
                Your experience with {selectedSkill}
              </Label>
              <Textarea
                id="skill-explanation"
                placeholder={`Example for "${selectedSkill}":

I have 3 years of experience with ${selectedSkill}, primarily using it in my role at [Company] where I:

- Led the implementation of [specific project] using ${selectedSkill}
- Achieved [specific result/metric] by applying ${selectedSkill} to [problem]
- Collaborated with the team to [outcome]

I learned ${selectedSkill} through [course/self-study/work] and have [certification if any].

The more detail you provide, the better the AI can enhance your CV!`}
                value={skillExplanation}
                onChange={(e) => setSkillExplanation(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Be as detailed as possible - this context helps the AI write better content</span>
                <span>{skillExplanation.length} characters</span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick add context:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  `I have used ${selectedSkill} in production environments`,
                  `I learned ${selectedSkill} through online courses`,
                  `I have professional experience with ${selectedSkill}`,
                  `I have built personal projects using ${selectedSkill}`,
                ].map((text, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setSkillExplanation((prev) => prev ? `${prev}\n${text}` : text)}
                  >
                    + {text.substring(0, 30)}...
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setAddSkillDialogOpen(false)} disabled={isEnhancing}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSkillWithAI}
              disabled={!skillExplanation.trim() || isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enhancing CV...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enhance CV with this skill
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
