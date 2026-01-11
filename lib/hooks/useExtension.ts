"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ExtensionStatus {
  connected: boolean;
}

interface LocalApplicationResult {
  success: boolean;
  session_id?: string;
  tab_id?: number;
  form_fields?: FormField[];
  fill_instructions?: FillInstruction[];
  error?: string;
}

interface FormField {
  selector: string;
  field_id?: string;
  field_name?: string;
  field_type: string;
  tag_name: string;
  placeholder?: string;
  required: boolean;
  label?: string;
}

interface FillInstruction {
  selector: string;
  value: string;
  field_name?: string;
  confidence: number;
}

interface StartLocalApplicationInput {
  job_url: string;
  user_id: string;
  cv_content?: string;
  cover_letter?: string;
}

/**
 * Hook for interacting with the Job Hunter Chrome extension.
 *
 * Provides:
 * - Extension connection status
 * - Methods to start local browser applications
 * - Real-time fill progress updates
 */
export function useExtension() {
  const queryClient = useQueryClient();
  const [fillProgress, setFillProgress] = useState<{
    field: string;
    success: boolean;
  } | null>(null);

  // Check extension connection status
  const {
    data: extensionStatus,
    isLoading: isCheckingStatus,
    refetch: checkStatus,
  } = useQuery<ExtensionStatus>({
    queryKey: ["extension-status"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/extension/status`);
      if (!response.ok) {
        throw new Error("Failed to check extension status");
      }
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });

  const isExtensionConnected = extensionStatus?.connected ?? false;

  // Test extension connection
  const testExtension = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/extension/test`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Extension test failed");
      }
      return response.json();
    },
  });

  // Start local application
  const startLocalApplication = useMutation({
    mutationFn: async (
      input: StartLocalApplicationInput
    ): Promise<LocalApplicationResult> => {
      const response = await fetch(
        `${API_URL}/api/applications/v2/local/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start local application");
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh application list
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  // Execute fill commands on extension
  const executeFill = useMutation({
    mutationFn: async (params: {
      tab_id: number;
      instructions: FillInstruction[];
    }) => {
      const response = await fetch(
        `${API_URL}/api/applications/v2/local/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tab_id: params.tab_id,
            instructions: params.instructions,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to execute fill commands");
      }
      return response.json();
    },
  });

  // Manual refresh of extension status
  const refreshStatus = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    // Status
    isExtensionConnected,
    isCheckingStatus,

    // Actions
    testExtension: testExtension.mutateAsync,
    isTestingExtension: testExtension.isPending,
    testResult: testExtension.data,

    startLocalApplication: startLocalApplication.mutateAsync,
    isStartingApplication: startLocalApplication.isPending,

    executeFill: executeFill.mutateAsync,
    isExecutingFill: executeFill.isPending,

    // Progress
    fillProgress,

    // Utilities
    refreshStatus,
  };
}

/**
 * Hook for local application flow management.
 *
 * Manages the step-by-step process of:
 * 1. Opening the job page in user's browser
 * 2. Analyzing form fields
 * 3. Generating fill instructions
 * 4. Executing fills with user confirmation
 */
export function useLocalApplicationFlow(jobUrl: string, userId: string) {
  const extension = useExtension();
  const [step, setStep] = useState<
    "idle" | "opening" | "analyzing" | "ready" | "filling" | "completed" | "error"
  >("idle");
  const [tabId, setTabId] = useState<number | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [fillInstructions, setFillInstructions] = useState<FillInstruction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filledCount, setFilledCount] = useState(0);

  // Start the local application flow
  const start = useCallback(
    async (cvContent?: string, coverLetter?: string) => {
      if (!extension.isExtensionConnected) {
        setError("Chrome extension not connected. Please connect it first.");
        setStep("error");
        return;
      }

      setStep("opening");
      setError(null);

      try {
        const result = await extension.startLocalApplication({
          job_url: jobUrl,
          user_id: userId,
          cv_content: cvContent,
          cover_letter: coverLetter,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to start application");
        }

        setTabId(result.tab_id || null);
        setFormFields(result.form_fields || []);
        setFillInstructions(result.fill_instructions || []);
        setStep("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStep("error");
      }
    },
    [extension, jobUrl, userId]
  );

  // Execute the fill instructions
  const executeFills = useCallback(async () => {
    if (!tabId || fillInstructions.length === 0) {
      return;
    }

    setStep("filling");
    setFilledCount(0);

    try {
      const result = await extension.executeFill({
        tab_id: tabId,
        instructions: fillInstructions,
      });

      setFilledCount(result.filled || fillInstructions.length);
      setStep("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fill execution failed");
      setStep("error");
    }
  }, [extension, tabId, fillInstructions]);

  // Reset the flow
  const reset = useCallback(() => {
    setStep("idle");
    setTabId(null);
    setFormFields([]);
    setFillInstructions([]);
    setError(null);
    setFilledCount(0);
  }, []);

  return {
    // State
    step,
    tabId,
    formFields,
    fillInstructions,
    error,
    filledCount,
    totalFields: fillInstructions.length,

    // Extension status
    isExtensionConnected: extension.isExtensionConnected,

    // Actions
    start,
    executeFills,
    reset,

    // Loading states
    isStarting: step === "opening" || step === "analyzing",
    isFilling: step === "filling",
  };
}
