"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useUserCV, useUploadCV, useDeleteCV } from "@/lib/hooks/useUser";

interface CVUploadProps {
  userId: string;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function CVUpload({ userId }: CVUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const { data: cvData, isLoading: isLoadingCV } = useUserCV(userId);
  const uploadCV = useUploadCV();
  const deleteCV = useDeleteCV();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Validate file type
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      setUploadError("Invalid file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File too large. Maximum size is 5MB.");
      return;
    }

    try {
      const result = await uploadCV.mutateAsync({ userId, file });
      setUploadSuccess(result.message);
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload CV");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your CV?")) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      await deleteCV.mutateAsync(userId);
      setUploadSuccess("CV deleted successfully");
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to delete CV");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Base CV
        </CardTitle>
        <CardDescription>
          Upload your base CV (PDF, DOCX, or TXT). This will be used as the starting point
          when adapting your CV for specific jobs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingCV ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cvData?.has_cv ? (
          <div className="space-y-4">
            {/* Current CV Info */}
            <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Base CV</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">Uploaded</Badge>
                    <span className="text-sm text-muted-foreground">
                      {cvData.text_length?.toLocaleString()} characters
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteCV.isPending}
                className="text-destructive hover:text-destructive"
              >
                {deleteCV.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Preview */}
            {cvData.preview && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview</p>
                <div className="p-3 bg-muted rounded-lg max-h-32 overflow-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                    {cvData.preview}
                  </p>
                </div>
              </div>
            )}

            {/* Replace Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="cv-file-input"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadCV.isPending}
              >
                {uploadCV.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Replace CV
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="cv-file-input"
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload your CV</p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, or TXT (max 5MB)
              </p>
            </div>

            {uploadCV.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {uploadError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{uploadError}</p>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">{uploadSuccess}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
