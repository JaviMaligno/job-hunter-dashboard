"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { JobStatus } from "@/types/job"

interface SearchFilters {
  q?: string
  status?: JobStatus
  company?: string
  location?: string
}

interface SearchFilterBarProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  isSearching?: boolean
  resultCount?: number
}

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: JobStatus.INBOX, label: "Inbox" },
  { value: JobStatus.INTERESTING, label: "Interesting" },
  { value: JobStatus.ADAPTED, label: "CV Adapted" },
  { value: JobStatus.READY, label: "Ready" },
  { value: JobStatus.APPLIED, label: "Applied" },
  { value: JobStatus.BLOCKED, label: "Blocked" },
  { value: JobStatus.REJECTED, label: "Rejected" },
  { value: JobStatus.ARCHIVED, label: "Archived" },
]

export function SearchFilterBar({
  onSearch,
  onClear,
  isSearching = false,
  resultCount,
}: SearchFilterBarProps) {
  const [query, setQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | undefined>()
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = useCallback(() => {
    onSearch({
      q: query || undefined,
      status: selectedStatus,
    })
  }, [query, selectedStatus, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleClear = () => {
    setQuery("")
    setSelectedStatus(undefined)
    onClear()
  }

  const hasActiveFilters = query || selectedStatus

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, company, location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-accent" : ""}
        >
          <Icons.filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClear}>
            <Icons.x className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
          <span className="text-sm text-muted-foreground mr-2">Status:</span>
          {STATUS_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={selectedStatus === option.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === option.value ? undefined : option.value
                )
              }
            >
              {option.label}
            </Badge>
          ))}
        </div>
      )}

      {resultCount !== undefined && hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Found {resultCount} job{resultCount !== 1 ? "s" : ""}
          {query && ` matching "${query}"`}
        </p>
      )}
    </div>
  )
}
