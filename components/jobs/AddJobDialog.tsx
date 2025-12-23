"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateJob, useImportJobFromUrl } from "@/lib/hooks/useJobs"
import { Icons } from "@/components/icons"
import type { JobCreate } from "@/types/job"

const jobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().optional(),
  location: z.string().optional(),
  source_url: z.string().url("Please enter a valid URL"),
  description_raw: z.string().optional(),
  job_type: z.string().optional(),
})

const importUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
})

type JobFormData = z.infer<typeof jobSchema>
type ImportUrlFormData = z.infer<typeof importUrlSchema>

interface AddJobDialogProps {
  userId: string
  children: React.ReactNode
}

export function AddJobDialog({ userId, children }: AddJobDialogProps) {
  const [open, setOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const createJob = useCreateJob(userId)
  const importJob = useImportJobFromUrl(userId)

  const manualForm = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      source_url: "",
      description_raw: "",
      job_type: "",
    },
  })

  const importForm = useForm<ImportUrlFormData>({
    resolver: zodResolver(importUrlSchema),
    defaultValues: {
      url: "",
    },
  })

  const onManualSubmit = async (data: JobFormData) => {
    try {
      const jobData: JobCreate = {
        title: data.title,
        source_url: data.source_url,
        company: data.company || undefined,
        location: data.location || undefined,
        description_raw: data.description_raw || undefined,
        job_type: data.job_type || undefined,
      }

      await createJob.mutateAsync(jobData)
      manualForm.reset()
      setOpen(false)
    } catch (error) {
      console.error("Failed to create job:", error)
    }
  }

  const onImportSubmit = async (data: ImportUrlFormData) => {
    setImportError(null)
    setImportSuccess(null)

    try {
      const result = await importJob.mutateAsync(data.url)
      const scrapedFields = result.scraped_fields || []
      const fieldsInfo = scrapedFields.length > 0
        ? `Scraped: ${scrapedFields.join(", ")}`
        : ""
      setImportSuccess(
        `${result.message}${fieldsInfo ? ` ${fieldsInfo}` : ""}`
      )
      importForm.reset()
      // Auto-close after success
      setTimeout(() => {
        setOpen(false)
        setImportSuccess(null)
      }, 2500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import job from URL"
      setImportError(errorMessage)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      manualForm.reset()
      importForm.reset()
      setImportError(null)
      setImportSuccess(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
          <DialogDescription>
            Import from URL or enter job details manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import from URL</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 mt-4">
            <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import_url">Job Posting URL</Label>
                <Input
                  id="import_url"
                  type="url"
                  placeholder="https://linkedin.com/jobs/view/123456 or any job posting URL"
                  {...importForm.register("url")}
                />
                {importForm.formState.errors.url && (
                  <p className="text-sm text-red-500">{importForm.formState.errors.url.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Supported: LinkedIn, Indeed, Greenhouse, Lever, and most job posting pages.
                </p>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{importError}</p>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{importSuccess}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={importJob.isPending}>
                  {importJob.isPending && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Import Job
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Software Engineer"
                    {...manualForm.register("title")}
                  />
                  {manualForm.formState.errors.title && (
                    <p className="text-sm text-red-500">{manualForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Acme Inc."
                    {...manualForm.register("company")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Remote, New York, NY"
                    {...manualForm.register("location")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type</Label>
                  <Input
                    id="job_type"
                    placeholder="e.g., Full-time, Contract"
                    {...manualForm.register("job_type")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_url">Job URL *</Label>
                <Input
                  id="source_url"
                  type="url"
                  placeholder="https://example.com/jobs/123"
                  {...manualForm.register("source_url")}
                />
                {manualForm.formState.errors.source_url && (
                  <p className="text-sm text-red-500">{manualForm.formState.errors.source_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_raw">Job Description</Label>
                <Textarea
                  id="description_raw"
                  placeholder="Paste the job description here..."
                  rows={4}
                  {...manualForm.register("description_raw")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={manualForm.formState.isSubmitting || createJob.isPending}>
                  {(manualForm.formState.isSubmitting || createJob.isPending) && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Job
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
